#!/bin/bash

# Database Backup Script for Church Management System

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

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME=${1:-postgres}

# Load environment variables
if [ -f .env ]; then
    source .env
else
    print_error ".env file not found"
    exit 1
fi

POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-postgres}

# Create backup directory
mkdir -p $BACKUP_DIR

print_status "🔄 Starting backup for Church Management System..."

# Check if container is running
if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    print_error "PostgreSQL container '${CONTAINER_NAME}' is not running."
    exit 1
fi

# Database backup
DB_BACKUP_FILE="$BACKUP_DIR/database_backup_$DATE.sql"
print_status "Creating database backup..."

if docker exec $CONTAINER_NAME pg_dump -U $POSTGRES_USER -d $POSTGRES_DB --clean --if-exists > $DB_BACKUP_FILE; then
    print_success "✅ Database backup created: $DB_BACKUP_FILE"
    
    # Compress the backup
    gzip $DB_BACKUP_FILE
    print_success "✅ Database backup compressed: $DB_BACKUP_FILE.gz"
else
    print_error "❌ Database backup failed"
    exit 1
fi

# Storage backup (if storage volume exists)
STORAGE_BACKUP_FILE="$BACKUP_DIR/storage_backup_$DATE.tar.gz"
if docker volume ls | grep -q "storage"; then
    print_status "Creating storage backup..."
    
    if docker run --rm -v $(docker volume ls -q | grep storage):/source -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/storage_backup_$DATE.tar.gz -C /source .; then
        print_success "✅ Storage backup created: $STORAGE_BACKUP_FILE"
    else
        print_warning "⚠️  Storage backup failed or no storage volume found"
    fi
fi

# Configuration backup
CONFIG_BACKUP_FILE="$BACKUP_DIR/config_backup_$DATE.tar.gz"
print_status "Creating configuration backup..."

if tar czf $CONFIG_BACKUP_FILE \
    --exclude='*.log' \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='backups' \
    --exclude='traefik/acme.json' \
    docker-compose*.yml \
    .env.example \
    traefik/ \
    frontend/nginx.conf \
    supabase/migrations/ \
    scripts/ \
    2>/dev/null; then
    print_success "✅ Configuration backup created: $CONFIG_BACKUP_FILE"
else
    print_warning "⚠️  Configuration backup had some issues but completed"
fi

# Create backup manifest
MANIFEST_FILE="$BACKUP_DIR/backup_manifest_$DATE.txt"
print_status "Creating backup manifest..."

cat > $MANIFEST_FILE << EOF
Church Management System Backup Manifest
========================================
Date: $(date)
Backup ID: $DATE

Files:
- Database: database_backup_$DATE.sql.gz
- Storage: storage_backup_$DATE.tar.gz (if applicable)
- Configuration: config_backup_$DATE.tar.gz

Database Info:
- Container: $CONTAINER_NAME
- Database: $POSTGRES_DB
- User: $POSTGRES_USER

System Info:
- Docker Version: $(docker --version)
- Host: $(hostname)
- OS: $(uname -a)

Restore Instructions:
====================
1. Restore database:
   gunzip database_backup_$DATE.sql.gz
   docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB < database_backup_$DATE.sql

2. Restore storage (if applicable):
   docker run --rm -v storage_volume:/target -v \$(pwd):/source alpine tar xzf /source/storage_backup_$DATE.tar.gz -C /target

3. Restore configuration:
   tar xzf config_backup_$DATE.tar.gz

Verification:
=============
Database Tables: $(docker exec $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "N/A")
Database Size: $(docker exec $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));" 2>/dev/null || echo "N/A")
EOF

print_success "✅ Backup manifest created: $MANIFEST_FILE"

# Calculate backup sizes
print_status "📊 Backup Summary:"
echo ""
echo "📁 Backup Location: $BACKUP_DIR"
echo "🗄️  Database Backup: $(ls -lh $DB_BACKUP_FILE.gz 2>/dev/null | awk '{print $5}' || echo 'N/A')"
echo "💾 Storage Backup: $(ls -lh $STORAGE_BACKUP_FILE 2>/dev/null | awk '{print $5}' || echo 'N/A')"
echo "⚙️  Config Backup: $(ls -lh $CONFIG_BACKUP_FILE 2>/dev/null | awk '{print $5}' || echo 'N/A')"
echo "📋 Total Size: $(du -sh $BACKUP_DIR | awk '{print $1}')"

# Cleanup old backups (keep last 10)
print_status "🧹 Cleaning up old backups (keeping last 10)..."
find $BACKUP_DIR -name "*.sql.gz" -type f | sort | head -n -10 | xargs rm -f 2>/dev/null || true
find $BACKUP_DIR -name "storage_backup_*.tar.gz" -type f | sort | head -n -10 | xargs rm -f 2>/dev/null || true
find $BACKUP_DIR -name "config_backup_*.tar.gz" -type f | sort | head -n -10 | xargs rm -f 2>/dev/null || true
find $BACKUP_DIR -name "backup_manifest_*.txt" -type f | sort | head -n -10 | xargs rm -f 2>/dev/null || true

# Test backup integrity
print_status "🔍 Testing backup integrity..."
if gunzip -t $DB_BACKUP_FILE.gz 2>/dev/null; then
    print_success "✅ Database backup integrity verified"
else
    print_error "❌ Database backup integrity check failed"
    exit 1
fi

print_success "🎉 Backup completed successfully!"
echo ""
print_warning "💡 Tips:"
echo "  • Store backups in a secure, off-site location"
echo "  • Test restore procedures regularly"
echo "  • Consider encrypting sensitive backups"
echo "  • Schedule regular automated backups"
echo ""
print_status "Backup ID: $DATE"