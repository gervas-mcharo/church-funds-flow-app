# Church Management System - Docker Deployment

A complete containerized solution for the Church Financial Management System using Docker Compose with Traefik reverse proxy and self-hosted Supabase.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Traefik     │    │    Frontend     │    │   Supabase      │
│ Reverse Proxy   │───▶│  React App      │    │   Stack         │
│ SSL/LetsEncrypt │    │  (Nginx)        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         └──────────────────┬─────────────────────────────┘
                           │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- Domain name (for production)
- 2GB+ RAM recommended

### 1. Clone and Setup

```bash
git clone <repository-url>
cd church-management-system

# Make scripts executable
chmod +x scripts/*.sh

# Copy environment file
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```bash
# Required Settings
DOMAIN=your-domain.com
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-32-character-jwt-secret-key
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Deploy

```bash
# Initialize the system
./scripts/init-system.sh

# Choose deployment type:
# 1) Development (localhost)
# 2) Production (with domain)
```

## 📁 Project Structure

```
project/
├── docker-compose.yml              # Production configuration
├── docker-compose.dev.yml          # Development configuration
├── .env.example                    # Environment template
│
├── frontend/
│   ├── Dockerfile                  # Production frontend build
│   ├── Dockerfile.dev              # Development with hot-reload
│   └── nginx.conf                  # Nginx configuration
│
├── traefik/
│   ├── traefik.yml                 # Production Traefik config
│   ├── traefik.dev.yml             # Development Traefik config
│   ├── dynamic.yml                 # Dynamic configuration
│   └── acme.json                   # SSL certificates (auto-generated)
│
├── supabase/
│   └── migrations/                 # Database migrations
│       ├── 01_initial_schema.sql
│       ├── 02_rls_policies.sql
│       └── 03_functions_and_triggers.sql
│
└── scripts/
    ├── init-system.sh              # System initialization
    ├── migrate-db.sh               # Database migration
    └── backup.sh                   # Backup utilities
```

## 🌐 Service URLs

### Development (localhost)
- **Application**: http://localhost
- **Admin Panel**: http://localhost/admin
- **Traefik Dashboard**: http://localhost:8080
- **Database**: localhost:5432

### Production (with domain)
- **Application**: https://your-domain.com
- **Admin Panel**: https://admin.your-domain.com
- **API**: https://api.your-domain.com
- **Traefik Dashboard**: https://traefik.your-domain.com

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DOMAIN` | Your domain name | Production | `localhost` |
| `POSTGRES_PASSWORD` | Database password | Yes | - |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Yes | - |
| `SUPABASE_ANON_KEY` | Anonymous access key | Yes | - |
| `SUPABASE_SERVICE_KEY` | Service role key | Yes | - |
| `SMTP_HOST` | Email server host | No | - |
| `SMTP_USER` | Email username | No | - |
| `SMTP_PASS` | Email password | No | - |

### SSL Certificates

Production deployment automatically obtains SSL certificates from Let's Encrypt. Ensure:

1. Domain points to your server
2. Ports 80 and 443 are open
3. `ACME_EMAIL` is set in `.env`

## 🗄️ Database Management

### Migrations

```bash
# Run migrations manually
./scripts/migrate-db.sh

# Check migration status
docker exec postgres psql -U postgres -d postgres -c "SELECT * FROM applied_migrations;"
```

### Backup & Restore

```bash
# Create backup
./scripts/backup.sh

# Restore from backup
gunzip backups/database_backup_YYYYMMDD_HHMMSS.sql.gz
docker exec -i postgres psql -U postgres -d postgres < backups/database_backup_YYYYMMDD_HHMMSS.sql
```

## 🔍 Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f traefik

# Database logs
docker exec postgres tail -f /var/log/postgresql/postgresql.log
```

### Health Checks

```bash
# Check service status
docker-compose ps

# Test database connection
docker exec postgres pg_isready -U postgres

# Check Traefik routes
curl http://localhost:8080/api/http/routers
```

## 🔧 Development

### Hot Reload Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# The frontend will reload automatically when you change files
# Database changes require running migrations
```

### Adding New Migrations

1. Create new migration file: `supabase/migrations/04_your_migration.sql`
2. Run migration: `./scripts/migrate-db.sh`

### Custom Configuration

- **Frontend**: Modify `frontend/nginx.conf`
- **Reverse Proxy**: Edit `traefik/traefik.yml`
- **Database**: Add to `supabase/migrations/`

## 🚀 Production Deployment

### Server Requirements

- **CPU**: 2+ cores
- **RAM**: 4GB+ recommended
- **Storage**: 20GB+ SSD
- **Network**: Static IP with domain

### Deployment Steps

1. **DNS Configuration**:
   ```bash
   # Point these records to your server IP:
   A     your-domain.com          → YOUR_SERVER_IP
   CNAME api.your-domain.com      → your-domain.com
   CNAME admin.your-domain.com    → your-domain.com
   CNAME traefik.your-domain.com  → your-domain.com
   ```

2. **Firewall Setup**:
   ```bash
   # Allow required ports
   ufw allow 22    # SSH
   ufw allow 80    # HTTP
   ufw allow 443   # HTTPS
   ufw enable
   ```

3. **Deploy**:
   ```bash
   ./scripts/init-system.sh
   # Choose option 2 for production
   ```

### Security Considerations

- Change default passwords
- Use strong JWT secrets
- Enable firewall
- Regular security updates
- Monitor access logs
- Enable database backups

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify connection
docker exec postgres pg_isready -U postgres
```

#### 2. SSL Certificate Issues
```bash
# Check Traefik logs
docker-compose logs traefik

# Verify domain DNS
nslookup your-domain.com

# Check certificate status
curl -I https://your-domain.com
```

#### 3. Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Verify Nginx configuration
docker exec frontend nginx -t

# Check Traefik routing
curl -H "Host: your-domain.com" http://localhost
```

#### 4. Migration Failures
```bash
# Check database schema
docker exec postgres psql -U postgres -d postgres -c "\dt"

# Run specific migration
docker exec -i postgres psql -U postgres -d postgres < supabase/migrations/01_initial_schema.sql

# Reset migrations (DANGER: Data loss)
docker exec postgres psql -U postgres -d postgres -c "DROP TABLE IF EXISTS applied_migrations;"
```

### Performance Optimization

1. **Database**:
   - Increase shared_buffers
   - Enable query optimization
   - Regular VACUUM and ANALYZE

2. **Frontend**:
   - Enable gzip compression
   - Set proper cache headers
   - Optimize static assets

3. **Traefik**:
   - Enable compression middleware
   - Configure rate limiting
   - Use connection pooling

## 📚 Additional Resources

- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Let's Encrypt](https://letsencrypt.org/)

## 🤝 Support

For issues and questions:

1. Check the troubleshooting section
2. Review logs for error messages
3. Verify configuration files
4. Check Docker and network status

## 📜 License

This project is licensed under the MIT License. See LICENSE file for details.