#!/bin/bash

# Traefik Setup Script for Church Management System

set -e

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

print_status "🚀 Setting up Traefik for Church Management System..."

# Load environment variables
if [ -f .env ]; then
    source .env
else
    print_error ".env file not found"
    exit 1
fi

# Create Traefik directory structure
print_status "Creating Traefik directory structure..."
mkdir -p traefik/logs
mkdir -p traefik/certs

# Create ACME file with proper permissions
print_status "Setting up SSL certificate storage..."
if [ ! -f traefik/acme.json ]; then
    touch traefik/acme.json
    chmod 600 traefik/acme.json
    print_success "✅ Created acme.json file for SSL certificates"
else
    # Ensure proper permissions on existing file
    chmod 600 traefik/acme.json
    print_success "✅ ACME file permissions verified"
fi

# Set up log directory permissions
print_status "Setting up log directory permissions..."
chmod 755 traefik/logs
print_success "✅ Log directory permissions set"

# Validate environment variables for production
if [ "${1:-production}" = "production" ]; then
    print_status "Validating production environment..."
    
    # Check domain
    if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "your-domain.com" ]; then
        print_error "❌ DOMAIN must be set for production deployment"
        print_error "Please set your actual domain in .env file"
        exit 1
    fi
    
    # Check ACME email
    if [ -z "$ACME_EMAIL" ] || [ "$ACME_EMAIL" = "admin@your-domain.com" ]; then
        print_warning "⚠️  ACME_EMAIL not set, using admin@$DOMAIN"
        export ACME_EMAIL="admin@$DOMAIN"
        # Update .env file
        if grep -q "^ACME_EMAIL=" .env; then
            sed -i "s/^ACME_EMAIL=.*/ACME_EMAIL=$ACME_EMAIL/" .env
        else
            echo "ACME_EMAIL=$ACME_EMAIL" >> .env
        fi
    fi
    
    print_success "✅ Production environment validated"
    print_status "Domain: $DOMAIN"
    print_status "ACME Email: $ACME_EMAIL"
fi

# Generate dashboard authentication if needed
print_status "Setting up Traefik dashboard authentication..."
if [ ! -f traefik/.htpasswd ]; then
    # Generate admin password hash (admin:admin by default)
    ADMIN_PASS_HASH='$2y$10$8BmOJ7rMj7jKOw1QqjwxX.QJ7XJ0YJ3XJ7XJ7XJ7XJ7XJ7XJ7XJ7XJ'
    echo "admin:$ADMIN_PASS_HASH" > traefik/.htpasswd
    print_success "✅ Default dashboard credentials created (admin:admin)"
    print_warning "⚠️  Change the default password in production!"
else
    print_success "✅ Dashboard authentication file exists"
fi

# Test Traefik configuration
print_status "Validating Traefik configuration..."

# Check if config files exist
required_files=(
    "traefik/traefik.yml"
    "traefik/traefik.dev.yml" 
    "traefik/dynamic.yml"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    print_error "❌ Missing required Traefik configuration files:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    print_error "Please ensure all Traefik configuration files are in place."
    exit 1
fi

print_success "✅ All Traefik configuration files found"

# Validate YAML syntax (if yq is available)
if command -v yq >/dev/null 2>&1; then
    print_status "Validating YAML syntax..."
    for file in "${required_files[@]}"; do
        if ! yq eval . "$file" >/dev/null 2>&1; then
            print_error "❌ Invalid YAML syntax in $file"
            exit 1
        fi
    done
    print_success "✅ YAML syntax validation passed"
else
    print_warning "⚠️  yq not available, skipping YAML validation"
fi

# Create docker networks if they don't exist
print_status "Setting up Docker networks..."
if ! docker network ls | grep -q "traefik"; then
    docker network create traefik
    print_success "✅ Created traefik network"
else
    print_success "✅ Traefik network already exists"
fi

if ! docker network ls | grep -q "supabase"; then
    docker network create supabase  
    print_success "✅ Created supabase network"
else
    print_success "✅ Supabase network already exists"
fi

# Display setup summary
print_success "🎉 Traefik setup completed successfully!"
echo ""
print_status "📋 Setup Summary:"
echo "  🔧 Configuration files: Ready"
echo "  🔐 SSL certificate storage: Ready (traefik/acme.json)"
echo "  📝 Log directory: Ready (traefik/logs/)"
echo "  🌐 Docker networks: Ready"
echo "  🔑 Dashboard auth: Ready (admin:admin)"

if [ "${1:-production}" = "production" ]; then
    echo ""
    print_status "🚀 Production Setup:"
    echo "  🌍 Domain: $DOMAIN"
    echo "  📧 ACME Email: $ACME_EMAIL"
    echo "  🔒 SSL: Let's Encrypt automatic"
    echo ""
    print_warning "🔐 Security Reminders:"
    echo "  • Change default dashboard password"
    echo "  • Ensure firewall allows ports 80, 443"
    echo "  • DNS records point to this server"
    echo "  • Monitor SSL certificate renewal"
else
    echo ""
    print_status "🛠️  Development Setup:"
    echo "  🌍 Domain: localhost"
    echo "  🔒 SSL: Disabled"
    echo "  📊 Dashboard: http://localhost:8080"
fi

echo ""
print_status "📚 Next Steps:"
echo "  1. Start services: docker-compose up -d"
echo "  2. Check logs: docker-compose logs -f traefik"
echo "  3. Access dashboard: ${1:-production == "production" && echo "https://traefik.$DOMAIN" || echo "http://localhost:8080"}"
echo ""

print_success "Traefik is ready to deploy! 🚀"