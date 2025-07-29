#!/bin/bash

# Database Migration Script for Church Management System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment variables
if [ -f .env ]; then
    source .env
else
    print_error ".env file not found"
    exit 1
fi

# Default values
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-postgres}
CONTAINER_NAME=${1:-postgres}

print_status "Starting database migration for Church Management System..."

# Check if container is running
if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    print_error "PostgreSQL container '${CONTAINER_NAME}' is not running."
    print_status "Starting container..."
    docker-compose up -d postgres
    sleep 10
fi

# Function to execute SQL file
execute_sql_file() {
    local file=$1
    local description=$2
    
    print_status "Executing: $description"
    
    if [ ! -f "$file" ]; then
        print_error "Migration file not found: $file"
        return 1
    fi
    
    if docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -v ON_ERROR_STOP=1 < "$file"; then
        print_success "✅ $description completed"
    else
        print_error "❌ $description failed"
        return 1
    fi
}

# Function to check if migration was already applied
check_migration() {
    local migration_name=$1
    
    # Check if migrations table exists and if this migration was applied
    docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'applied_migrations'
        );
    " 2>/dev/null | grep -q "t" && \
    docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "
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
    docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
        CREATE TABLE IF NOT EXISTS applied_migrations (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT NOW()
        );
    " >/dev/null 2>&1
    
    # Mark migration as applied
    docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
        INSERT INTO applied_migrations (migration_name) 
        VALUES ('$migration_name') 
        ON CONFLICT (migration_name) DO NOTHING;
    " >/dev/null 2>&1
}

# Create auth schema if it doesn't exist (required for Supabase)
print_status "Setting up authentication schema..."
docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
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
    
    -- Create auth.uid() function for compatibility
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

# Array of migration files in order
migrations=(
    "supabase/migrations/01_initial_schema.sql:Initial Database Schema"
    "supabase/migrations/02_rls_policies.sql:Row Level Security Policies"
    "supabase/migrations/03_functions_and_triggers.sql:Database Functions and Triggers"
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
fund_count=$(docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "
    SELECT COUNT(*) FROM fund_types;
" 2>/dev/null || echo "0")

if [ "$fund_count" = "0" ]; then
    print_status "Creating default fund types..."
    docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
        INSERT INTO fund_types (name, description, opening_balance, current_balance) VALUES
        ('General Fund', 'General church operations and activities', 0, 0),
        ('Building Fund', 'Church building maintenance and construction', 0, 0),
        ('Missions Fund', 'Missionary work and outreach programs', 0, 0),
        ('Youth Ministry', 'Youth programs and activities', 0, 0),
        ('Benevolence Fund', 'Helping those in need within the congregation', 0, 0);
    " >/dev/null 2>&1
    print_success "Default fund types created"
fi

# Create default departments if needed
dept_count=$(docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "
    SELECT COUNT(*) FROM departments;
" 2>/dev/null || echo "0")

if [ "$dept_count" = "0" ]; then
    print_status "Creating default departments..."
    docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
        INSERT INTO departments (name, description) VALUES
        ('Administration', 'Church administration and leadership'),
        ('Finance', 'Financial management and accounting'),
        ('Worship', 'Worship services and music ministry'),
        ('Youth Ministry', 'Youth programs and activities'),
        ('Missions', 'Missionary work and outreach'),
        ('Facilities', 'Building maintenance and operations');
    " >/dev/null 2>&1
    print_success "Default departments created"
fi

# Display migration summary
print_success "🎉 Database migration completed successfully!"

echo ""
print_status "Database Summary:"
echo "  📊 Tables: $(docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")"
echo "  🔧 Functions: $(docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';")"
echo "  🛡️  RLS Policies: $(docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "SELECT COUNT(*) FROM pg_policies;")"

echo ""
print_warning "Next Steps:"
echo "  1. Start the application services"
echo "  2. Create your first administrator user"
echo "  3. Configure organization settings"
echo "  4. Set up email notifications (SMTP)"

echo ""
print_success "Migration script completed! 🚀"