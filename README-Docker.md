# Church Management System - Docker Deployment

A complete containerized solution for the Church Financial Management System with flexible deployment modes: Local Supabase Stack, Cloud Integration, and Production.

## 🏗️ Architecture Overview

The system supports three deployment modes with automatic environment detection:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Traefik     │    │    Frontend     │    │   Supabase      │
│ Reverse Proxy   │───▶│  React App      │    │   Services      │
│ SSL/Routing     │    │  (Auto-Config)  │    │ (Local/Cloud)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                                              │
          └──────────────────┬─────────────────────────────┘
                            │
                     ┌─────────────────┐
                     │   PostgreSQL    │
                     │ (Local/Cloud)   │
                     └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose v2.0+
- Domain name (for production)
- 4GB+ RAM (for local mode)

### 1. Initialize System

```bash
# Clone and setup
git clone <repository-url>
cd church-management-system
chmod +x scripts/*.sh

# Interactive initialization
./scripts/init-system-v2.sh

# Or specify mode directly
./scripts/init-system-v2.sh local      # Full local Supabase stack
./scripts/init-system-v2.sh cloud      # Cloud Supabase integration
./scripts/init-system-v2.sh production # Production deployment
```

### 2. Deploy Services

```bash
# Local development (all services local)
docker-compose -f docker-compose.local.yml up -d

# Cloud integration (lightweight local)
docker-compose -f docker-compose.cloud.yml up -d

# Production deployment
docker-compose -f docker-compose.yml up -d
```

### 3. Apply Migrations

```bash
# Enhanced migration system (auto-detects mode)
./scripts/migrate-db-v2.sh
```

## 📋 Deployment Modes

### Local Mode - Full Supabase Stack
**Best for:** Complete offline development

**Services included:**
- PostgreSQL with Supabase extensions
- PostgREST (Auto REST API)
- GoTrue (Authentication)
- Storage API (File management)
- Studio (Admin dashboard)
- Edge Functions (Serverless runtime)

**URLs:**
- Application: `http://localhost`
- Studio: `http://localhost/studio/`
- API: `http://localhost/rest/`

### Cloud Mode - Hybrid Development
**Best for:** Production-like development

**Services included:**
- Local frontend with hot-reload
- Cloud Supabase backend
- Traefik for local routing

**Setup:**
1. Create Supabase project at https://supabase.com
2. Update `.env` with cloud credentials
3. Deploy with cloud compose file

### Production Mode - Full Production
**Best for:** Live deployment

**Features:**
- SSL certificates (Let's Encrypt)
- Domain-based routing
- Security headers
- Rate limiting

## 🔧 Environment Management

### Switch Between Modes

```bash
# Check current status
./scripts/environment-manager.sh status

# Switch modes
./scripts/environment-manager.sh switch local
./scripts/environment-manager.sh switch cloud
./scripts/environment-manager.sh switch production

# Validate configuration
./scripts/environment-manager.sh validate
```

### JWT and Security Management

```bash
# Generate secure JWT tokens
./scripts/jwt-manager.sh generate

# Rotate JWT secrets
./scripts/jwt-manager.sh rotate

# Validate JWT configuration
./scripts/jwt-manager.sh validate
```

### Health Monitoring

```bash
# Check all service health
./scripts/service-health-check.sh

# Check specific mode services
./scripts/service-health-check.sh local
./scripts/service-health-check.sh cloud
```

## 📁 Project Structure

```
church-management-system/
├── docker-compose.local.yml     # Local Supabase stack
├── docker-compose.cloud.yml     # Cloud integration
├── docker-compose.yml           # Production deployment
├── .env.example                 # Environment template
│
├── frontend/
│   ├── Dockerfile              # Production build
│   ├── Dockerfile.dev          # Development with hot-reload
│   └── nginx.conf              # Nginx configuration
│
├── traefik/
│   ├── traefik.local.yml       # Local development routing
│   ├── traefik.cloud.yml       # Cloud integration routing
│   └── traefik.yml             # Production routing
│
├── supabase/
│   ├── init/                   # Database initialization
│   ├── functions/              # Edge functions
│   └── migrations/             # Schema migrations
│
└── scripts/
    ├── init-system-v2.sh       # Enhanced system initialization
    ├── environment-manager.sh  # Mode switching and validation
    ├── jwt-manager.sh          # JWT token management
    ├── migrate-db-v2.sh        # Enhanced migration system
    └── service-health-check.sh # Health monitoring
```

## ⚙️ Configuration

### Essential Environment Variables

```bash
# Core Settings
SUPABASE_MODE=local              # local, cloud, or production
DOMAIN=your-domain.com           # For production
POSTGRES_PASSWORD=auto-generated # Secure database password
JWT_SECRET=auto-generated        # 32-character JWT secret

# Local Mode
SUPABASE_LOCAL_URL=http://localhost
SUPABASE_LOCAL_ANON_KEY=auto-generated
SUPABASE_LOCAL_SERVICE_KEY=auto-generated

# Cloud Mode
SUPABASE_CLOUD_URL=https://your-project.supabase.co
SUPABASE_CLOUD_ANON_KEY=your-cloud-anon-key
SUPABASE_CLOUD_SERVICE_KEY=your-cloud-service-key

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🗄️ Database Management

### Migrations

```bash
# Run enhanced migrations
./scripts/migrate-db-v2.sh

# For cloud mode (generates SQL file)
./scripts/migrate-db-v2.sh
# Then apply migrations_for_cloud.sql in Supabase Dashboard

# Check migration status
docker-compose exec postgres psql -U postgres -c "SELECT * FROM applied_migrations;"
```

### Backup & Restore

```bash
# Create backup
./scripts/backup.sh

# Restore backup
./scripts/backup.sh restore backup_file.sql.gz
```

## 🔍 Monitoring & Troubleshooting

### Service Status

```bash
# Check all services
./scripts/service-health-check.sh

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Check specific service
docker-compose -f docker-compose.local.yml logs frontend
```

### Common Issues

#### Services Not Starting
```bash
# Check Docker daemon
systemctl status docker

# Verify environment
./scripts/environment-manager.sh validate

# Check port conflicts
netstat -tulpn | grep :80
```

#### Database Connection Issues
```bash
# Wait for PostgreSQL initialization (1-2 minutes)
./scripts/service-health-check.sh

# Test connection
docker-compose exec postgres pg_isready -U postgres
```

#### JWT Token Issues
```bash
# Regenerate JWT tokens
./scripts/jwt-manager.sh generate

# Restart all services
docker-compose restart
```

## 🚀 Production Deployment

### Server Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 20GB+ SSD
- **Network**: Static IP with domain

### Production Setup

1. **DNS Configuration**:
```bash
A     your-domain.com          → YOUR_SERVER_IP
CNAME api.your-domain.com      → your-domain.com
CNAME admin.your-domain.com    → your-domain.com
```

2. **Firewall**:
```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

3. **Deploy**:
```bash
./scripts/init-system-v2.sh production
```

### Security Checklist
- ✅ Strong auto-generated passwords
- ✅ Secure JWT secrets with rotation
- ✅ SSL certificates (Let's Encrypt)
- ✅ Security headers and rate limiting
- ✅ Firewall configuration
- ✅ Regular backups

## 📈 Performance Optimization

### Local Mode
- PostgreSQL: 1-2 minute initialization
- RAM usage: 4-8GB for all services
- Disk usage: 2-4GB for images

### Cloud Mode
- Minimal local resources
- Internet connectivity required
- Supabase tier limitations apply

### Production Mode
- Enable caching and compression
- Configure CDN for static assets
- Database query optimization

## 🔄 Data Migration

### Local to Cloud
```bash
# Export local data
./scripts/backup.sh export

# Switch to cloud mode
./scripts/environment-manager.sh switch cloud

# Import to cloud (via Supabase Dashboard)
```

### Cloud to Local
```bash
# Switch to local mode
./scripts/environment-manager.sh switch local

# Deploy local stack
docker-compose -f docker-compose.local.yml up -d

# Import cloud data
./scripts/backup.sh import backup_file.sql
```

## 🆘 Support & Resources

### Debug Commands
```bash
# Environment validation
./scripts/environment-manager.sh validate

# Service health check
./scripts/service-health-check.sh

# View all logs
docker-compose logs -f

# Reset everything (WARNING: Data loss)
docker-compose down -v && ./scripts/init-system-v2.sh
```

### Documentation Links
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Supabase Documentation](https://supabase.com/docs)
- [Traefik Documentation](https://doc.traefik.io/traefik/)

### Getting Help
1. Check service health and logs
2. Validate environment configuration
3. Review troubleshooting section
4. Check GitHub issues and discussions

---

## 📜 License

This project is licensed under the MIT License. See LICENSE file for details.