#!/bin/bash

# Supabase Local Development Management Script
# Main interface for managing local Supabase services

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/common.sh"

# Configuration
SUPABASE_PORT=54321
STUDIO_PORT=54323
FRONTEND_PORT=3000

# Print banner
print_banner() {
    echo ""
    echo "========================================"
    echo "  Church Management System - Supabase"
    echo "========================================"
    echo ""
}

# Check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase >/dev/null 2>&1; then
        print_error "Supabase CLI is not installed"
        print_status "Run: ./scripts/supabase-install.sh"
        exit 1
    fi
    
    local version=$(supabase --version)
    print_success "Supabase CLI found: $version"
}

# Initialize Supabase project
init_project() {
    print_status "Initializing Supabase project..."
    
    cd "$PROJECT_ROOT"
    
    # Check if already initialized
    if [ -f "supabase/config.toml" ]; then
        print_warning "Supabase project already initialized"
        return 0
    fi
    
    # Initialize project
    supabase init
    
    # Update config.toml with our settings
    cat > supabase/config.toml << EOF
project_id = "yptbntyathrtnmgfotjs"

[api]
enabled = true
port = $SUPABASE_PORT
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
port = 54324
site_url = "http://localhost:$FRONTEND_PORT"
additional_redirect_urls = ["https://localhost:$FRONTEND_PORT"]
jwt_expiry = 3600
refresh_token_rotation_enabled = true
refresh_token_reuse_interval = 10
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[db]
enabled = true
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = $STUDIO_PORT
api_url = "http://localhost:$SUPABASE_PORT"
openai_api_key = ""

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
port = 54321
file_size_limit = "50MiB"
image_transformation = true

[edge_functions]
enabled = true
port = 54321

[functions.create-user]
verify_jwt = true
EOF
    
    print_success "Supabase project initialized"
}

# Start Supabase services
start_services() {
    print_status "Starting Supabase services..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables for local development
    export SUPABASE_DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
    export SUPABASE_URL="http://localhost:$SUPABASE_PORT"
    export SUPABASE_ANON_KEY=""
    export SUPABASE_SERVICE_ROLE_KEY=""
    
    # Start Supabase
    supabase start
    
    # Get the anon key and service role key
    local anon_key=$(supabase status --output env | grep SUPABASE_ANON_KEY | cut -d'=' -f2)
    local service_key=$(supabase status --output env | grep SUPABASE_SERVICE_ROLE_KEY | cut -d'=' -f2)
    
    # Update .env file
    update_env_file "SUPABASE_MODE" "local"
    update_env_file "SUPABASE_LOCAL_URL" "http://localhost:$SUPABASE_PORT"
    update_env_file "SUPABASE_LOCAL_ANON_KEY" "$anon_key"
    update_env_file "SUPABASE_LOCAL_SERVICE_KEY" "$service_key"
    
    print_success "Supabase services started successfully"
    show_service_urls
}

# Stop Supabase services
stop_services() {
    print_status "Stopping Supabase services..."
    
    cd "$PROJECT_ROOT"
    supabase stop
    
    print_success "Supabase services stopped"
}

# Reset Supabase database
reset_database() {
    print_warning "This will reset the database and all data will be lost!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting Supabase database..."
        
        cd "$PROJECT_ROOT"
        supabase db reset
        
        print_success "Database reset completed"
    else
        print_status "Database reset cancelled"
    fi
}

# Show service status
show_status() {
    print_status "Checking Supabase service status..."
    
    cd "$PROJECT_ROOT"
    
    if supabase status >/dev/null 2>&1; then
        supabase status
        echo ""
        show_service_urls
    else
        print_warning "Supabase services are not running"
        print_status "Run: $0 start"
    fi
}

# Show service URLs
show_service_urls() {
    echo ""
    print_success "Service URLs:"
    echo "  API URL:    http://localhost:$SUPABASE_PORT"
    echo "  Studio:     http://localhost:$STUDIO_PORT"
    echo "  Inbucket:   http://localhost:54324"
    echo "  Frontend:   http://localhost:$FRONTEND_PORT"
    echo ""
}

# Show logs
show_logs() {
    local service=${1:-"all"}
    
    print_status "Showing logs for: $service"
    
    cd "$PROJECT_ROOT"
    
    case "$service" in
        "db"|"database")
            docker logs supabase_db_$(basename "$PROJECT_ROOT") -f
            ;;
        "api"|"postgrest")
            docker logs supabase_rest_$(basename "$PROJECT_ROOT") -f
            ;;
        "auth"|"gotrue")
            docker logs supabase_auth_$(basename "$PROJECT_ROOT") -f
            ;;
        "storage")
            docker logs supabase_storage_$(basename "$PROJECT_ROOT") -f
            ;;
        "realtime")
            docker logs supabase_realtime_$(basename "$PROJECT_ROOT") -f
            ;;
        "studio")
            docker logs supabase_studio_$(basename "$PROJECT_ROOT") -f
            ;;
        "all"|*)
            print_status "Available log targets: db, api, auth, storage, realtime, studio"
            print_status "Use: $0 logs <service>"
            ;;
    esac
}

# Apply migrations
apply_migrations() {
    print_status "Applying database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Check if migrations exist
    if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations)" ]; then
        supabase db push
        print_success "Migrations applied successfully"
    else
        print_warning "No migrations found in supabase/migrations/"
    fi
}

# Generate types
generate_types() {
    print_status "Generating TypeScript types..."
    
    cd "$PROJECT_ROOT"
    supabase gen types typescript --local > src/integrations/supabase/types.ts
    
    print_success "Types generated successfully"
}

# Update environment file
update_env_file() {
    local key=$1
    local value=$2
    local env_file="$PROJECT_ROOT/.env"
    
    if [ -f "$env_file" ]; then
        # Remove existing key
        sed -i.bak "/^${key}=/d" "$env_file"
        # Add new key-value pair
        echo "${key}=${value}" >> "$env_file"
        # Remove backup file
        rm -f "${env_file}.bak"
    else
        # Create new .env file
        echo "${key}=${value}" > "$env_file"
    fi
}

# Main function
main() {
    local command=${1:-"help"}
    
    print_banner
    check_supabase_cli
    
    case "$command" in
        "start")
            init_project
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            start_services
            ;;
        "status")
            show_status
            ;;
        "reset")
            reset_database
            ;;
        "logs")
            show_logs "$2"
            ;;
        "migrate")
            apply_migrations
            ;;
        "types")
            generate_types
            ;;
        "init")
            init_project
            ;;
        "help"|*)
            echo "Usage: $0 <command>"
            echo ""
            echo "Commands:"
            echo "  start     - Start Supabase services"
            echo "  stop      - Stop Supabase services"
            echo "  restart   - Restart Supabase services"
            echo "  status    - Show service status and URLs"
            echo "  reset     - Reset database (destructive)"
            echo "  logs      - Show service logs"
            echo "  migrate   - Apply database migrations"
            echo "  types     - Generate TypeScript types"
            echo "  init      - Initialize Supabase project"
            echo "  help      - Show this help message"
            echo ""
            ;;
    esac
}

# Run main function with all arguments
main "$@"