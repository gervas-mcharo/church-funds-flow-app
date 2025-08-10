#!/bin/bash

# Complete workflow test for the enhanced Church Management System
# This script tests all components of the rebuilt system

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/common.sh"

# Test configuration
TEST_TIMEOUT=30
SERVICES_TO_TEST=(
    "api.localhost:80"
    "auth.localhost:80"
    "storage.localhost:80"
    "studio.localhost:80"
    "traefik.localhost:80"
)

print_banner() {
    echo ""
    echo "========================================"
    echo "  Enhanced System Workflow Test"
    echo "========================================"
    echo ""
}

# Test if a service is responding
test_service() {
    local service=$1
    local url=$2
    local timeout=${3:-10}
    
    print_status "Testing $service..."
    
    if timeout "$timeout" bash -c "curl -sf '$url' >/dev/null 2>&1"; then
        print_success "✓ $service is responding"
        return 0
    else
        print_error "✗ $service is not responding"
        return 1
    fi
}

# Test host resolution
test_host_resolution() {
    print_status "Testing host resolution..."
    
    local failed=0
    for service in "${SERVICES_TO_TEST[@]}"; do
        local host=$(echo "$service" | cut -d':' -f1)
        
        if nslookup "$host" >/dev/null 2>&1; then
            if nslookup "$host" | grep -q "127.0.0.1"; then
                print_success "✓ $host resolves correctly"
            else
                print_warning "⚠ $host resolves but not to 127.0.0.1"
                failed=$((failed + 1))
            fi
        else
            print_error "✗ $host does not resolve"
            failed=$((failed + 1))
        fi
    done
    
    if [ $failed -eq 0 ]; then
        print_success "All hosts resolve correctly"
        return 0
    else
        print_error "$failed host(s) failed resolution test"
        return 1
    fi
}

# Test Supabase CLI installation
test_supabase_cli() {
    print_status "Testing Supabase CLI..."
    
    if command -v supabase >/dev/null 2>&1; then
        local version=$(supabase --version)
        print_success "✓ Supabase CLI installed: $version"
        return 0
    else
        print_error "✗ Supabase CLI not found"
        print_status "Installing Supabase CLI..."
        
        if [ -f "$SCRIPT_DIR/supabase-install.sh" ]; then
            chmod +x "$SCRIPT_DIR/supabase-install.sh"
            "$SCRIPT_DIR/supabase-install.sh"
            return $?
        else
            print_error "Supabase installation script not found"
            return 1
        fi
    fi
}

# Test script permissions
test_script_permissions() {
    print_status "Testing script permissions..."
    
    local scripts=(
        "scripts/supabase-local.sh"
        "scripts/supabase-migrate.sh"
        "scripts/init-system-v3.sh"
        "scripts/setup-hosts.sh"
    )
    
    local failed=0
    for script in "${scripts[@]}"; do
        if [ -x "$PROJECT_ROOT/$script" ]; then
            print_success "✓ $script is executable"
        else
            print_warning "⚠ $script is not executable"
            chmod +x "$PROJECT_ROOT/$script"
            print_status "  → Fixed permissions for $script"
        fi
    done
    
    print_success "All scripts are executable"
    return 0
}

# Test Docker setup
test_docker() {
    print_status "Testing Docker setup..."
    
    if ! command -v docker >/dev/null 2>&1; then
        print_error "✗ Docker not found"
        return 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "✗ Docker daemon not running"
        return 1
    fi
    
    print_success "✓ Docker is running"
    
    # Test Docker Compose
    local compose_cmd
    if compose_cmd=$(detect_compose_command_silent 2>/dev/null); then
        print_success "✓ Docker Compose available: $compose_cmd"
        return 0
    else
        print_error "✗ Docker Compose not available"
        return 1
    fi
}

# Test environment configuration
test_environment() {
    print_status "Testing environment configuration..."
    
    cd "$PROJECT_ROOT"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_status "Creating .env from .env.example..."
            cp ".env.example" ".env"
        else
            print_error "✗ No .env or .env.example found"
            return 1
        fi
    fi
    
    # Load and validate environment
    if load_env; then
        print_success "✓ Environment loaded successfully"
        
        # Check key variables
        if [ "${SUPABASE_MODE:-}" = "local" ]; then
            print_success "✓ SUPABASE_MODE is set to local"
        else
            print_warning "⚠ SUPABASE_MODE not set to local"
        fi
        
        return 0
    else
        print_error "✗ Failed to load environment"
        return 1
    fi
}

# Test service startup
test_service_startup() {
    print_status "Testing service startup..."
    
    cd "$PROJECT_ROOT"
    
    # Initialize if needed
    if [ ! -f "supabase/config.toml" ]; then
        print_status "Initializing Supabase project..."
        supabase init >/dev/null 2>&1 || {
            print_error "✗ Failed to initialize Supabase project"
            return 1
        }
    fi
    
    # Try to start services
    print_status "Starting Supabase services..."
    if timeout 60 supabase start >/dev/null 2>&1; then
        print_success "✓ Supabase services started"
    else
        print_error "✗ Failed to start Supabase services"
        return 1
    fi
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    return 0
}

# Test service endpoints
test_service_endpoints() {
    print_status "Testing service endpoints..."
    
    local failed=0
    
    # Test API endpoint
    if test_service "PostgREST API" "http://api.localhost/health" 10; then
        true
    else
        failed=$((failed + 1))
    fi
    
    # Test Auth endpoint
    if test_service "GoTrue Auth" "http://auth.localhost/health" 10; then
        true
    else
        failed=$((failed + 1))
    fi
    
    # Test Studio endpoint
    if test_service "Supabase Studio" "http://studio.localhost" 10; then
        true
    else
        failed=$((failed + 1))
    fi
    
    # Test Traefik dashboard
    if test_service "Traefik Dashboard" "http://traefik.localhost" 5; then
        true
    else
        failed=$((failed + 1))
    fi
    
    if [ $failed -eq 0 ]; then
        print_success "All service endpoints are responding"
        return 0
    else
        print_error "$failed service endpoint(s) failed"
        return 1
    fi
}

# Test database operations
test_database_operations() {
    print_status "Testing database operations..."
    
    cd "$PROJECT_ROOT"
    
    # Test database connection
    if supabase status >/dev/null 2>&1; then
        print_success "✓ Database is accessible"
    else
        print_error "✗ Database is not accessible"
        return 1
    fi
    
    # Test migration system
    if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations 2>/dev/null)" ]; then
        print_status "Testing migration application..."
        if supabase db push >/dev/null 2>&1; then
            print_success "✓ Migrations applied successfully"
        else
            print_warning "⚠ Failed to apply migrations (may be normal)"
        fi
    else
        print_status "No migrations found to test"
    fi
    
    return 0
}

# Test frontend connectivity
test_frontend() {
    print_status "Testing frontend configuration..."
    
    # Check if frontend dependencies are installed
    cd "$PROJECT_ROOT"
    if [ -f "package.json" ] && [ -d "node_modules" ]; then
        print_success "✓ Frontend dependencies installed"
    elif [ -f "package.json" ]; then
        print_warning "⚠ Frontend dependencies not installed"
        print_status "Run: npm install"
    else
        print_error "✗ No package.json found"
        return 1
    fi
    
    # Test frontend build configuration
    if [ -f "vite.config.ts" ]; then
        print_success "✓ Vite configuration found"
    else
        print_warning "⚠ Vite configuration not found"
    fi
    
    return 0
}

# Clean up test resources
cleanup_test() {
    print_status "Cleaning up test resources..."
    
    cd "$PROJECT_ROOT"
    
    # Stop services if they're running
    if supabase status >/dev/null 2>&1; then
        print_status "Stopping Supabase services..."
        supabase stop >/dev/null 2>&1 || true
    fi
    
    print_success "Cleanup completed"
}

# Show test results summary
show_test_summary() {
    local total_tests=$1
    local passed_tests=$2
    local failed_tests=$((total_tests - passed_tests))
    
    echo ""
    echo "========================================"
    echo "  Test Results Summary"
    echo "========================================"
    echo ""
    
    print_success "Passed: $passed_tests/$total_tests"
    if [ $failed_tests -gt 0 ]; then
        print_error "Failed: $failed_tests/$total_tests"
    fi
    
    echo ""
    
    if [ $failed_tests -eq 0 ]; then
        print_success "🎉 All tests passed! System is ready for development."
        echo ""
        echo "Next steps:"
        echo "1. Access Studio: http://studio.localhost"
        echo "2. Start frontend: npm run dev"
        echo "3. Access app: http://localhost:3000"
    else
        print_error "❌ Some tests failed. Please review the output above."
        echo ""
        echo "Common fixes:"
        echo "1. Run: sudo ./scripts/setup-hosts.sh"
        echo "2. Check Docker is running"
        echo "3. Verify .env configuration"
    fi
    
    echo ""
}

# Main test function
run_complete_test() {
    local total_tests=0
    local passed_tests=0
    
    print_banner
    
    # Array of test functions
    tests=(
        "test_script_permissions"
        "test_docker"
        "test_supabase_cli"
        "test_environment"
        "test_host_resolution"
        "test_service_startup"
        "test_service_endpoints"
        "test_database_operations"
        "test_frontend"
    )
    
    # Run each test
    for test_func in "${tests[@]}"; do
        total_tests=$((total_tests + 1))
        echo ""
        
        if $test_func; then
            passed_tests=$((passed_tests + 1))
        fi
    done
    
    # Show summary
    show_test_summary $total_tests $passed_tests
    
    # Cleanup
    if [ "${1:-}" != "--no-cleanup" ]; then
        cleanup_test
    fi
    
    # Return appropriate exit code
    if [ $passed_tests -eq $total_tests ]; then
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    local command=${1:-"run"}
    
    case "$command" in
        "run")
            run_complete_test "$2"
            ;;
        "hosts")
            test_host_resolution
            ;;
        "services")
            test_service_endpoints
            ;;
        "docker")
            test_docker
            ;;
        "env")
            test_environment
            ;;
        "help"|*)
            echo "Usage: $0 <command>"
            echo ""
            echo "Commands:"
            echo "  run       - Run complete workflow test"
            echo "  hosts     - Test host resolution only"
            echo "  services  - Test service endpoints only"
            echo "  docker    - Test Docker setup only"
            echo "  env       - Test environment only"
            echo "  help      - Show this help"
            echo ""
            echo "Options:"
            echo "  --no-cleanup  - Don't stop services after testing"
            echo ""
            ;;
    esac
}

# Run main function
main "$@"