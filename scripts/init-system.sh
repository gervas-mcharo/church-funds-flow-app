#!/bin/bash

# Church Management System - Docker Initialization Script
# This script initializes the containerized environment

set -e

# Source common functions
source "$(dirname "$0")/common.sh"

echo "🏛️  Church Management System - Docker Setup"
echo "============================================="

# Check if Docker is running
print_status "Checking Docker installation and status..."
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running or not installed. Please start Docker and try again."
    print_error "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

print_success "Docker is running."

# Check for Docker Compose using common function  
print_status "Checking Docker Compose installation..."
# Validate Docker Compose is available and capture the command for display purposes
if docker compose version >/dev/null 2>&1; then
    COMPOSE_DISPLAY_COMMAND="docker compose"
    COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
    print_success "Docker Compose V2 found (version: $COMPOSE_VERSION)"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_DISPLAY_COMMAND="docker-compose"
    COMPOSE_VERSION=$(docker-compose version --short 2>/dev/null || echo "unknown")
    print_success "Docker Compose V1 found (version: $COMPOSE_VERSION)"
    print_warning "You're using Docker Compose V1. Consider upgrading to V2 for better performance."
else
    print_error "Docker Compose is not installed."
    print_error "Please install Docker Compose:"
    print_error "  - For Docker Desktop: Compose is included"
    print_error "  - For Linux: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create necessary directories
print_status "Creating directory structure..."
mkdir -p traefik/logs
mkdir -p supabase/volumes/db/data
mkdir -p supabase/volumes/storage
mkdir -p logs

# Set proper permissions
print_status "Setting up permissions..."
chmod 600 traefik/acme.json 2>/dev/null || touch traefik/acme.json && chmod 600 traefik/acme.json

# Check for environment file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        print_warning "No .env file found. Copying from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before continuing."
        echo ""
        echo "Required configurations:"
        echo "- DOMAIN: Your domain name"
        echo "- POSTGRES_PASSWORD: Database password"
        echo "- JWT_SECRET: Will be auto-generated if not set"
        echo "- SUPABASE_ANON_KEY: Will be auto-generated"
        echo "- SUPABASE_SERVICE_KEY: Will be auto-generated"
        echo ""
        exit 1
    else
        print_error ".env file not found and no .env.example to copy from."
        exit 1
    fi
fi

# Load environment variables using common function
print_status "Loading environment variables..."
load_env || exit 1

# Validate required environment variables (auto-generated ones excluded)
print_status "Validating environment configuration..."
required_vars=("DOMAIN" "POSTGRES_PASSWORD")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    print_error "Please set these in your .env file before continuing."
    exit 1
fi

# Check and generate JWT secret if needed
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secret-jwt-token-with-at-least-32-characters-long" ] || [ ${#JWT_SECRET} -lt 32 ]; then
    print_status "Generating strong JWT secret..."
    
    # Check if openssl is available
    if command -v openssl >/dev/null 2>&1; then
        NEW_JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
        print_success "Generated JWT secret using OpenSSL"
    # Fallback to /dev/urandom if openssl is not available
    elif [ -r /dev/urandom ]; then
        NEW_JWT_SECRET=$(head -c 48 /dev/urandom | base64 | tr -d '\n' | tr -d '=' | head -c 64)
        print_success "Generated JWT secret using /dev/urandom"
    else
        print_error "Cannot generate JWT secret: neither openssl nor /dev/urandom available"
        print_error "Please manually set a strong JWT_SECRET (64+ characters) in your .env file"
        exit 1
    fi
    
    # Update the .env file
    if [ -f .env ]; then
        # Replace existing JWT_SECRET line or add if it doesn't exist
        if grep -q "^JWT_SECRET=" .env; then
            sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$NEW_JWT_SECRET|" .env
        else
            echo "JWT_SECRET=$NEW_JWT_SECRET" >> .env
        fi
    fi
    
    # Set the variable for current session
    JWT_SECRET="$NEW_JWT_SECRET"
    export JWT_SECRET
    
    print_success "JWT secret updated in .env file (${#JWT_SECRET} characters)"
elif [ ${#JWT_SECRET} -lt 32 ]; then
    print_error "JWT_SECRET must be at least 32 characters long (current: ${#JWT_SECRET})."
    print_error "Run the script again to auto-generate a strong secret."
    exit 1
else
    print_success "JWT secret validation passed (${#JWT_SECRET} characters)"
fi

print_success "Environment validation passed."

# Function to generate Supabase keys if needed
generate_supabase_keys() {
    print_status "Generating Supabase keys..."
    
    # Generate proper JWT tokens for Supabase keys
    if [ -z "$SUPABASE_ANON_KEY" ] || [ "$SUPABASE_ANON_KEY" = "your-supabase-anon-key" ]; then
        # Generate anon JWT with 'anon' role
        SUPABASE_ANON_KEY=$(echo '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo "{\"iss\":\"supabase\",\"ref\":\"local\",\"role\":\"anon\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 31536000))}" | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo -n "$(echo '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo "{\"iss\":\"supabase\",\"ref\":\"local\",\"role\":\"anon\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 31536000))}" | base64 -w 0 | tr -d '=' | tr '/+' '_-')" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w 0 | tr -d '=' | tr '/+' '_-')
        sed -i "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" .env
        print_success "Generated Supabase anon key"
    fi
    
    # Generate service role JWT with 'service_role' role
    if [ -z "$SUPABASE_SERVICE_KEY" ] || [ "$SUPABASE_SERVICE_KEY" = "your-supabase-service-role-key" ]; then
        SUPABASE_SERVICE_KEY=$(echo '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo "{\"iss\":\"supabase\",\"ref\":\"local\",\"role\":\"service_role\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 31536000))}" | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo -n "$(echo '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo "{\"iss\":\"supabase\",\"ref\":\"local\",\"role\":\"service_role\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 31536000))}" | base64 -w 0 | tr -d '=' | tr '/+' '_-')" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w 0 | tr -d '=' | tr '/+' '_-')
        sed -i "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY|" .env
        print_success "Generated Supabase service role key"
    fi
}

# Function to setup the traefik configuration files
setup_traefik() {
    local env_type="$1"
    print_status "Setting up Traefik configuration..."
    
    if [ -f scripts/setup-traefik.sh ]; then
        # Ensure it's executable
        chmod +x scripts/setup-traefik.sh 2>/dev/null || true
        
        # Run setup and check result  
        if ./scripts/setup-traefik.sh "$env_type"; then
            print_success "✅ Traefik configuration ready"
        else
            print_error "❌ Traefik setup failed"
            exit 1
        fi
    else
        print_error "Required file scripts/setup-traefik.sh not found!"
        exit 1
    fi
}

# Choose deployment type
echo ""
echo "Select deployment type:"
echo "1) Development (local with hot-reload)"
echo "2) Production (with SSL and domain)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        COMPOSE_FILE="docker-compose.dev.yml"
        ENVIRONMENT="development"
        print_status "Setting up development environment..."
        ;;
    2)
        COMPOSE_FILE="docker-compose.yml"
        ENVIRONMENT="production"
        print_status "Setting up production environment..."
        
        # Validate domain for production
        if [ "$DOMAIN" = "your-domain.com" ]; then
            print_error "Please set your actual domain in .env file for production deployment."
            exit 1
        fi
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Generate keys for both development and production modes
generate_supabase_keys

# Setup the Traefik container
setup_traefik "$ENVIRONMENT"

# Pull latest images
print_status "Pulling Docker images..."
run_compose -f $COMPOSE_FILE pull

# STAGE 1: Start PostgreSQL first (to avoid dependency errors)
print_status "Starting PostgreSQL..."
run_compose -f $COMPOSE_FILE up -d postgres

# Wait for PostgreSQL to be healthy
print_status "Waiting for PostgreSQL to be healthy (first run may take 2-3 minutes)..."
timeout=300  # 5 minutes for initial setup
counter=0
start_time=$(date +%s)

while [ $counter -lt $timeout ]; do
    # Check if postgres service is healthy
    postgres_status=$(run_compose -f $COMPOSE_FILE ps postgres --format "table {{.Status}}" | tail -n +2)
    
    if echo "$postgres_status" | grep -q "healthy"; then
        print_success "PostgreSQL is healthy!"
        break
    fi
    
    # Check if postgres service is unhealthy (fail fast)
    if echo "$postgres_status" | grep -q "unhealthy"; then
        print_error "PostgreSQL container is unhealthy"
        print_status "PostgreSQL status: $postgres_status"
        print_status "Checking PostgreSQL logs:"
        run_compose -f $COMPOSE_FILE logs --tail=30 postgres
        exit 1
    fi
    
    # Progress indicator with timing
    if [ $((counter % 10)) -eq 0 ]; then
        elapsed=$(($(date +%s) - start_time))
        if [ $counter -eq 0 ]; then
            echo -n "  Progress: ."
        else
            echo -n " (${elapsed}s)."
        fi
    else
        echo -n "."
    fi
    
    sleep 2
    ((counter += 2))
done

# Check if we timed out
if [ $counter -ge $timeout ]; then
    print_error "PostgreSQL failed to become healthy within $timeout seconds."
    print_status "Final PostgreSQL status:"
    run_compose -f $COMPOSE_FILE ps postgres
    print_status "Recent PostgreSQL logs:"
    run_compose -f $COMPOSE_FILE logs --tail=50 postgres
    exit 1
fi

echo  # New line after progress dots

# STAGE 2: Start all remaining services (dependencies should now be satisfied)
print_status "Starting remaining services..."
run_compose -f $COMPOSE_FILE up -d

# Allow services time to initialize
print_status "Allowing services to initialize..."
sleep 15

# STAGE 3: Verify database connectivity
print_status "Verifying database connectivity..."
retry_count=0
max_retries=10

while [ $retry_count -lt $max_retries ]; do
    if run_compose -f $COMPOSE_FILE exec -T postgres pg_isready -U ${POSTGRES_USER:-postgres} >/dev/null 2>&1; then
        print_success "Database connectivity verified!"
        break
    fi
    
    echo -n "."
    sleep 2
    ((retry_count++))
done

if [ $retry_count -eq $max_retries ]; then
    print_error "Database connectivity check failed after $max_retries attempts"
    print_status "Checking PostgreSQL process status:"
    run_compose -f $COMPOSE_FILE exec -T postgres ps aux | grep postgres || true
    exit 1
fi

# STAGE 4: Run database migrations
print_status "Running database migrations..."
if ! ./scripts/migrate-db.sh; then
    print_error "Database migrations failed"
    print_status "Recent PostgreSQL logs:"
    run_compose -f $COMPOSE_FILE logs --tail=30 postgres
    exit 1
fi

# STAGE 5: Final health check of all services
print_status "Performing final health check of all services..."
sleep 5  # Allow services to settle after migrations

# Check service statuses
print_status "Checking service statuses..."
all_services_status=$(run_compose -f $COMPOSE_FILE ps --format "table {{.Name}}\t{{.Status}}")

echo "Service Status Summary:"
echo "$all_services_status"

# Check for any failed/exited services
failed_services=$(echo "$all_services_status" | grep -E "(Exit|Restarting)" | awk '{print $1}' || true)
if [ -n "$failed_services" ]; then
    print_error "Some services have failed:"
    echo "$failed_services"
    for service in $failed_services; do
        print_status "Logs for $service:"
        run_compose -f $COMPOSE_FILE logs --tail=20 "$service"
        echo "---"
    done
    print_error "Deployment failed due to service failures"
    exit 1
fi

# Check for unhealthy services (warning, not failure)
unhealthy_services=$(echo "$all_services_status" | grep -i unhealthy | awk '{print $1}' || true)
if [ -n "$unhealthy_services" ]; then
    print_warning "Some services are unhealthy (may resolve automatically):"
    echo "$unhealthy_services"
    print_status "This may not prevent basic functionality, but monitor these services."
fi

# Display status
echo ""
print_success "🎉 Church Management System is now running!"
echo ""

# Show running services count
running_services=$(echo "$all_services_status" | grep -c -E "(running|Up|healthy)" || echo "0")
total_services=$(echo "$all_services_status" | tail -n +2 | wc -l)
print_status "Services: $running_services/$total_services running"

echo ""
echo "Access URLs:"
if [ "$choice" = "1" ]; then
    echo "  📱 Application: http://localhost"
    echo "  🔧 Admin Panel: http://localhost/admin"
    echo "  📊 Traefik Dashboard: http://localhost:8080"
    echo "  🗄️  Database: localhost:5432"
else
    echo "  📱 Application: https://$DOMAIN"
    echo "  🔧 Admin Panel: https://admin.$DOMAIN"
    echo "  📊 Traefik Dashboard: https://traefik.$DOMAIN"
    echo "  🌐 API: https://api.$DOMAIN"
fi

echo ""
echo "🔍 To view logs:"
echo "  $COMPOSE_DISPLAY_COMMAND -f $COMPOSE_FILE logs -f"
echo ""
echo "🛑 To stop services:"
echo "  $COMPOSE_DISPLAY_COMMAND -f $COMPOSE_FILE down"
echo ""
echo "📊 To check service status:"
echo "  $COMPOSE_DISPLAY_COMMAND -f $COMPOSE_FILE ps"
echo ""

print_warning "Don't forget to:"
echo "  1. Create your first admin user through the application"
echo "  2. Configure SMTP settings for email notifications"
echo "  3. Set up regular database backups"
echo ""

print_success "Setup complete! 🚀"
