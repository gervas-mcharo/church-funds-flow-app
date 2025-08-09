#!/bin/bash

# Environment Manager for Church Management System
# Handles switching between local, cloud, and hybrid modes

set -e

# Source common functions
source "$(dirname "$0")/common.sh"

# Script configuration
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_banner() {
    echo "========================================="
    echo "  Church Management System"
    echo "  Environment Manager"
    echo "========================================="
    echo ""
}

show_help() {
    cat << EOF
USAGE:
    $0 [COMMAND] [OPTIONS]

COMMANDS:
    status      Show current environment configuration
    switch      Switch between deployment modes
    init        Initialize environment for first use
    validate    Validate current configuration
    help        Show this help message

SWITCH OPTIONS:
    local       Full local Supabase stack
    cloud       Cloud Supabase with local frontend
    production  Production deployment

EXAMPLES:
    $0 status
    $0 switch local
    $0 switch cloud
    $0 init
    $0 validate

EOF
}

detect_current_mode() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env" 2>/dev/null || true
        echo "${SUPABASE_MODE:-unknown}"
    else
        echo "uninitialized"
    fi
}

show_status() {
    local current_mode=$(detect_current_mode)
    
    print_status "Current Environment Status:"
    echo "  Mode: $current_mode"
    
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env" 2>/dev/null || true
        echo "  Database: ${POSTGRES_DB:-not-set}"
        echo "  JWT Secret: ${JWT_SECRET:+configured}"
        
        case "$current_mode" in
            "local")
                echo "  Local URL: ${SUPABASE_LOCAL_URL:-not-set}"
                echo "  Local Keys: ${SUPABASE_LOCAL_ANON_KEY:+configured}"
                ;;
            "cloud")
                echo "  Cloud URL: ${SUPABASE_CLOUD_URL:-not-set}"
                echo "  Cloud Keys: ${SUPABASE_CLOUD_ANON_KEY:+configured}"
                ;;
        esac
    else
        print_warning "No .env file found"
    fi
    
    echo ""
    
    # Check for Docker Compose files
    print_status "Available Deployment Modes:"
    [ -f "$PROJECT_ROOT/docker-compose.local.yml" ] && echo "  ✅ Local (Full Supabase Stack)"
    [ -f "$PROJECT_ROOT/docker-compose.cloud.yml" ] && echo "  ✅ Cloud (Frontend + Cloud Supabase)"
    [ -f "$PROJECT_ROOT/docker-compose.yml" ] && echo "  ✅ Production"
    [ -f "$PROJECT_ROOT/docker-compose.dev.yml" ] && echo "  ⚠️  Development (Legacy)"
    
    echo ""
    
    # Check running services
    if command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1; then
        print_status "Running Services:"
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(postgres|traefik|frontend)" >/dev/null 2>&1; then
            docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(postgres|traefik|frontend|gotrue|studio)"
        else
            echo "  No services currently running"
        fi
    fi
}

init_environment() {
    print_status "Initializing environment..."
    
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
    
    # Generate JWT secret if needed
    if ! grep -q "JWT_SECRET=your-super-secret" "$PROJECT_ROOT/.env" 2>/dev/null; then
        print_status "JWT secret already configured"
    else
        print_status "Generating JWT secret..."
        local jwt_secret=$(openssl rand -base64 32 | tr -d '\n')
        sed -i.bak "s|JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long|JWT_SECRET=$jwt_secret|" "$PROJECT_ROOT/.env"
        print_success "JWT secret generated"
    fi
    
    # Set default mode to local
    if ! grep -q "SUPABASE_MODE=" "$PROJECT_ROOT/.env" 2>/dev/null; then
        echo "SUPABASE_MODE=local" >> "$PROJECT_ROOT/.env"
        print_success "Set default mode to local"
    fi
    
    print_success "Environment initialization complete"
    echo ""
    print_status "Next steps:"
    echo "  1. Review and edit .env file as needed"
    echo "  2. Run: $0 switch [local|cloud]"
    echo "  3. Start services with appropriate docker-compose file"
}

switch_mode() {
    local target_mode="$1"
    
    if [ -z "$target_mode" ]; then
        print_error "Please specify a mode: local, cloud, or production"
        exit 1
    fi
    
    # Validate target mode
    case "$target_mode" in
        "local"|"cloud"|"production")
            ;;
        *)
            print_error "Invalid mode: $target_mode"
            print_status "Valid modes: local, cloud, production"
            exit 1
            ;;
    esac
    
    # Check if .env exists
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        print_warning ".env file not found. Running initialization first..."
        init_environment
    fi
    
    print_status "Switching to $target_mode mode..."
    
    # Update SUPABASE_MODE in .env
    if grep -q "SUPABASE_MODE=" "$PROJECT_ROOT/.env"; then
        sed -i.bak "s|SUPABASE_MODE=.*|SUPABASE_MODE=$target_mode|" "$PROJECT_ROOT/.env"
    else
        echo "SUPABASE_MODE=$target_mode" >> "$PROJECT_ROOT/.env"
    fi
    
    # Mode-specific configuration
    case "$target_mode" in
        "local")
            print_status "Configuring for local Supabase stack..."
            
            # Generate local keys if needed
            source "$PROJECT_ROOT/.env"
            if [ "$SUPABASE_LOCAL_ANON_KEY" = "your-local-supabase-anon-key" ]; then
                print_status "Generating local Supabase keys..."
                local anon_key="$JWT_SECRET"
                local service_key="$JWT_SECRET"
                
                sed -i.bak "s|SUPABASE_LOCAL_ANON_KEY=.*|SUPABASE_LOCAL_ANON_KEY=$anon_key|" "$PROJECT_ROOT/.env"
                sed -i.bak "s|SUPABASE_LOCAL_SERVICE_KEY=.*|SUPABASE_LOCAL_SERVICE_KEY=$service_key|" "$PROJECT_ROOT/.env"
                print_success "Local keys configured"
            fi
            
            print_status "Use: docker-compose -f docker-compose.local.yml up -d"
            ;;
            
        "cloud")
            print_status "Configuring for cloud Supabase..."
            
            if grep -q "your-cloud-supabase" "$PROJECT_ROOT/.env"; then
                print_warning "Please update cloud Supabase credentials in .env file:"
                echo "  - SUPABASE_CLOUD_URL"
                echo "  - SUPABASE_CLOUD_ANON_KEY"
                echo "  - SUPABASE_CLOUD_SERVICE_KEY"
            fi
            
            print_status "Use: docker-compose -f docker-compose.cloud.yml up -d"
            ;;
            
        "production")
            print_status "Configuring for production deployment..."
            
            if grep -q "your-domain.com" "$PROJECT_ROOT/.env"; then
                print_warning "Please update production configuration in .env file:"
                echo "  - DOMAIN"
                echo "  - ACME_EMAIL"
                echo "  - Production database credentials"
            fi
            
            print_status "Use: docker-compose -f docker-compose.yml up -d"
            ;;
    esac
    
    print_success "Switched to $target_mode mode"
    echo ""
    print_status "Current configuration:"
    show_status
}

validate_configuration() {
    print_status "Validating configuration..."
    
    local errors=0
    
    # Check .env file
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        print_error ".env file not found"
        ((errors++))
    else
        source "$PROJECT_ROOT/.env" 2>/dev/null || true
        
        # Check required variables
        [ -z "$SUPABASE_MODE" ] && { print_error "SUPABASE_MODE not set"; ((errors++)); }
        [ -z "$JWT_SECRET" ] && { print_error "JWT_SECRET not set"; ((errors++)); }
        [ -z "$POSTGRES_PASSWORD" ] && { print_error "POSTGRES_PASSWORD not set"; ((errors++)); }
        
        # Mode-specific validation
        case "$SUPABASE_MODE" in
            "local")
                [ -z "$SUPABASE_LOCAL_URL" ] && { print_error "SUPABASE_LOCAL_URL not set"; ((errors++)); }
                [ -z "$SUPABASE_LOCAL_ANON_KEY" ] && { print_error "SUPABASE_LOCAL_ANON_KEY not set"; ((errors++)); }
                ;;
            "cloud")
                [ -z "$SUPABASE_CLOUD_URL" ] && { print_error "SUPABASE_CLOUD_URL not set"; ((errors++)); }
                [ -z "$SUPABASE_CLOUD_ANON_KEY" ] && { print_error "SUPABASE_CLOUD_ANON_KEY not set"; ((errors++)); }
                ;;
            "production")
                [ -z "$DOMAIN" ] && { print_error "DOMAIN not set"; ((errors++)); }
                [ -z "$ACME_EMAIL" ] && { print_error "ACME_EMAIL not set"; ((errors++)); }
                ;;
        esac
    fi
    
    # Check Docker Compose files
    local compose_file=""
    case "${SUPABASE_MODE:-}" in
        "local") compose_file="docker-compose.local.yml" ;;
        "cloud") compose_file="docker-compose.cloud.yml" ;;
        "production") compose_file="docker-compose.yml" ;;
    esac
    
    if [ -n "$compose_file" ] && [ ! -f "$PROJECT_ROOT/$compose_file" ]; then
        print_error "Required compose file not found: $compose_file"
        ((errors++))
    fi
    
    # Check Docker installation
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker not installed"
        ((errors++))
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose not available"
        ((errors++))
    fi
    
    # Summary
    if [ $errors -eq 0 ]; then
        print_success "Configuration validation passed"
    else
        print_error "Configuration validation failed with $errors error(s)"
        exit 1
    fi
}

# Main script logic
main() {
    print_banner
    
    case "${1:-help}" in
        "status")
            show_status
            ;;
        "switch")
            switch_mode "$2"
            ;;
        "init")
            init_environment
            ;;
        "validate")
            validate_configuration
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

main "$@"