#!/bin/bash

# Enhanced System Initialization Script for Church Management System
# Supports Local, Cloud, and Hybrid deployment modes

set -e

# Source common functions
source "$(dirname "$0")/common.sh"

# Script configuration
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_banner() {
    echo "========================================="
    echo "  Church Management System"
    echo "  Enhanced System Initialization"
    echo "========================================="
    echo ""
}

print_mode_selection() {
    cat << EOF
Please select your deployment mode:

1) LOCAL - Full local Supabase stack
   ✅ Complete local development environment
   ✅ All services run locally via Docker
   ✅ No external dependencies
   ⚠️  Requires more system resources

2) CLOUD - Cloud Supabase with local frontend
   ✅ Lightweight local setup
   ✅ Production-grade Supabase services
   ✅ Easier maintenance and updates
   ⚠️  Requires Supabase cloud account

3) PRODUCTION - Full production deployment
   ✅ SSL certificates via Let's Encrypt
   ✅ Domain-based routing
   ✅ Production-optimized configuration
   ⚠️  Requires domain and proper server setup

EOF
}

detect_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed or not in PATH"
        print_status "Please install Docker first: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running"
        print_status "Please start Docker daemon first"
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
        print_success "Docker Compose V1 detected"
    elif docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
        print_success "Docker Compose V2 detected"
    else
        print_error "Docker Compose not found"
        print_status "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
}

setup_directories() {
    print_status "Creating required directories..."
    
    local directories=(
        "traefik/logs"
        "traefik/acme"
        "supabase/init"
        "supabase/functions"
        "volumes/postgres"
        "volumes/storage"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$PROJECT_ROOT/$dir"
    done
    
    # Set proper permissions for acme.json
    touch "$PROJECT_ROOT/traefik/acme.json"
    chmod 600 "$PROJECT_ROOT/traefik/acme.json"
    
    print_success "Directories created"
}

setup_environment() {
    print_status "Setting up environment configuration..."
    
    # Copy .env.example to .env if it doesn't exist
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        if [ -f "$PROJECT_ROOT/.env.example" ]; then
            cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
            print_success "Created .env file from template"
        else
            print_error ".env.example not found"
            exit 1
        fi
    fi
    
    # Load current environment
    source "$PROJECT_ROOT/.env" 2>/dev/null || true
}

validate_and_generate_secrets() {
    print_status "Validating and generating secrets..."
    
    local env_file="$PROJECT_ROOT/.env"
    local secrets_updated=false
    
    # Generate strong JWT secret if needed
    if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ] || [ "$JWT_SECRET" = "your-super-secret-jwt-token-with-at-least-32-characters-long" ]; then
        print_status "Generating strong JWT secret..."
        local new_jwt_secret=$(openssl rand -base64 32 | tr -d '\n')
        
        if grep -q "JWT_SECRET=" "$env_file"; then
            sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$new_jwt_secret/" "$env_file"
        else
            echo "JWT_SECRET=$new_jwt_secret" >> "$env_file"
        fi
        
        secrets_updated=true
        print_success "JWT secret generated"
    fi
    
    # Generate PostgreSQL password if using default
    if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "your-super-secure-password" ]; then
        print_status "Generating PostgreSQL password..."
        local new_db_password=$(openssl rand -base64 16 | tr -d '\n')
        
        if grep -q "POSTGRES_PASSWORD=" "$env_file"; then
            sed -i.bak "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$new_db_password/" "$env_file"
        else
            echo "POSTGRES_PASSWORD=$new_db_password" >> "$env_file"
        fi
        
        secrets_updated=true
        print_success "PostgreSQL password generated"
    fi
    
    if [ "$secrets_updated" = true ]; then
        print_warning "Secrets have been updated. Please restart if any services are running."
        # Reload environment
        source "$PROJECT_ROOT/.env"
    fi
}

configure_local_mode() {
    print_status "Configuring local mode..."
    
    local env_file="$PROJECT_ROOT/.env"
    
    # Update mode
    if grep -q "SUPABASE_MODE=" "$env_file"; then
        sed -i.bak "s/SUPABASE_MODE=.*/SUPABASE_MODE=local/" "$env_file"
    else
        echo "SUPABASE_MODE=local" >> "$env_file"
    fi
    
    # Configure local URLs and keys
    local updates=(
        "s|SUPABASE_LOCAL_URL=.*|SUPABASE_LOCAL_URL=http://localhost|"
        "s|SUPABASE_LOCAL_ANON_KEY=.*|SUPABASE_LOCAL_ANON_KEY=$JWT_SECRET|"
        "s|SUPABASE_LOCAL_SERVICE_KEY=.*|SUPABASE_LOCAL_SERVICE_KEY=$JWT_SECRET|"
    )
    
    for update in "${updates[@]}"; do
        sed -i.bak "$update" "$env_file"
    done
    
    print_success "Local mode configured"
    print_status "Use: docker-compose -f docker-compose.local.yml up -d"
}

configure_cloud_mode() {
    print_status "Configuring cloud mode..."
    
    local env_file="$PROJECT_ROOT/.env"
    
    # Update mode
    if grep -q "SUPABASE_MODE=" "$env_file"; then
        sed -i.bak "s/SUPABASE_MODE=.*/SUPABASE_MODE=cloud/" "$env_file"
    else
        echo "SUPABASE_MODE=cloud" >> "$env_file"
    fi
    
    # Check if cloud credentials are set
    if [ "$SUPABASE_CLOUD_URL" = "https://your-project.supabase.co" ] || [ -z "$SUPABASE_CLOUD_URL" ]; then
        print_warning "Cloud Supabase credentials need to be configured!"
        echo ""
        echo "Please update the following in your .env file:"
        echo "  SUPABASE_CLOUD_URL=https://your-project-id.supabase.co"
        echo "  SUPABASE_CLOUD_ANON_KEY=your-anon-key"
        echo "  SUPABASE_CLOUD_SERVICE_KEY=your-service-key"
        echo ""
        echo "You can find these values in your Supabase project dashboard:"
        echo "  Settings > API > Project URL and Project API keys"
        echo ""
        read -p "Press Enter after updating your .env file..."
    fi
    
    print_success "Cloud mode configured"
    print_status "Use: docker-compose -f docker-compose.cloud.yml up -d"
}

configure_production_mode() {
    print_status "Configuring production mode..."
    
    local env_file="$PROJECT_ROOT/.env"
    
    # Update mode
    if grep -q "SUPABASE_MODE=" "$env_file"; then
        sed -i.bak "s/SUPABASE_MODE=.*/SUPABASE_MODE=production/" "$env_file"
    else
        echo "SUPABASE_MODE=production" >> "$env_file"
    fi
    
    # Check if domain is configured
    if [ "$DOMAIN" = "your-domain.com" ] || [ -z "$DOMAIN" ]; then
        echo ""
        read -p "Enter your domain name (e.g., example.com): " user_domain
        if [ -n "$user_domain" ]; then
            sed -i.bak "s/DOMAIN=.*/DOMAIN=$user_domain/" "$env_file"
            sed -i.bak "s/ACME_EMAIL=.*/ACME_EMAIL=admin@$user_domain/" "$env_file"
        fi
    fi
    
    print_success "Production mode configured"
    print_status "Use: docker-compose -f docker-compose.yml up -d"
}

run_mode_setup() {
    local mode="$1"
    
    case "$mode" in
        "1"|"local")
            configure_local_mode
            ;;
        "2"|"cloud")
            configure_cloud_mode
            ;;
        "3"|"production")
            configure_production_mode
            ;;
        *)
            print_error "Invalid mode selection"
            exit 1
            ;;
    esac
}

deploy_services() {
    local mode="$1"
    
    # Determine compose file
    local compose_file=""
    case "$mode" in
        "1"|"local")
            compose_file="docker-compose.local.yml"
            ;;
        "2"|"cloud")
            compose_file="docker-compose.cloud.yml"
            ;;
        "3"|"production")
            compose_file="docker-compose.yml"
            ;;
    esac
    
    if [ ! -f "$PROJECT_ROOT/$compose_file" ]; then
        print_error "Compose file not found: $compose_file"
        exit 1
    fi
    
    print_status "Deploying services using $compose_file..."
    
    # Pull latest images
    print_status "Pulling latest Docker images..."
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE_CMD -f "$compose_file" pull --quiet
    
    # Start services
    print_status "Starting services..."
    $DOCKER_COMPOSE_CMD -f "$compose_file" up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check service health
    print_status "Checking service status..."
    $DOCKER_COMPOSE_CMD -f "$compose_file" ps
    
    print_success "Services deployed successfully!"
}

run_migrations() {
    local mode="$1"
    
    print_status "Running database migrations..."
    
    # Use the enhanced migration script
    if [ -f "$SCRIPT_DIR/migrate-db-v2.sh" ]; then
        bash "$SCRIPT_DIR/migrate-db-v2.sh"
    else
        print_warning "Enhanced migration script not found, using legacy version"
        bash "$SCRIPT_DIR/migrate-db.sh"
    fi
}

show_completion_info() {
    local mode="$1"
    
    echo ""
    print_success "🎉 Church Management System initialization complete!"
    echo ""
    
    # Load final environment for URLs
    source "$PROJECT_ROOT/.env" 2>/dev/null || true
    
    print_status "System Information:"
    echo "  Mode: $SUPABASE_MODE"
    echo "  Frontend: http://localhost"
    
    case "$SUPABASE_MODE" in
        "local")
            echo "  Studio: http://localhost/studio/"
            echo "  API: http://localhost/rest/"
            echo "  Auth: http://localhost/auth/"
            ;;
        "cloud")
            echo "  Supabase: $SUPABASE_CLOUD_URL"
            ;;
        "production")
            echo "  Domain: https://$DOMAIN"
            echo "  Admin: https://admin.$DOMAIN"
            ;;
    esac
    
    echo ""
    print_status "Useful Commands:"
    case "$SUPABASE_MODE" in
        "local")
            echo "  View logs: docker-compose -f docker-compose.local.yml logs -f"
            echo "  Stop services: docker-compose -f docker-compose.local.yml down"
            echo "  Restart: docker-compose -f docker-compose.local.yml restart"
            ;;
        "cloud")
            echo "  View logs: docker-compose -f docker-compose.cloud.yml logs -f"
            echo "  Stop services: docker-compose -f docker-compose.cloud.yml down"
            ;;
        "production")
            echo "  View logs: docker-compose logs -f"
            echo "  Stop services: docker-compose down"
            ;;
    esac
    
    echo ""
    print_status "Environment Management:"
    echo "  Switch modes: ./scripts/environment-manager.sh switch [local|cloud|production]"
    echo "  Check status: ./scripts/environment-manager.sh status"
    echo "  Validate config: ./scripts/environment-manager.sh validate"
    
    echo ""
    print_warning "Next Steps:"
    echo "  1. Access the application at http://localhost"
    echo "  2. Create your first administrator account"
    echo "  3. Configure organization settings"
    if [ "$SUPABASE_MODE" = "local" ]; then
        echo "  4. Access Supabase Studio at http://localhost/studio/"
    fi
}

# Main execution
main() {
    print_banner
    
    # Pre-flight checks
    detect_docker
    setup_directories
    setup_environment
    validate_and_generate_secrets
    
    # Mode selection
    if [ $# -eq 0 ]; then
        print_mode_selection
        read -p "Select deployment mode (1-3): " selected_mode
    else
        selected_mode="$1"
    fi
    
    # Configure selected mode
    run_mode_setup "$selected_mode"
    
    # Ask if user wants to deploy immediately
    echo ""
    read -p "Deploy services now? (y/N): " deploy_now
    if [[ "$deploy_now" =~ ^[Yy] ]]; then
        deploy_services "$selected_mode"
        
        # Ask if user wants to run migrations
        echo ""
        read -p "Run database migrations? (y/N): " run_migrations_now
        if [[ "$run_migrations_now" =~ ^[Yy] ]]; then
            run_migrations "$selected_mode"
        fi
    fi
    
    show_completion_info "$selected_mode"
}

main "$@"