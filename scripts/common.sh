#!/bin/bash

# Common functions for Church Management System scripts
# Source this file in other scripts to use shared functionality

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

# Detect Docker Compose command (silent version for command substitution)
detect_compose_command_silent() {
    local compose_command=""
    
    # Check for Docker Compose V2 (docker compose)
    if docker compose version >/dev/null 2>&1; then
        compose_command="docker compose"
    # Check for Docker Compose V1 (docker-compose)
    elif command -v docker-compose >/dev/null 2>&1; then
        compose_command="docker-compose"
    else
        return 1
    fi
    
    echo "$compose_command"
}

# Detect Docker Compose command (verbose version with output)
detect_compose_command() {
    local compose_command=""
    
    # Check for Docker Compose V2 (docker compose)
    if docker compose version >/dev/null 2>&1; then
        compose_command="docker compose"
        COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
        print_success "Docker Compose V2 found (version: $COMPOSE_VERSION)"
    # Check for Docker Compose V1 (docker-compose)
    elif command -v docker-compose >/dev/null 2>&1; then
        compose_command="docker-compose"
        COMPOSE_VERSION=$(docker-compose version --short 2>/dev/null || echo "unknown")
        print_success "Docker Compose V1 found (version: $COMPOSE_VERSION)"
        print_warning "You're using Docker Compose V1. Consider upgrading to V2 for better performance."
    else
        print_error "Docker Compose is not installed."
        print_error "Please install Docker Compose:"
        print_error "  - For Docker Desktop: Compose is included"
        print_error "  - For Linux: https://docs.docker.com/compose/install/"
        return 1
    fi
    
    echo "$compose_command"
}

# Function to run compose commands with the detected version
run_compose() {
    local compose_cmd
    # Use the silent version to avoid capturing print output
    compose_cmd=$(detect_compose_command_silent) || return 1
    $compose_cmd "$@"
}

# Load environment variables safely
load_env() {
    if [ -f .env ]; then
        # Check for proper format and unquoted values with spaces
        if ! grep -q "^[A-Z_][A-Z0-9_]*=" .env; then
            print_error ".env file appears to be malformed. Please check the format."
            return 1
        fi
        
        # Check for unquoted values with spaces (common issue)
        if grep -q "^[A-Z_][A-Z0-9_]*=.*[[:space:]].*[^\"']$" .env; then
            print_error "Found unquoted values with spaces in .env file."
            print_error "Please quote values that contain spaces, e.g.:"
            print_error "  ORGANIZATION_NAME=\"Church Management System\""
            print_error "  PROJECT_NAME=\"Church Financial App\""
            return 1
        fi
        
        set -a  # automatically export all variables
        source .env
        set +a  # disable automatic export
        return 0
    else
        print_error ".env file not found"
        return 1
    fi
}

# Check if container is running
check_container_running() {
    local container_name=$1
    if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        return 0
    else
        return 1
    fi
}