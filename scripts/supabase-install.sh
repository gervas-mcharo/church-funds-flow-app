#!/bin/bash

# Supabase CLI Installation Script
# This script installs the official Supabase CLI

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

print_status "Installing Supabase CLI..."

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Map architecture names
case "$ARCH" in
    x86_64) ARCH="amd64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *) 
        print_error "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

# Get latest release version
LATEST_VERSION=$(curl -s https://api.github.com/repos/supabase/cli/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_VERSION" ]; then
    print_error "Failed to get latest Supabase CLI version"
    exit 1
fi

print_status "Latest Supabase CLI version: $LATEST_VERSION"

# Download URL
DOWNLOAD_URL="https://github.com/supabase/cli/releases/download/$LATEST_VERSION/supabase_${OS}_${ARCH}.tar.gz"

# Create temp directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

print_status "Downloading Supabase CLI from $DOWNLOAD_URL"
curl -L "$DOWNLOAD_URL" -o supabase.tar.gz

print_status "Extracting Supabase CLI..."
tar -xzf supabase.tar.gz

# Install to /usr/local/bin (requires sudo) or ~/.local/bin
if [ -w "/usr/local/bin" ]; then
    INSTALL_DIR="/usr/local/bin"
    mv supabase "$INSTALL_DIR/"
    print_success "Supabase CLI installed to $INSTALL_DIR"
elif [ -d "$HOME/.local/bin" ]; then
    INSTALL_DIR="$HOME/.local/bin"
    mv supabase "$INSTALL_DIR/"
    print_success "Supabase CLI installed to $INSTALL_DIR"
    print_warning "Make sure $INSTALL_DIR is in your PATH"
else
    mkdir -p "$HOME/.local/bin"
    INSTALL_DIR="$HOME/.local/bin"
    mv supabase "$INSTALL_DIR/"
    print_success "Supabase CLI installed to $INSTALL_DIR"
    print_warning "Add $INSTALL_DIR to your PATH by adding this to your shell profile:"
    print_warning "export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

# Cleanup
cd /
rm -rf "$TEMP_DIR"

# Verify installation
if command -v supabase >/dev/null 2>&1; then
    INSTALLED_VERSION=$(supabase --version)
    print_success "Supabase CLI successfully installed: $INSTALLED_VERSION"
else
    print_error "Supabase CLI installation verification failed"
    print_error "You may need to restart your terminal or update your PATH"
    exit 1
fi

print_status "Run 'supabase --help' to get started"