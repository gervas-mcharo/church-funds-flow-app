#!/bin/bash

# Service Health Check Script for Local Supabase Stack
# Monitors and validates all services are running correctly

set -e

# Source common functions
SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/common.sh"

PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Service endpoints
SERVICES=(
    "postgres:5432:PostgreSQL Database"
    "localhost:80:Traefik Reverse Proxy"
    "localhost/rest/:PostgREST API"
    "localhost/auth/:GoTrue Authentication"
    "localhost/storage/:Storage API"
    "localhost/functions/:Edge Functions"
    "localhost/studio/:Supabase Studio"
)

check_service_health() {
    local endpoint="$1"
    local name="$2"
    local timeout=5
    
    print_status "Checking $name..."
    
    if [[ "$endpoint" == *":"* ]] && [[ "$endpoint" != *"/"* ]]; then
        # TCP port check
        local host=$(echo "$endpoint" | cut -d: -f1)
        local port=$(echo "$endpoint" | cut -d: -f2)
        
        if timeout "$timeout" bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
            print_success "$name is responding"
            return 0
        else
            print_error "$name is not responding"
            return 1
        fi
    else
        # HTTP endpoint check
        local url="http://$endpoint"
        
        if curl -sf --max-time "$timeout" "$url" >/dev/null 2>&1; then
            print_success "$name is responding"
            return 0
        else
            print_error "$name is not responding"
            return 1
        fi
    fi
}

check_jwt_configuration() {
    print_status "Checking JWT configuration..."
    
    # Load environment
    source "$PROJECT_ROOT/.env" 2>/dev/null || true
    
    local issues=0
    
    if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
        print_error "JWT_SECRET is missing or too short"
        issues=$((issues + 1))
    fi
    
    if [ -z "$SUPABASE_LOCAL_ANON_KEY" ]; then
        print_error "SUPABASE_LOCAL_ANON_KEY is missing"
        issues=$((issues + 1))
    fi
    
    if [ -z "$SUPABASE_LOCAL_SERVICE_KEY" ]; then
        print_error "SUPABASE_LOCAL_SERVICE_KEY is missing"
        issues=$((issues + 1))
    fi
    
    if [ $issues -eq 0 ]; then
        print_success "JWT configuration is valid"
        return 0
    else
        print_error "Found $issues JWT configuration issues"
        return 1
    fi
}

check_database_schema() {
    print_status "Checking database schema..."
    
    # Load environment
    source "$PROJECT_ROOT/.env" 2>/dev/null || true
    
    local db_url="postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@localhost:5432/${POSTGRES_DB:-postgres}"
    
    # Check if auth schema exists
    if psql "$db_url" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth';" 2>/dev/null | grep -q auth; then
        print_success "Auth schema exists"
    else
        print_error "Auth schema is missing"
        return 1
    fi
    
    # Check if storage schema exists
    if psql "$db_url" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'storage';" 2>/dev/null | grep -q storage; then
        print_success "Storage schema exists"
    else
        print_error "Storage schema is missing"
        return 1
    fi
    
    return 0
}

check_api_authentication() {
    print_status "Testing API authentication..."
    
    # Load environment
    source "$PROJECT_ROOT/.env" 2>/dev/null || true
    
    local anon_key="${SUPABASE_LOCAL_ANON_KEY:-$JWT_SECRET}"
    
    # Test anonymous access
    if curl -sf -H "Authorization: Bearer $anon_key" -H "apikey: $anon_key" "http://localhost/rest/" >/dev/null 2>&1; then
        print_success "API authentication is working"
        return 0
    else
        print_error "API authentication failed"
        return 1
    fi
}

check_docker_containers() {
    print_status "Checking Docker containers..."
    
    local containers=(
        "postgres-local"
        "postgrest-local"
        "gotrue-local"
        "storage-local"
        "functions-local"
        "studio-local"
        "meta-local"
        "traefik-local"
        "frontend-local"
    )
    
    local issues=0
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
            local status=$(docker inspect --format="{{.State.Health.Status}}" "$container" 2>/dev/null || echo "running")
            if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
                print_success "$container is running"
            else
                print_warning "$container is running but not healthy ($status)"
                issues=$((issues + 1))
            fi
        else
            print_error "$container is not running"
            issues=$((issues + 1))
        fi
    done
    
    if [ $issues -eq 0 ]; then
        return 0
    else
        print_error "Found $issues container issues"
        return 1
    fi
}

run_comprehensive_health_check() {
    print_status "Running comprehensive health check..."
    echo ""
    
    local total_checks=0
    local failed_checks=0
    
    # Check Docker containers
    total_checks=$((total_checks + 1))
    if ! check_docker_containers; then
        failed_checks=$((failed_checks + 1))
    fi
    echo ""
    
    # Check JWT configuration
    total_checks=$((total_checks + 1))
    if ! check_jwt_configuration; then
        failed_checks=$((failed_checks + 1))
    fi
    echo ""
    
    # Check database schema
    total_checks=$((total_checks + 1))
    if ! check_database_schema; then
        failed_checks=$((failed_checks + 1))
    fi
    echo ""
    
    # Check individual services
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r endpoint port_or_path name <<< "$service_info"
        if [ -n "$port_or_path" ] && [ "$port_or_path" != "$name" ]; then
            endpoint="$endpoint:$port_or_path"
        fi
        
        total_checks=$((total_checks + 1))
        if ! check_service_health "$endpoint" "$name"; then
            failed_checks=$((failed_checks + 1))
        fi
    done
    echo ""
    
    # Check API authentication
    total_checks=$((total_checks + 1))
    if ! check_api_authentication; then
        failed_checks=$((failed_checks + 1))
    fi
    echo ""
    
    # Summary
    local passed_checks=$((total_checks - failed_checks))
    
    if [ $failed_checks -eq 0 ]; then
        print_success "All health checks passed! ($passed_checks/$total_checks)"
        echo ""
        print_status "Your local Supabase stack is fully operational!"
        echo "  Frontend: http://localhost"
        echo "  Studio: http://localhost/studio/"
        echo "  API: http://localhost/rest/"
        return 0
    else
        print_error "Health check failed! ($passed_checks/$total_checks checks passed)"
        echo ""
        print_warning "Troubleshooting suggestions:"
        if [ $failed_checks -gt 3 ]; then
            echo "  1. Restart all services: docker-compose -f docker-compose.local.yml restart"
            echo "  2. Check Docker logs: docker-compose -f docker-compose.local.yml logs"
            echo "  3. Verify .env configuration"
        else
            echo "  1. Check specific service logs: docker-compose -f docker-compose.local.yml logs [service-name]"
            echo "  2. Restart failed services: docker-compose -f docker-compose.local.yml restart [service-name]"
        fi
        return 1
    fi
}

monitor_services() {
    print_status "Starting continuous service monitoring..."
    print_warning "Press Ctrl+C to stop monitoring"
    echo ""
    
    while true; do
        clear
        echo "=== Service Health Monitor $(date) ==="
        echo ""
        
        for service_info in "${SERVICES[@]}"; do
            IFS=':' read -r endpoint port_or_path name <<< "$service_info"
            if [ -n "$port_or_path" ] && [ "$port_or_path" != "$name" ]; then
                endpoint="$endpoint:$port_or_path"
            fi
            
            check_service_health "$endpoint" "$name" || true
        done
        
        echo ""
        echo "Next check in 30 seconds..."
        sleep 30
    done
}

print_usage() {
    echo "Service Health Check Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check        Run comprehensive health check (default)"
    echo "  monitor      Start continuous monitoring"
    echo "  docker       Check Docker containers only"
    echo "  jwt          Check JWT configuration only"
    echo "  database     Check database schema only"
    echo "  api          Test API authentication only"
    echo "  help         Show this help message"
    echo ""
}

# Main execution
case "${1:-check}" in
    "check")
        run_comprehensive_health_check
        ;;
    "monitor")
        monitor_services
        ;;
    "docker")
        check_docker_containers
        ;;
    "jwt")
        check_jwt_configuration
        ;;
    "database")
        check_database_schema
        ;;
    "api")
        check_api_authentication
        ;;
    "help"|*)
        print_usage
        ;;
esac