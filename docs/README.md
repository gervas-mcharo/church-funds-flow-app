# Church Management System v3.0 - Enhanced Documentation

## Overview

The Church Management System has been completely rebuilt with official Supabase CLI integration, providing a modern, reliable, and secure development environment.

## Architecture

### Enhanced Local Development
- **Official Supabase CLI**: Uses `supabase start` instead of custom Docker services
- **Host-based Routing**: Services accessible via `*.localhost` domains
- **Automatic JWT Management**: Consistent secrets across all services
- **Enhanced Security**: Improved CORS and security headers

### Service Endpoints
- **Frontend**: `http://localhost:3000`
- **API (PostgREST)**: `http://api.localhost`
- **Auth (GoTrue)**: `http://auth.localhost`
- **Storage**: `http://storage.localhost`
- **Studio**: `http://studio.localhost`
- **Functions**: `http://functions.localhost`
- **Traefik Dashboard**: `http://traefik.localhost`

## Quick Start

### 1. Initialize System
```bash
# Choose enhanced mode (recommended)
./scripts/init-system-v3.sh enhanced
```

### 2. Setup Host Resolution
```bash
# Automatic setup (requires sudo/admin)
sudo ./scripts/setup-hosts.sh

# Or manual setup - see docs/HOST_SETUP.md
```

### 3. Start Services
```bash
# Start all services
./scripts/supabase-local.sh start

# Check status
./scripts/supabase-local.sh status
```

### 4. Apply Database Schema
```bash
# Apply migrations
./scripts/supabase-migrate.sh apply

# Or reset database
./scripts/supabase-migrate.sh reset
```

### 5. Access Services
- **Studio**: http://studio.localhost
- **Frontend**: http://localhost:3000
- **API Docs**: http://api.localhost

## Command Reference

### System Management
```bash
# Enhanced mode (recommended)
./scripts/init-system-v3.sh enhanced

# Cloud mode
./scripts/init-system-v3.sh cloud

# Legacy fallback
./scripts/init-system-v3.sh legacy
```

### Service Management
```bash
# Start all services
./scripts/supabase-local.sh start

# Stop all services
./scripts/supabase-local.sh stop

# Restart services
./scripts/supabase-local.sh restart

# Check status and URLs
./scripts/supabase-local.sh status

# View logs
./scripts/supabase-local.sh logs [service]
```

### Database Management
```bash
# Apply migrations
./scripts/supabase-migrate.sh apply

# Create new migration
./scripts/supabase-migrate.sh create "migration_name"

# Reset database
./scripts/supabase-migrate.sh reset

# Create backup
./scripts/supabase-migrate.sh backup

# Generate types
./scripts/supabase-local.sh types
```

### Host Configuration
```bash
# Setup localhost domains
sudo ./scripts/setup-hosts.sh

# Check status
./scripts/setup-hosts.sh status

# Test resolution
./scripts/setup-hosts.sh test

# Remove hosts
sudo ./scripts/setup-hosts.sh remove
```

## Development Workflow

### Daily Development
1. Start services: `./scripts/supabase-local.sh start`
2. Open Studio: http://studio.localhost
3. Start frontend: `npm run dev`
4. Develop and test

### Making Database Changes
1. Create migration: `./scripts/supabase-migrate.sh create "add_new_table"`
2. Edit migration file in `supabase/migrations/`
3. Apply migration: `./scripts/supabase-migrate.sh apply`
4. Generate types: `./scripts/supabase-local.sh types`

### Frontend Development
- Frontend auto-reloads on code changes
- Uses enhanced Supabase client with automatic service discovery
- CORS properly configured for all endpoints

## Deployment Modes

### Enhanced Local (Recommended)
- Uses official Supabase CLI and containers
- Host-based routing for better isolation
- Automatic JWT management
- Enhanced security and CORS
- Best developer experience

### Cloud Development
- Uses Supabase Cloud for backend
- Local frontend development
- Production-like environment
- Requires Supabase Cloud project

### Legacy Mode (Fallback)
- Original Docker Compose setup
- Use only if enhanced mode has issues
- Path-based routing
- Manual JWT management

## Troubleshooting

### Common Issues

#### Host Resolution Problems
```bash
# Check hosts file
./scripts/setup-hosts.sh status

# Flush DNS cache
./scripts/setup-hosts.sh flush

# Test resolution
./scripts/setup-hosts.sh test
```

#### Service Access Issues
```bash
# Check service status
./scripts/supabase-local.sh status

# View Traefik logs
./scripts/supabase-local.sh logs traefik

# Restart services
./scripts/supabase-local.sh restart
```

#### Database Issues
```bash
# Check database logs
./scripts/supabase-local.sh logs db

# Reset database
./scripts/supabase-migrate.sh reset

# Validate migrations
./scripts/supabase-migrate.sh validate
```

### Debug Information

#### Service Health Checks
```bash
# API health
curl http://api.localhost/health

# Auth health
curl http://auth.localhost/health

# Studio access
curl -I http://studio.localhost
```

#### Environment Variables
Check `.env` file for proper configuration:
- `SUPABASE_MODE=local`
- `DEPLOYMENT_MODE=enhanced`
- `SUPABASE_LOCAL_URL=http://api.localhost`

## File Structure

```
├── scripts/
│   ├── init-system-v3.sh      # Enhanced initialization
│   ├── supabase-install.sh    # CLI installation
│   ├── supabase-local.sh      # Service management
│   ├── supabase-migrate.sh    # Migration management
│   ├── setup-hosts.sh         # Host configuration
│   └── common.sh              # Shared functions
├── supabase/
│   ├── config.toml            # Enhanced Supabase config
│   └── migrations/            # Database migrations
├── traefik/
│   ├── traefik.supabase.yml   # Enhanced Traefik config
│   └── dynamic.supabase.yml   # Dynamic routing rules
├── docker-compose.supabase.yml # Enhanced Docker setup
├── docs/
│   ├── HOST_SETUP.md          # Host configuration guide
│   └── README.md              # This file
└── .env.example               # Enhanced environment template
```

## Security Considerations

### Local Development
- Services only accessible from localhost
- Enhanced CORS configuration
- Automatic JWT secret generation
- Traefik dashboard should be secured in production

### Production Deployment
- Use proper domain names with SSL certificates
- Configure proper CORS origins
- Secure Traefik dashboard with authentication
- Regular security updates for all components

## Migration from Legacy

### Automatic Migration
The enhanced system can automatically convert existing setup:

```bash
# Backup existing data
./scripts/supabase-migrate.sh backup

# Initialize enhanced mode
./scripts/init-system-v3.sh enhanced

# Convert legacy migrations
./scripts/supabase-migrate.sh convert

# Apply converted migrations
./scripts/supabase-migrate.sh apply
```

### Manual Migration Steps
1. Backup current database
2. Export existing data
3. Initialize enhanced mode
4. Import data to new system
5. Test all functionality

## Support and Contributing

### Getting Help
1. Check this documentation
2. Review troubleshooting section
3. Check GitHub issues
4. Create new issue with detailed information

### Contributing
1. Fork the repository
2. Create feature branch
3. Make changes and test
4. Submit pull request with description

## Changelog

### v3.0 (Enhanced Mode)
- Official Supabase CLI integration
- Host-based routing
- Enhanced security and CORS
- Automatic JWT management
- Improved developer experience
- Comprehensive documentation

### v2.0 (Legacy Mode)
- Custom Docker Compose setup
- Path-based routing
- Manual JWT management
- Basic Traefik configuration