#!/bin/bash

# Church Management System Initialization Script v3
# Enhanced version with official Supabase CLI integration

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/common.sh"

print_banner() {
    echo ""
    echo "=========================================="
    echo "  Church Management System v3.0"
    echo "  Enhanced with Official Supabase CLI"
    echo "=========================================="
    echo ""
}

print_mode_selection() {
    echo "Available deployment modes:"
    echo ""
    echo "1. LOCAL (Enhanced) - Official Supabase CLI + Docker services"
    echo "   • Uses official Supabase containers and CLI"
    echo "   • Host-based routing (api.localhost, auth.localhost)"
    echo "   • Enhanced security and performance"
    echo "   • Automatic JWT management"
    echo "   • Best for development"
    echo ""
    echo "2. CLOUD - Supabase Cloud + Local Frontend"
    echo "   • Uses your Supabase cloud project"
    echo "   • Local frontend development"
    echo "   • Production-like environment"
    echo ""
    echo "3. LEGACY - Original Docker Compose setup"
    echo "   • Fallback to original implementation"
    echo "   • Use only if enhanced mode has issues"
    echo ""
}

# Check prerequisites for enhanced mode
check_enhanced_prerequisites() {
    print_status "Checking prerequisites for enhanced mode..."
    
    local missing_tools=()
    
    # Check for curl (needed for Supabase CLI installation)
    if ! command -v curl >/dev/null 2>&1; then
        missing_tools+=("curl")
    fi
    
    # Check for Docker
    if ! command -v docker >/dev/null 2>&1; then
        missing_tools+=("docker")
    fi
    
    # Check for Docker Compose
    if ! detect_compose_command_silent >/dev/null 2>&1; then
        missing_tools+=("docker-compose")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_error "Please install the missing tools and try again"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running"
        print_error "Please start Docker and try again"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Install Supabase CLI if needed
ensure_supabase_cli() {
    if ! command -v supabase >/dev/null 2>&1; then
        print_status "Supabase CLI not found. Installing..."
        
        if [ -f "$SCRIPT_DIR/supabase-install.sh" ]; then
            chmod +x "$SCRIPT_DIR/supabase-install.sh"
            "$SCRIPT_DIR/supabase-install.sh"
        else
            print_error "Supabase installation script not found"
            print_error "Please run: $SCRIPT_DIR/supabase-install.sh"
            exit 1
        fi
    else
        local version=$(supabase --version)
        print_success "Supabase CLI found: $version"
    fi
}

# Setup enhanced local mode
setup_enhanced_local() {
    print_status "Setting up enhanced local development mode..."
    
    cd "$PROJECT_ROOT"
    
    # Ensure Supabase CLI is available
    ensure_supabase_cli
    
    # Initialize Supabase project if needed
    if [ ! -f "supabase/config.toml" ]; then
        print_status "Initializing Supabase project..."
        supabase init
    fi
    
    # Update environment for enhanced local mode
    update_env_file "SUPABASE_MODE" "local"
    update_env_file "DEPLOYMENT_MODE" "enhanced"
    
    # Create Docker network for Traefik if it doesn't exist
    local network_name="supabase_network_${PROJECT_NAME:-church_mgmt}"
    if ! docker network ls | grep -q "$network_name"; then
        print_status "Creating Docker network: $network_name"
        docker network create "$network_name" || true
    fi
    
    # Make scripts executable
    chmod +x "$SCRIPT_DIR/supabase-local.sh"
    chmod +x "$SCRIPT_DIR/supabase-migrate.sh"
    
    print_success "Enhanced local mode configured"
    
    # Show next steps
    echo ""
    print_status "Next steps:"
    echo "1. Start services: ./scripts/supabase-local.sh start"
    echo "2. Apply migrations: ./scripts/supabase-migrate.sh apply"
    echo "3. Access Studio: http://studio.localhost"
    echo "4. Access Frontend: http://localhost:3000"
    echo ""
}

# Setup cloud mode (unchanged)
setup_cloud_mode() {
    print_status "Setting up cloud development mode..."
    
    update_env_file "SUPABASE_MODE" "cloud"
    update_env_file "DEPLOYMENT_MODE" "cloud"
    
    # Check if cloud credentials are configured
    if [ -z "${SUPABASE_CLOUD_URL:-}" ] || [ -z "${SUPABASE_CLOUD_ANON_KEY:-}" ]; then
        print_warning "Cloud Supabase credentials not configured"
        print_status "Please update your .env file with:"
        echo "  SUPABASE_CLOUD_URL=https://your-project.supabase.co"
        echo "  SUPABASE_CLOUD_ANON_KEY=your_anon_key"
        echo "  SUPABASE_CLOUD_SERVICE_KEY=your_service_key"
        echo ""
    fi
    
    print_success "Cloud mode configured"
}

# Setup legacy mode (fallback)
setup_legacy_mode() {
    print_status "Setting up legacy Docker Compose mode..."
    
    update_env_file "SUPABASE_MODE" "local"
    update_env_file "DEPLOYMENT_MODE" "legacy"
    
    # Use original initialization script
    if [ -f "$SCRIPT_DIR/init-system-v2.sh" ]; then
        print_status "Using legacy initialization..."
        "$SCRIPT_DIR/init-system-v2.sh" local
    else
        print_error "Legacy initialization script not found"
        exit 1
    fi
}

# Update environment file helper
update_env_file() {
    local key=$1
    local value=$2
    local env_file="$PROJECT_ROOT/.env"
    
    # Create .env from example if it doesn't exist
    if [ ! -f "$env_file" ] && [ -f "$PROJECT_ROOT/.env.example" ]; then
        cp "$PROJECT_ROOT/.env.example" "$env_file"
        print_status "Created .env from .env.example"
    fi
    
    if [ -f "$env_file" ]; then
        # Remove existing key (create backup first)
        sed -i.bak "/^${key}=/d" "$env_file" 2>/dev/null || true
        # Add new key-value pair
        echo "${key}=${value}" >> "$env_file"
        # Remove backup file
        rm -f "${env_file}.bak" 2>/dev/null || true
    else
        # Create new .env file
        echo "${key}=${value}" > "$env_file"
    fi
}

# Show service information
show_service_info() {
    local mode=$1
    
    echo ""
    print_success "=== System Initialized Successfully ==="
    echo ""
    
    case "$mode" in
        "enhanced")
            echo "🚀 Enhanced Local Development Mode"
            echo ""
            echo "📊 Management Commands:"
            echo "  ./scripts/supabase-local.sh start    - Start all services"
            echo "  ./scripts/supabase-local.sh stop     - Stop all services"
            echo "  ./scripts/supabase-local.sh status   - Check service status"
            echo "  ./scripts/supabase-local.sh logs     - View service logs"
            echo ""
            echo "🗄️ Database Commands:"
            echo "  ./scripts/supabase-migrate.sh apply  - Apply migrations"
            echo "  ./scripts/supabase-migrate.sh reset  - Reset database"
            echo "  ./scripts/supabase-migrate.sh backup - Create backup"
            echo ""
            echo "🌐 Service URLs (when running):"
            echo "  Frontend:     http://localhost:3000"
            echo "  API:          http://api.localhost"
            echo "  Auth:         http://auth.localhost"
            echo "  Studio:       http://studio.localhost"
            echo "  Storage:      http://storage.localhost"
            echo "  Traefik:      http://traefik.localhost"
            ;;
        "cloud")
            echo "☁️ Cloud Development Mode"
            echo ""
            echo "Configure your .env file with Supabase Cloud credentials"
            echo "Then start the frontend: npm run dev"
            ;;
        "legacy")
            echo "🔧 Legacy Docker Compose Mode"
            echo ""
            echo "Use original Docker Compose commands"
            ;;
    esac
    
    echo ""
    print_status "Documentation: https://github.com/your-org/church-mgmt"
    echo ""
}

# Main function
main() {
    local mode=${1:-""}
    
    print_banner
    
    # Load environment if .env exists
    if [ -f "$PROJECT_ROOT/.env" ]; then
        load_env || true
    fi
    
    # If mode not specified, prompt user
    if [ -z "$mode" ]; then
        print_mode_selection
        
        echo "Select deployment mode:"
        echo "1) Enhanced Local (Recommended)"
        echo "2) Cloud Development"
        echo "3) Legacy Docker Compose"
        echo ""
        read -p "Enter your choice (1-3): " -n 1 -r
        echo ""
        
        case $REPLY in
            1) mode="enhanced" ;;
            2) mode="cloud" ;;
            3) mode="legacy" ;;
            *) 
                print_error "Invalid selection"
                exit 1
                ;;
        esac
    fi
    
    # Process selected mode
    case "$mode" in
        "enhanced"|"local")
            check_enhanced_prerequisites
            setup_enhanced_local
            show_service_info "enhanced"
            ;;
        "cloud")
            setup_cloud_mode
            show_service_info "cloud"
            ;;
        "legacy")
            setup_legacy_mode
            show_service_info "legacy"
            ;;
        *)
            print_error "Invalid mode: $mode"
            print_error "Valid modes: enhanced, cloud, legacy"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"