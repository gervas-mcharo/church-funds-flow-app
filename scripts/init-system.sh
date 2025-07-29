#!/bin/bash

# Church Management System - Docker Initialization Script
# This script initializes the containerized environment

set -e

echo "🏛️  Church Management System - Docker Setup"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    print_error "Docker Compose is not installed. Please install Docker Compose."
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
        echo "- JWT_SECRET: JWT secret key (32+ characters)"
        echo "- SUPABASE_ANON_KEY: Supabase anonymous key"
        echo "- SUPABASE_SERVICE_KEY: Supabase service role key"
        echo ""
        exit 1
    else
        print_error ".env file not found and no .env.example to copy from."
        exit 1
    fi
fi

# Load environment variables
source .env

# Validate required environment variables
print_status "Validating environment configuration..."
required_vars=("DOMAIN" "POSTGRES_PASSWORD" "JWT_SECRET" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_KEY")
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
    exit 1
fi

# Check JWT secret length
if [ ${#JWT_SECRET} -lt 32 ]; then
    print_error "JWT_SECRET must be at least 32 characters long."
    exit 1
fi

print_success "Environment validation passed."

# Function to generate Supabase keys if needed
generate_supabase_keys() {
    print_status "Generating Supabase keys..."
    
    # Generate proper JWT tokens for Supabase keys
    if [ -z "$SUPABASE_ANON_KEY" ] || [ "$SUPABASE_ANON_KEY" = "your-supabase-anon-key" ]; then
        # Generate anon JWT with 'anon' role
        SUPABASE_ANON_KEY=$(echo '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo "{\"iss\":\"supabase\",\"ref\":\"local\",\"role\":\"anon\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 31536000))}" | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo -n "$(echo '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo "{\"iss\":\"supabase\",\"ref\":\"local\",\"role\":\"anon\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 31536000))}" | base64 -w 0 | tr -d '=' | tr '/+' '_-')" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w 0 | tr -d '=' | tr '/+' '_-')
        sed -i "s/SUPABASE_ANON_KEY=.*/SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY/" .env
        print_success "Generated Supabase anon key"
    fi
    
    # Generate service role JWT with 'service_role' role
    if [ -z "$SUPABASE_SERVICE_KEY" ] || [ "$SUPABASE_SERVICE_KEY" = "your-supabase-service-role-key" ]; then
        SUPABASE_SERVICE_KEY=$(echo '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo "{\"iss\":\"supabase\",\"ref\":\"local\",\"role\":\"service_role\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 31536000))}" | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo -n "$(echo '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 | tr -d '=' | tr '/+' '_-').$(echo "{\"iss\":\"supabase\",\"ref\":\"local\",\"role\":\"service_role\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 31536000))}" | base64 -w 0 | tr -d '=' | tr '/+' '_-')" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w 0 | tr -d '=' | tr '/+' '_-')
        sed -i "s/SUPABASE_SERVICE_KEY=.*/SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY/" .env
        print_success "Generated Supabase service role key"
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
        print_status "Setting up development environment..."
        ;;
    2)
        COMPOSE_FILE="docker-compose.yml"
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

# Pull latest images
print_status "Pulling Docker images..."
docker-compose -f $COMPOSE_FILE pull

# Start the services
print_status "Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for database to be ready
print_status "Waiting for database to be ready..."
timeout=60
counter=0
until docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U ${POSTGRES_USER:-postgres} >/dev/null 2>&1; do
    if [ $counter -eq $timeout ]; then
        print_error "Database failed to start within $timeout seconds."
        exit 1
    fi
    echo -n "."
    sleep 2
    ((counter++))
done

print_success "Database is ready!"

# Run database migrations
print_status "Running database migrations..."
./scripts/migrate-db.sh

# Display status
echo ""
print_success "🎉 Church Management System is now running!"
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
echo "  docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🛑 To stop services:"
echo "  docker-compose -f $COMPOSE_FILE down"
echo ""

print_warning "Don't forget to:"
echo "  1. Create your first admin user through the application"
echo "  2. Configure SMTP settings for email notifications"
echo "  3. Set up regular database backups"
echo ""

print_success "Setup complete! 🚀"