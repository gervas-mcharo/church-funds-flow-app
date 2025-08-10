#!/bin/bash

# Supabase Migration Management Script
# Handles database schema migration and management

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/common.sh"

# Migration configuration
MIGRATIONS_DIR="$PROJECT_ROOT/supabase/migrations"
SQL_DIR="$PROJECT_ROOT/scripts/sql"

print_banner() {
    echo ""
    echo "========================================"
    echo "  Supabase Migration Manager"
    echo "========================================"
    echo ""
}

# Convert old SQL scripts to Supabase migrations
convert_legacy_scripts() {
    print_status "Converting legacy SQL scripts to Supabase migrations..."
    
    # Create migrations directory if it doesn't exist
    mkdir -p "$MIGRATIONS_DIR"
    
    # Generate timestamp for migration
    local timestamp=$(date -u +"%Y%m%d%H%M%S")
    
    # Combine all legacy scripts into a single migration
    local migration_file="$MIGRATIONS_DIR/${timestamp}_initial_schema.sql"
    
    cat > "$migration_file" << 'EOF'
-- Initial schema migration
-- Converted from legacy SQL scripts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
DO $$ BEGIN
    -- Create app_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM (
            'super_administrator',
            'administrator', 
            'finance_administrator',
            'finance_manager',
            'finance_elder',
            'treasurer',
            'department_treasurer',
            'head_of_department',
            'data_entry_clerk',
            'general_secretary',
            'pastor'
        );
    END IF;
    
    -- Create pledge_frequency enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pledge_frequency') THEN
        CREATE TYPE pledge_frequency AS ENUM (
            'one_time',
            'weekly', 
            'biweekly',
            'monthly',
            'quarterly',
            'annually'
        );
    END IF;
    
    -- Create pledge_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pledge_status') THEN
        CREATE TYPE pledge_status AS ENUM (
            'active',
            'upcoming',
            'partially_fulfilled',
            'fulfilled',
            'overdue',
            'cancelled'
        );
    END IF;
    
    -- Create money_request_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'money_request_status') THEN
        CREATE TYPE money_request_status AS ENUM (
            'submitted',
            'under_review',
            'approved',
            'rejected',
            'cancelled'
        );
    END IF;
END $$;

EOF
    
    # Append existing SQL files if they exist
    if [ -f "$SQL_DIR/01_initial_schema.sql" ]; then
        echo "-- From 01_initial_schema.sql" >> "$migration_file"
        grep -v "^--" "$SQL_DIR/01_initial_schema.sql" | grep -v "^$" >> "$migration_file"
        echo "" >> "$migration_file"
    fi
    
    if [ -f "$SQL_DIR/02_rls_policies.sql" ]; then
        echo "-- From 02_rls_policies.sql" >> "$migration_file"
        grep -v "^--" "$SQL_DIR/02_rls_policies.sql" | grep -v "^$" >> "$migration_file"
        echo "" >> "$migration_file"
    fi
    
    if [ -f "$SQL_DIR/03_functions_and_triggers.sql" ]; then
        echo "-- From 03_functions_and_triggers.sql" >> "$migration_file"
        grep -v "^--" "$SQL_DIR/03_functions_and_triggers.sql" | grep -v "^$" >> "$migration_file"
        echo "" >> "$migration_file"
    fi
    
    print_success "Legacy scripts converted to: $migration_file"
}

# Create a new migration
create_migration() {
    local name=$1
    
    if [ -z "$name" ]; then
        print_error "Migration name is required"
        print_status "Usage: $0 create <migration_name>"
        exit 1
    fi
    
    print_status "Creating new migration: $name"
    
    cd "$PROJECT_ROOT"
    supabase migration new "$name"
    
    print_success "Migration created successfully"
}

# Apply all pending migrations
apply_migrations() {
    print_status "Applying database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Supabase is running
    if ! supabase status >/dev/null 2>&1; then
        print_error "Supabase is not running. Start it with:"
        print_error "  ./scripts/supabase-local.sh start"
        exit 1
    fi
    
    # Apply migrations
    supabase db push
    
    print_success "Migrations applied successfully"
}

# Reset database with migrations
reset_with_migrations() {
    print_warning "This will reset the database and apply all migrations!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting database with migrations..."
        
        cd "$PROJECT_ROOT"
        supabase db reset
        
        print_success "Database reset and migrations applied"
    else
        print_status "Database reset cancelled"
    fi
}

# Show migration status
show_status() {
    print_status "Checking migration status..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Supabase is running
    if ! supabase status >/dev/null 2>&1; then
        print_error "Supabase is not running. Start it with:"
        print_error "  ./scripts/supabase-local.sh start"
        exit 1
    fi
    
    # Show migration status
    supabase migration list
}

# Generate migration from database diff
generate_migration() {
    local name=$1
    
    if [ -z "$name" ]; then
        print_error "Migration name is required"
        print_status "Usage: $0 generate <migration_name>"
        exit 1
    fi
    
    print_status "Generating migration from database diff: $name"
    
    cd "$PROJECT_ROOT"
    supabase db diff --file="$name"
    
    print_success "Migration generated successfully"
}

# Validate migrations
validate_migrations() {
    print_status "Validating migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Check if migrations directory exists
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        print_warning "No migrations directory found"
        return 0
    fi
    
    # Check if migrations are properly formatted
    local invalid_count=0
    
    for migration_file in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$migration_file" ]; then
            # Basic SQL syntax validation
            if ! psql --dry-run -f "$migration_file" >/dev/null 2>&1; then
                print_error "Invalid SQL syntax in: $(basename "$migration_file")"
                invalid_count=$((invalid_count + 1))
            fi
        fi
    done
    
    if [ $invalid_count -eq 0 ]; then
        print_success "All migrations are valid"
    else
        print_error "$invalid_count migration(s) have issues"
        exit 1
    fi
}

# Backup database before migrations
backup_database() {
    local backup_name=${1:-"pre_migration_$(date +%Y%m%d_%H%M%S)"}
    
    print_status "Creating database backup: $backup_name"
    
    cd "$PROJECT_ROOT"
    
    # Create backup directory
    local backup_dir="$PROJECT_ROOT/backups"
    mkdir -p "$backup_dir"
    
    # Export database
    supabase db dump --file="$backup_dir/${backup_name}.sql"
    
    print_success "Database backup created: $backup_dir/${backup_name}.sql"
}

# Restore database from backup
restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        print_error "Backup file is required and must exist"
        print_status "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    print_warning "This will restore the database from backup and overwrite current data!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Restoring database from: $backup_file"
        
        cd "$PROJECT_ROOT"
        
        # Reset database and restore from backup
        supabase db reset
        psql -f "$backup_file" "$SUPABASE_DB_URL"
        
        print_success "Database restored successfully"
    else
        print_status "Database restore cancelled"
    fi
}

# Main function
main() {
    local command=${1:-"help"}
    
    print_banner
    
    case "$command" in
        "create")
            create_migration "$2"
            ;;
        "apply")
            apply_migrations
            ;;
        "reset")
            reset_with_migrations
            ;;
        "status")
            show_status
            ;;
        "generate")
            generate_migration "$2"
            ;;
        "validate")
            validate_migrations
            ;;
        "backup")
            backup_database "$2"
            ;;
        "restore")
            restore_database "$2"
            ;;
        "convert")
            convert_legacy_scripts
            ;;
        "help"|*)
            echo "Usage: $0 <command>"
            echo ""
            echo "Commands:"
            echo "  create <name>      - Create a new migration"
            echo "  apply              - Apply all pending migrations"
            echo "  reset              - Reset database and apply migrations"
            echo "  status             - Show migration status"
            echo "  generate <name>    - Generate migration from database diff"
            echo "  validate           - Validate migration files"
            echo "  backup [name]      - Create database backup"
            echo "  restore <file>     - Restore database from backup"
            echo "  convert            - Convert legacy SQL scripts to migrations"
            echo "  help               - Show this help message"
            echo ""
            ;;
    esac
}

# Run main function with all arguments
main "$@"