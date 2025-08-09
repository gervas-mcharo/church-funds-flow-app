# Local Supabase Stack Implementation

This document explains the implementation of the full local Supabase stack with optional cloud mode for the Church Management System.

## Overview

The system now supports three deployment modes:

1. **Local Mode** - Full local Supabase stack with all services
2. **Cloud Mode** - Local frontend with cloud Supabase backend
3. **Production Mode** - Full production deployment with SSL

## Architecture

### Local Mode Architecture
```
┌─────────────────┐
│    Frontend     │
│   (React App)   │
└─────────────────┘
         │
┌─────────────────┐
│     Traefik     │
│ (Reverse Proxy) │
└─────────────────┘
         │
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   PostgreSQL    │    PostgREST    │     GoTrue      │     Storage     │
│   (Database)    │   (REST API)    │   (Auth API)    │   (Files API)   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
                                       │
                              ┌─────────────────┐
                              │     Studio      │
                              │  (Admin Panel)  │
                              └─────────────────┘
```

### Cloud Mode Architecture
```
┌─────────────────┐
│    Frontend     │
│   (React App)   │
└─────────────────┘
         │
┌─────────────────┐
│     Traefik     │
│ (Reverse Proxy) │
└─────────────────┘
         │
┌─────────────────┐
│  Cloud Supabase │
│   (All Services)│
└─────────────────┘
```

## Quick Start

### 1. Initialize the System

Run the enhanced initialization script:

```bash
# Interactive mode
./scripts/init-system-v2.sh

# Or specify mode directly
./scripts/init-system-v2.sh local   # Local mode
./scripts/init-system-v2.sh cloud   # Cloud mode
./scripts/init-system-v2.sh production # Production mode
```

### 2. Environment Management

Use the environment manager to switch between modes:

```bash
# Check current status
./scripts/environment-manager.sh status

# Switch to local mode
./scripts/environment-manager.sh switch local

# Switch to cloud mode
./scripts/environment-manager.sh switch cloud

# Validate configuration
./scripts/environment-manager.sh validate
```

### 3. Deploy Services

Based on your selected mode:

```bash
# Local mode
docker-compose -f docker-compose.local.yml up -d

# Cloud mode
docker-compose -f docker-compose.cloud.yml up -d

# Production mode
docker-compose -f docker-compose.yml up -d
```

### 4. Run Migrations

```bash
# Enhanced migration script (supports both local and cloud)
./scripts/migrate-db-v2.sh
```

## Configuration

### Environment Variables

The system uses a comprehensive `.env` file with mode-specific configurations:

```bash
# Core Configuration
SUPABASE_MODE=local  # local, cloud, or production

# Local Mode Configuration
SUPABASE_LOCAL_URL=http://localhost
SUPABASE_LOCAL_ANON_KEY=your-local-key
SUPABASE_LOCAL_SERVICE_KEY=your-local-service-key

# Cloud Mode Configuration
SUPABASE_CLOUD_URL=https://your-project.supabase.co
SUPABASE_CLOUD_ANON_KEY=your-cloud-anon-key
SUPABASE_CLOUD_SERVICE_KEY=your-cloud-service-key

# Database Configuration
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=auto-generated-secure-password

# JWT Configuration
JWT_SECRET=auto-generated-32-char-secret
```

### Frontend Configuration

The Supabase client automatically detects the environment mode and configures itself accordingly:

```typescript
// Environment detection in src/integrations/supabase/client.ts
const getEnvironmentMode = (): 'local' | 'cloud' => {
  const mode = import.meta.env.VITE_SUPABASE_MODE;
  if (mode === 'local' || mode === 'cloud') {
    return mode;
  }
  
  // Fallback: detect based on URL
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  return url.includes('localhost') ? 'local' : 'cloud';
};
```

## Local Mode Details

### Services Included

1. **PostgreSQL** - Supabase-compatible PostgreSQL with extensions
2. **PostgREST** - Automatic REST API from PostgreSQL schema
3. **GoTrue** - Authentication service
4. **Storage API** - File storage service
5. **Studio** - Admin dashboard
6. **Edge Functions** - Serverless functions runtime
7. **Traefik** - Reverse proxy and load balancer

### Service URLs

- Frontend: `http://localhost`
- API: `http://localhost/rest/`
- Auth: `http://localhost/auth/`
- Storage: `http://localhost/storage/`
- Studio: `http://localhost/studio/`
- Functions: `http://localhost/functions/`

### Database Initialization

The local PostgreSQL container is initialized with:
- Supabase system schemas (auth, storage, realtime)
- Required extensions (uuid-ossp, pgcrypto, pgjwt, pgsodium)
- Proper roles and permissions
- Application schema and data

## Cloud Mode Details

### Benefits

- Lightweight local development
- Production-grade Supabase services
- Automatic scaling and maintenance
- Real-time features work out of the box

### Setup Requirements

1. Create a Supabase project at https://supabase.com
2. Get your project URL and API keys
3. Update `.env` with cloud credentials
4. Apply migrations manually via Supabase Dashboard

### Migration for Cloud

For cloud mode, migrations are prepared as a single file:

```bash
# Generates migrations_for_cloud.sql
./scripts/migrate-db-v2.sh
```

Apply this file in your Supabase Dashboard > SQL Editor.

## Switching Between Modes

### Local to Cloud

1. Export your local data (optional)
2. Switch environment: `./scripts/environment-manager.sh switch cloud`
3. Update cloud credentials in `.env`
4. Deploy: `docker-compose -f docker-compose.cloud.yml up -d`
5. Apply migrations to cloud Supabase

### Cloud to Local

1. Switch environment: `./scripts/environment-manager.sh switch local`
2. Deploy: `docker-compose -f docker-compose.local.yml up -d`
3. Run migrations: `./scripts/migrate-db-v2.sh`
4. Import cloud data (optional)

## Troubleshooting

### Common Issues

1. **Services not starting**
   - Check Docker daemon is running
   - Verify `.env` configuration
   - Check port conflicts (80, 5432, 8080)

2. **Database connection issues**
   - Wait for PostgreSQL to fully initialize (can take 1-2 minutes)
   - Check database credentials in `.env`
   - Verify service health: `docker-compose ps`

3. **JWT token issues**
   - Ensure JWT_SECRET is properly generated and consistent
   - Restart all services after JWT changes

4. **Frontend can't connect to API**
   - Verify SUPABASE_MODE matches deployment
   - Check Traefik routing configuration
   - Ensure environment variables are passed to frontend

### Debug Commands

```bash
# Check service status
docker-compose -f docker-compose.local.yml ps

# View logs
docker-compose -f docker-compose.local.yml logs -f [service-name]

# Restart specific service
docker-compose -f docker-compose.local.yml restart [service-name]

# Check environment configuration
./scripts/environment-manager.sh validate

# Test database connection
docker-compose -f docker-compose.local.yml exec postgres psql -U postgres -c "SELECT 1;"
```

### Reset and Clean Start

```bash
# Stop all services
docker-compose -f docker-compose.local.yml down -v

# Remove volumes (WARNING: This deletes all data)
docker volume rm $(docker volume ls -q | grep church)

# Reinitialize
./scripts/init-system-v2.sh local
```

## Performance Considerations

### Local Mode

- Requires 4-8GB RAM for all services
- Uses about 2-4GB disk space for images
- PostgreSQL needs 1-2 minutes for full initialization
- Recommended for development and testing

### Cloud Mode

- Minimal local resource usage
- Depends on internet connectivity
- Limited by Supabase free tier quotas
- Recommended for production development

## Security Notes

1. **JWT Secrets** - Automatically generated strong secrets
2. **Database Passwords** - Auto-generated secure passwords
3. **Local Development** - Services only accessible on localhost
4. **Production** - SSL certificates and secure headers enabled

## Contributing

When contributing to the local Supabase implementation:

1. Test both local and cloud modes
2. Update migration scripts for schema changes
3. Verify environment switching works correctly
4. Update documentation for new features

## Support

For issues related to:
- **Local deployment**: Check Docker logs and service status
- **Cloud integration**: Verify Supabase project configuration
- **Migrations**: Use the enhanced migration script with debug output
- **Environment switching**: Use the environment manager validation

## Future Enhancements

Planned improvements:
1. Data synchronization between local and cloud
2. Backup and restore tools
3. Monitoring and alerting
4. Performance optimization
5. Multi-environment management