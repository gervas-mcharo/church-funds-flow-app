#!/bin/bash

# Database Migration Script for Church Management System
# Uses Docker Compose service names instead of container names for consistency

set -e

# Source common functions
source "$(dirname "$0")/common.sh"

print_status "Starting database migration for Church Management System..."

# Load environment variables
load_env || exit 1

# Default values
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-postgres}
POSTGRES_SERVICE=${1:-postgres}  # Service name, not container name

# Determine which compose file to use based on environment
if [ -f docker-compose.dev.yml ] && [ "$ENVIRONMENT" = "development" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
elif [ -f docker-compose.yml ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    print_error "No docker-compose file found!"
    exit 1
fi

print_status "Using compose file: $COMPOSE_FILE"
print_status "PostgreSQL service: $POSTGRES_SERVICE"

# Check if service is defined in compose file
if ! run_compose -f $COMPOSE_FILE config --services | grep -q "^${POSTGRES_SERVICE}$"; then
    print_error "Service '${POSTGRES_SERVICE}' not found in $COMPOSE_FILE"
    print_status "Available services:"
    run_compose -f $COMPOSE_FILE config --services
    exit 1
fi

# Check if PostgreSQL service is running
check_postgres_running() {
    run_compose -f $COMPOSE_FILE ps --format "table {{.Service}}\t{{.Status}}" | grep -E "^${POSTGRES_SERVICE}\s+" | grep -q "Up\|running"
}

# Start PostgreSQL if not running
if ! check_postgres_running; then
    print_warning "PostgreSQL service '${POSTGRES_SERVICE}' is not running"
    print_status "Starting PostgreSQL service..."
    
    if ! run_compose -f $COMPOSE_FILE up -d $POSTGRES_SERVICE; then
        print_error "Failed to start PostgreSQL service"
        exit 1
    fi
    
    # Wait for service to be ready
    print_status "Waiting for PostgreSQL to initialize..."
    sleep 10
fi

# Function to execute commands in the PostgreSQL service
exec_postgres() {
    run_compose -f $COMPOSE_FILE exec -T $POSTGRES_SERVICE "$@"
}

# Function to execute SQL via psql in the service
exec_sql() {
    exec_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB "$@"
}

# Function to execute SQL from stdin
exec_sql_stdin() {
    run_compose -f $COMPOSE_FILE exec -T $POSTGRES_SERVICE psql -U $POSTGRES_USER -d $POSTGRES_DB
}

# Test database connectivity
print_status "Testing database connectivity..."
retry_count=0
max_retries=30

while [ $retry_count -lt $max_retries ]; do
    if exec_postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB >/dev/null 2>&1; then
        print_success "Database is ready!"
        break
    fi
    
    if [ $((retry_count % 5)) -eq 0 ]; then
        echo -n "  Waiting for database"
    fi
    echo -n "."
    
    sleep 2
    ((retry_count++))
done

if [ $retry_count -eq $max_retries ]; then
    print_error "Database is not responding after $max_retries attempts"
    print_status "Service status:"
    run_compose -f $COMPOSE_FILE ps $POSTGRES_SERVICE
    print_status "Service logs (last 20 lines):"
    run_compose -f $COMPOSE_FILE logs --tail=20 $POSTGRES_SERVICE
    exit 1
fi

echo "" # New line after dots

# Function to check for initialization conflicts
check_for_init_conflicts() {
    local has_conflict=false
    
    # Check if auth schema exists (indicates Supabase/Docker init ran)
    if exec_sql -tAc "
        SELECT EXISTS (
            SELECT FROM information_schema.schemata 
            WHERE schema_name = 'auth'
        );
    " 2>/dev/null | grep -q "t"; then
        print_warning "Auth schema already exists (possibly from Docker initialization)"
        
        # Check if user_roles table exists
        if ! exec_sql -tAc "
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_roles'
            );
        " 2>/dev/null | grep -q "t"; then
            print_error "Conflict detected: Auth schema exists but user_roles table is missing"
            has_conflict=true
        fi
    fi
    
    if [ "$has_conflict" = true ]; then
        print_status "Attempting to fix initialization conflicts..."
        
        # Drop problematic functions that reference non-existent tables
        exec_sql -c "
            DROP FUNCTION IF EXISTS public.current_user_has_admin_role() CASCADE;
            DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;
        " 2>/dev/null || true
        
        print_success "Cleaned up conflicting functions"
    fi
}

# Function to execute SQL file
execute_sql_file() {
    local file=$1
    local description=$2
    
    print_status "Executing: $description"
    
    if [ ! -f "$file" ]; then
        print_error "Migration file not found: $file"
        return 1
    fi
    
    # Execute with better error handling
    if exec_sql_stdin < "$file" 2>&1 | tee /tmp/migration_output.log; then
        print_success "✅ $description completed"
    else
        print_error "❌ $description failed"
        print_error "Error details:"
        cat /tmp/migration_output.log | grep -E "ERROR|DETAIL|HINT" || true
        return 1
    fi
}

# Function to check if migration was already applied
check_migration() {
    local migration_name=$1
    
    # Check if migrations table exists and if this migration was applied
    exec_sql -tAc "
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'applied_migrations'
        );
    " 2>/dev/null | grep -q "t" && \
    exec_sql -tAc "
        SELECT EXISTS (
            SELECT 1 FROM applied_migrations 
            WHERE migration_name = '$migration_name'
        );
    " 2>/dev/null | grep -q "t"
}

# Function to mark migration as applied
mark_migration_applied() {
    local migration_name=$1
    
    # Create migrations table if it doesn't exist
    exec_sql -c "
        CREATE TABLE IF NOT EXISTS applied_migrations (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT NOW()
        );
    " >/dev/null 2>&1
    
    # Mark migration as applied
    exec_sql -c "
        INSERT INTO applied_migrations (migration_name) 
        VALUES ('$migration_name') 
        ON CONFLICT (migration_name) DO NOTHING;
    " >/dev/null 2>&1
}

# Check for and fix any initialization conflicts
print_status "Checking for initialization conflicts..."
check_for_init_conflicts

# Create auth schema if it doesn't exist (required for Supabase)
print_status "Setting up authentication schema..."
exec_sql -c "
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS storage;
    
    -- Create basic auth.users table structure for development
    CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE,
        encrypted_password VARCHAR(255),
        email_confirmed_at TIMESTAMPTZ,
        invited_at TIMESTAMPTZ,
        confirmation_token VARCHAR(255),
        confirmation_sent_at TIMESTAMPTZ,
        recovery_token VARCHAR(255),
        recovery_sent_at TIMESTAMPTZ,
        email_change_token VARCHAR(255),
        email_change VARCHAR(255),
        email_change_sent_at TIMESTAMPTZ,
        last_sign_in_at TIMESTAMPTZ,
        raw_app_meta_data JSONB,
        raw_user_meta_data JSONB,
        is_super_admin BOOLEAN,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        phone VARCHAR(15),
        phone_confirmed_at TIMESTAMPTZ,
        phone_change VARCHAR(15),
        phone_change_token VARCHAR(255),
        phone_change_sent_at TIMESTAMPTZ,
        confirmed_at TIMESTAMPTZ GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
        email_change_confirm_status SMALLINT DEFAULT 0,
        banned_until TIMESTAMPTZ,
        reauthentication_token VARCHAR(255),
        reauthentication_sent_at TIMESTAMPTZ,
        is_sso_user BOOLEAN NOT NULL DEFAULT FALSE,
        deleted_at TIMESTAMPTZ
    );
    
    -- Create auth.uid() function for compatibility (drop first if exists)
    DROP FUNCTION IF EXISTS auth.uid() CASCADE;
    
    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS UUID
    LANGUAGE sql
    STABLE
    AS \$\$
        SELECT COALESCE(
            NULLIF(current_setting('request.jwt.claim.sub', true), ''),
            (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
        )::uuid
    \$\$;
" >/dev/null 2>&1

print_success "Authentication schema ready"

# Array of migration files in correct order
migrations=(
    "scripts/sql/01_initial_schema.sql:Initial Database Schema"
    "scripts/sql/03_functions_and_triggers.sql:Database Functions and Triggers"
    "scripts/sql/02_rls_policies.sql:Row Level Security Policies"
)

# Apply migrations
print_status "Applying database migrations..."
failed_migrations=()

for migration_info in "${migrations[@]}"; do
    IFS=':' read -r file description <<< "$migration_info"
    migration_name=$(basename "$file" .sql)
    
    if check_migration "$migration_name"; then
        print_status "⏭️  Skipping $description (already applied)"
        continue
    fi
    
    if execute_sql_file "$file" "$description"; then
        mark_migration_applied "$migration_name"
    else
        failed_migrations+=("$description")
    fi
done

# Check for failures
if [ ${#failed_migrations[@]} -ne 0 ]; then
    print_error "The following migrations failed:"
    for migration in "${failed_migrations[@]}"; do
        echo "  - $migration"
    done
    exit 1
fi

# Create default data if needed
print_status "Setting up default data..."

# Check if we need to create default fund types
fund_count=$(exec_sql -tAc "SELECT COUNT(*) FROM fund_types;" 2>/dev/null || echo "0")

if [ "$fund_count" = "0" ]; then
    print_status "Creating default fund types..."
    exec_sql -c "
        INSERT INTO fund_types (name, description, opening_balance, current_balance) VALUES
        ('General Fund', 'General church operations and activities', 0, 0),
        ('Building Fund', 'Church building maintenance and construction', 0, 0),
        ON CONFLICT DO NOTHING;
    " >/dev/null 2>&1
    print_success "Default fund types created"
fi

# Create default departments if needed
dept_count=$(exec_sql -tAc "SELECT COUNT(*) FROM departments;" 2>/dev/null || echo "0")

if [ "$dept_count" = "0" ]; then
    print_status "Creating default departments..."
    exec_sql -c "
        INSERT INTO departments (name, description) VALUES
        ('Administration', 'Church administration and leadership'),
        ('Finance', 'Financial management and accounting'),
        ON CONFLICT DO NOTHING;
    " >/dev/null 2>&1
    print_success "Default departments created"
fi

# Display migration summary
print_success "🎉 Database migration completed successfully!"

echo ""
print_status "Database Summary:"
echo "  📊 Tables: $(exec_sql -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)"
echo "  🔧 Functions: $(exec_sql -tAc "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';" | xargs)"
echo "  🛡️  RLS Policies: $(exec_sql -tAc "SELECT COUNT(*) FROM pg_policies;" | xargs)"

echo ""
print_warning "Next Steps:"
echo "  1. Start the application services"
echo "  2. Create your first administrator user"
echo "  3. Configure organization settings"
echo "  4. Set up email notifications (SMTP)"

echo ""
print_success "Migration script completed! 🚀"