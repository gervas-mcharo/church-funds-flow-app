# Host Configuration Setup Guide

This guide helps you configure your system for the enhanced local development mode with host-based routing.

## Overview

The enhanced mode uses host-based routing instead of path-based routing for better service isolation:

- `api.localhost` - PostgREST API
- `auth.localhost` - GoTrue Authentication
- `storage.localhost` - Storage API
- `studio.localhost` - Supabase Studio
- `functions.localhost` - Edge Functions
- `traefik.localhost` - Traefik Dashboard

## Host File Configuration

### Option 1: Automatic Setup (Recommended)

Run the provided script to automatically configure your hosts file:

```bash
./scripts/setup-hosts.sh
```

### Option 2: Manual Setup

Add the following entries to your hosts file:

#### On macOS/Linux:
Edit `/etc/hosts` (requires sudo):

```bash
sudo nano /etc/hosts
```

Add these lines:
```
127.0.0.1   api.localhost
127.0.0.1   auth.localhost
127.0.0.1   storage.localhost
127.0.0.1   studio.localhost
127.0.0.1   functions.localhost
127.0.0.1   traefik.localhost
```

#### On Windows:
Edit `C:\Windows\System32\drivers\etc\hosts` (requires Administrator):

```
127.0.0.1   api.localhost
127.0.0.1   auth.localhost
127.0.0.1   storage.localhost
127.0.0.1   studio.localhost
127.0.0.1   functions.localhost
127.0.0.1   traefik.localhost
```

## Verification

After configuration, test the setup:

1. **Start the services:**
   ```bash
   ./scripts/supabase-local.sh start
   ```

2. **Test each endpoint:**
   ```bash
   # API Health Check
   curl http://api.localhost/health
   
   # Auth Health Check
   curl http://auth.localhost/health
   
   # Studio Access
   curl -I http://studio.localhost
   
   # Traefik Dashboard
   curl -I http://traefik.localhost
   ```

3. **Browser Access:**
   - Studio: http://studio.localhost
   - Traefik Dashboard: http://traefik.localhost
   - Frontend: http://localhost:3000

## Troubleshooting

### DNS Resolution Issues

If hosts aren't resolving, try:

1. **Flush DNS cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemctl flush-dns
   
   # Windows
   ipconfig /flushdns
   ```

2. **Check hosts file syntax:**
   - Ensure no extra spaces or tabs
   - Use exactly one tab or space between IP and hostname
   - No trailing spaces on lines

3. **Test with nslookup:**
   ```bash
   nslookup api.localhost
   ```

### Service Access Issues

If services aren't accessible:

1. **Check Traefik logs:**
   ```bash
   ./scripts/supabase-local.sh logs traefik
   ```

2. **Verify service status:**
   ```bash
   ./scripts/supabase-local.sh status
   ```

3. **Check Docker networks:**
   ```bash
   docker network ls | grep supabase
   ```

## Alternative: Using a DNS Resolver

Instead of editing hosts file, you can use a local DNS resolver like `dnsmasq`:

### macOS with Homebrew:
```bash
brew install dnsmasq
echo 'address=/.localhost/127.0.0.1' >> /usr/local/etc/dnsmasq.conf
sudo brew services start dnsmasq
```

### Ubuntu/Debian:
```bash
sudo apt install dnsmasq
echo 'address=/.localhost/127.0.0.1' | sudo tee -a /etc/dnsmasq.conf
sudo systemctl restart dnsmasq
```

This will automatically resolve all `*.localhost` domains to `127.0.0.1`.

## Security Considerations

- The `.localhost` domain is reserved for local development
- Services are only accessible from your local machine
- In production, use proper domain names with SSL certificates
- Traefik dashboard should be secured in production environments

## Next Steps

After host configuration:

1. Initialize the system: `./scripts/init-system-v3.sh enhanced`
2. Start services: `./scripts/supabase-local.sh start`
3. Apply migrations: `./scripts/supabase-migrate.sh apply`
4. Access Studio: http://studio.localhost