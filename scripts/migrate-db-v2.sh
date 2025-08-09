#!/bin/bash

# Enhanced Database Migration Script for Church Management System
# Supports both local and cloud Supabase deployments

set -e

# Source common functions
source "$(dirname "$0")/common.sh"

print_status "Starting enhanced database migration for Church Management System..."

# Load environment variables
load_env || exit 1

# Detect environment mode
SUPABASE_MODE=${SUPABASE_MODE:-local}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-postgres}

print_status "Detected mode: $SUPABASE_MODE"

# Determine migration strategy based on mode
case "$SUPABASE_MODE" in
    "local")
        print_status "Using local PostgreSQL container for migrations"
        POSTGRES_SERVICE=${1:-postgres}
        
        # Determine compose file
        if [ -f docker-compose.local.yml ]; then
            COMPOSE_FILE="docker-compose.local.yml"
        elif [ -f docker-compose.dev.yml ]; then
            COMPOSE_FILE="docker-compose.dev.yml"
        else
            print_error "No suitable compose file found for local mode"
            exit 1
        fi
        ;;
    "cloud")
        print_status "Using cloud Supabase for migrations"
        if [ -z "$SUPABASE_CLOUD_URL" ] || [ -z "$SUPABASE_CLOUD_SERVICE_KEY" ]; then
            print_error "Cloud Supabase credentials not configured"
            print_status "Please set SUPABASE_CLOUD_URL and SUPABASE_CLOUD_SERVICE_KEY"
            exit 1
        fi
        ;;
    *)
        print_error "Unknown SUPABASE_MODE: $SUPABASE_MODE"
        exit 1
        ;;
esac

# Function to execute SQL in local PostgreSQL
exec_local_sql() {
    if [ "$SUPABASE_MODE" = "local" ]; then
        run_compose -f $COMPOSE_FILE exec -T $POSTGRES_SERVICE psql -U $POSTGRES_USER -d $POSTGRES_DB "$@"
    else
        print_error "exec_local_sql called in non-local mode"
        exit 1
    fi
}

# Function to execute SQL via Supabase API
exec_cloud_sql() {
    local sql="$1"
    
    # Use Supabase client to execute SQL
    curl -X POST \
        -H "Authorization: Bearer $SUPABASE_CLOUD_SERVICE_KEY" \
        -H "Content-Type: application/json" \
        -H "apikey: $SUPABASE_CLOUD_SERVICE_KEY" \
        -d "{\"query\": \"$sql\"}" \
        "$SUPABASE_CLOUD_URL/rest/v1/rpc/exec_sql" \
        --fail --silent
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
    
    case "$SUPABASE_MODE" in
        "local")
            if exec_local_sql < "$file" 2>&1 | tee /tmp/migration_output.log; then
                print_success "✅ $description completed"
            else
                print_error "❌ $description failed"
                print_error "Error details:"
                cat /tmp/migration_output.log | grep -E "ERROR|DETAIL|HINT" || true
                return 1
            fi
            ;;
        "cloud")
            # For cloud mode, we'll use the supabase migration tool
            print_status "Cloud migrations should be handled via Supabase Dashboard or CLI"
            print_warning "Please apply the following SQL manually to your cloud instance:"
            echo "--- Begin SQL ---"
            cat "$file"
            echo "--- End SQL ---"
            ;;
    esac
}

# Function to check if migration was already applied
check_migration() {
    local migration_name=$1
    
    case "$SUPABASE_MODE" in
        "local")
            exec_local_sql -tAc "
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'schema_migrations'
                );
            " 2>/dev/null | grep -q "t" && \
            exec_local_sql -tAc "
                SELECT EXISTS (
                    SELECT 1 FROM schema_migrations 
                    WHERE version = '$migration_name'
                );
            " 2>/dev/null | grep -q "t"
            ;;
        "cloud")
            # For cloud, assume migrations need to be applied manually
            return 1
            ;;
    esac
}

# Function to mark migration as applied
mark_migration_applied() {
    local migration_name=$1
    
    case "$SUPABASE_MODE" in
        "local")
            exec_local_sql -c "
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(255) PRIMARY KEY,
                    inserted_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                INSERT INTO schema_migrations (version) 
                VALUES ('$migration_name') 
                ON CONFLICT (version) DO NOTHING;
            " >/dev/null 2>&1
            ;;
        "cloud")
            print_status "Mark migration '$migration_name' as applied in your cloud instance"
            ;;
    esac
}

# Main migration logic for local mode
run_local_migrations() {
    print_status "Setting up local database connection..."
    
    # Check if PostgreSQL service is running
    if ! run_compose -f $COMPOSE_FILE ps --format "table {{.Service}}\t{{.Status}}" | grep -E "^${POSTGRES_SERVICE}\s+" | grep -q "Up\|running"; then
        print_warning "PostgreSQL service '${POSTGRES_SERVICE}' is not running"
        print_status "Starting PostgreSQL service..."
        
        if ! run_compose -f $COMPOSE_FILE up -d $POSTGRES_SERVICE; then
            print_error "Failed to start PostgreSQL service"
            exit 1
        fi
        
        # Wait for service to be ready
        print_status "Waiting for PostgreSQL to initialize..."
        sleep 15
    fi
    
    # Test database connectivity
    print_status "Testing database connectivity..."
    local retry_count=0
    local max_retries=30
    
    while [ $retry_count -lt $max_retries ]; do
        if exec_local_sql -c "SELECT 1;" >/dev/null 2>&1; then
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
        exit 1
    fi
    
    echo "" # New line after dots
    
    # Apply migrations
    apply_migrations
}

# Main migration logic for cloud mode
run_cloud_migrations() {
    print_status "Preparing migrations for cloud Supabase..."
    print_warning "Cloud migrations must be applied manually via Supabase Dashboard or CLI"
    
    echo ""
    print_status "Migration files to apply:"
    
    # List all migration files
    local migration_files=(
        "supabase/init/01_supabase_schemas.sql:Supabase System Schemas"
        "scripts/sql/01_initial_schema.sql:Initial Database Schema"
        "scripts/sql/03_functions_and_triggers.sql:Database Functions and Triggers"
        "scripts/sql/02_rls_policies.sql:Row Level Security Policies"
    )
    
    for migration_info in "${migration_files[@]}"; do
        IFS=':' read -r file description <<< "$migration_info"
        if [ -f "$file" ]; then
            echo "  - $description ($file)"
        fi
    done
    
    echo ""
    print_status "To apply migrations to cloud Supabase:"
    echo "  1. Go to Supabase Dashboard > SQL Editor"
    echo "  2. Copy and execute each migration file in order"
    echo "  3. Or use 'supabase db push' with Supabase CLI"
    
    # Optionally create a combined migration file for cloud
    create_cloud_migration_file
}

# Create a single migration file for cloud deployment
create_cloud_migration_file() {
    local cloud_migration_file="migrations_for_cloud.sql"
    
    print_status "Creating combined migration file: $cloud_migration_file"
    
    cat > "$cloud_migration_file" << 'EOF'
-- Combined Migration File for Cloud Supabase
-- Generated by Church Management System migration script
-- Apply this file via Supabase Dashboard or CLI

-- IMPORTANT: This file contains all necessary migrations
-- Apply in the Supabase SQL Editor or via CLI

EOF
    
    # Add each migration file
    local migration_files=(
        "scripts/sql/01_initial_schema.sql"
        "scripts/sql/03_functions_and_triggers.sql"
        "scripts/sql/02_rls_policies.sql"
    )
    
    for file in "${migration_files[@]}"; do
        if [ -f "$file" ]; then
            echo "" >> "$cloud_migration_file"
            echo "-- ==============================================" >> "$cloud_migration_file"
            echo "-- Migration: $file" >> "$cloud_migration_file"
            echo "-- ==============================================" >> "$cloud_migration_file"
            cat "$file" >> "$cloud_migration_file"
        fi
    done
    
    print_success "Combined migration file created: $cloud_migration_file"
    print_status "Apply this file to your cloud Supabase instance"
}

# Apply migrations (common logic)
apply_migrations() {
    local migration_files=(
        "scripts/sql/01_initial_schema.sql:Initial Database Schema"
        "scripts/sql/03_functions_and_triggers.sql:Database Functions and Triggers"
        "scripts/sql/02_rls_policies.sql:Row Level Security Policies"
    )
    
    print_status "Applying database migrations..."
    local failed_migrations=()
    
    for migration_info in "${migration_files[@]}"; do
        IFS=':' read -r file description <<< "$migration_info"
        local migration_name=$(basename "$file" .sql)
        
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
    
    print_success "🎉 Database migrations completed successfully!"
}

# Main execution
main() {
    case "$SUPABASE_MODE" in
        "local")
            run_local_migrations
            ;;
        "cloud")
            run_cloud_migrations
            ;;
        *)
            print_error "Unknown SUPABASE_MODE: $SUPABASE_MODE"
            exit 1
            ;;
    esac
    
    print_success "Migration script completed! 🚀"
}

main "$@"