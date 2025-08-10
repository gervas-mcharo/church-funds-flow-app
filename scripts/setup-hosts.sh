#!/bin/bash

# Automatic host file setup for enhanced local development
# This script adds necessary localhost entries for host-based routing

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Required hosts
HOSTS=(
    "api.localhost"
    "auth.localhost"
    "storage.localhost"
    "studio.localhost"
    "functions.localhost"
    "traefik.localhost"
)

# Detect OS
OS=$(uname -s)
case "$OS" in
    "Darwin"|"Linux")
        HOSTS_FILE="/etc/hosts"
        ;;
    "MINGW"*|"CYGWIN"*|"MSYS"*)
        HOSTS_FILE="/c/Windows/System32/drivers/etc/hosts"
        ;;
    *)
        print_error "Unsupported operating system: $OS"
        exit 1
        ;;
esac

print_banner() {
    echo ""
    echo "========================================"
    echo "  Host File Setup for Enhanced Mode"
    echo "========================================"
    echo ""
}

# Check if running with appropriate permissions
check_permissions() {
    if [ ! -w "$HOSTS_FILE" ]; then
        print_error "Cannot write to $HOSTS_FILE"
        print_error "Please run with appropriate permissions:"
        
        case "$OS" in
            "Darwin"|"Linux")
                print_error "  sudo $0"
                ;;
            "MINGW"*|"CYGWIN"*|"MSYS"*)
                print_error "  Run as Administrator"
                ;;
        esac
        exit 1
    fi
}

# Check if host entry exists
host_exists() {
    local host=$1
    grep -q "127.0.0.1[[:space:]]*$host" "$HOSTS_FILE" 2>/dev/null
}

# Add host entry
add_host() {
    local host=$1
    if host_exists "$host"; then
        print_warning "$host already exists in hosts file"
        return 0
    fi
    
    print_status "Adding $host to hosts file..."
    echo "127.0.0.1	$host" >> "$HOSTS_FILE"
    print_success "Added $host"
}

# Remove host entry
remove_host() {
    local host=$1
    if ! host_exists "$host"; then
        print_warning "$host not found in hosts file"
        return 0
    fi
    
    print_status "Removing $host from hosts file..."
    
    # Create backup
    cp "$HOSTS_FILE" "${HOSTS_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Remove the line
    case "$OS" in
        "Darwin")
            sed -i '' "/127\.0\.0\.1[[:space:]]*$host/d" "$HOSTS_FILE"
            ;;
        "Linux"|"MINGW"*|"CYGWIN"*|"MSYS"*)
            sed -i "/127\.0\.0\.1[[:space:]]*$host/d" "$HOSTS_FILE"
            ;;
    esac
    
    print_success "Removed $host"
}

# Add all required hosts
add_all_hosts() {
    print_status "Adding all required localhost entries..."
    
    for host in "${HOSTS[@]}"; do
        add_host "$host"
    done
    
    print_success "All hosts configured successfully!"
}

# Remove all hosts
remove_all_hosts() {
    print_status "Removing all localhost entries..."
    
    for host in "${HOSTS[@]}"; do
        remove_host "$host"
    done
    
    print_success "All hosts removed successfully!"
}

# Show current status
show_status() {
    print_status "Current host file status:"
    echo ""
    
    for host in "${HOSTS[@]}"; do
        if host_exists "$host"; then
            print_success "✓ $host"
        else
            print_warning "✗ $host (missing)"
        fi
    done
    echo ""
}

# Test host resolution
test_hosts() {
    print_status "Testing host resolution..."
    echo ""
    
    for host in "${HOSTS[@]}"; do
        if nslookup "$host" >/dev/null 2>&1; then
            if nslookup "$host" | grep -q "127.0.0.1"; then
                print_success "✓ $host resolves to 127.0.0.1"
            else
                print_warning "⚠ $host resolves but not to 127.0.0.1"
            fi
        else
            print_error "✗ $host does not resolve"
        fi
    done
    echo ""
}

# Flush DNS cache
flush_dns() {
    print_status "Flushing DNS cache..."
    
    case "$OS" in
        "Darwin")
            sudo dscacheutil -flushcache
            sudo killall -HUP mDNSResponder
            ;;
        "Linux")
            if command -v systemctl >/dev/null 2>&1; then
                sudo systemctl flush-dns 2>/dev/null || true
            fi
            if command -v systemd-resolve >/dev/null 2>&1; then
                sudo systemd-resolve --flush-caches 2>/dev/null || true
            fi
            ;;
        "MINGW"*|"CYGWIN"*|"MSYS"*)
            ipconfig //flushdns
            ;;
    esac
    
    print_success "DNS cache flushed"
}

# Main function
main() {
    local action=${1:-"add"}
    
    print_banner
    
    case "$action" in
        "add")
            check_permissions
            add_all_hosts
            flush_dns
            show_status
            ;;
        "remove")
            check_permissions
            remove_all_hosts
            flush_dns
            ;;
        "status")
            show_status
            ;;
        "test")
            test_hosts
            ;;
        "flush")
            flush_dns
            ;;
        "help"|*)
            echo "Usage: $0 <command>"
            echo ""
            echo "Commands:"
            echo "  add     - Add all localhost entries (default)"
            echo "  remove  - Remove all localhost entries"
            echo "  status  - Show current status"
            echo "  test    - Test host resolution"
            echo "  flush   - Flush DNS cache"
            echo "  help    - Show this help"
            echo ""
            echo "Required hosts:"
            for host in "${HOSTS[@]}"; do
                echo "  - $host"
            done
            echo ""
            ;;
    esac
}

# Run main function
main "$@"