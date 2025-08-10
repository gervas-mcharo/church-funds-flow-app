#!/bin/bash

# Final setup and verification script
# Run this after implementing all changes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/common.sh"

print_banner() {
    echo ""
    echo "============================================="
    echo "  Church Management System v3.0 - Final Setup"
    echo "============================================="
    echo ""
}

# Make all scripts executable
make_scripts_executable() {
    print_status "Making all scripts executable..."
    
    local scripts=(
        "scripts/supabase-install.sh"
        "scripts/supabase-local.sh"
        "scripts/supabase-migrate.sh"
        "scripts/init-system-v3.sh"
        "scripts/setup-hosts.sh"
        "scripts/test-workflow.sh"
        "scripts/final-setup.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$PROJECT_ROOT/$script" ]; then
            chmod +x "$PROJECT_ROOT/$script"
            print_success "✓ Made $script executable"
        else
            print_warning "⚠ $script not found"
        fi
    done
}

# Verify all files are in place
verify_files() {
    print_status "Verifying enhanced system files..."
    
    local required_files=(
        "scripts/supabase-install.sh"
        "scripts/supabase-local.sh"
        "scripts/supabase-migrate.sh"
        "scripts/init-system-v3.sh"
        "scripts/setup-hosts.sh"
        "scripts/test-workflow.sh"
        "docker-compose.supabase.yml"
        "traefik/traefik.supabase.yml"
        "traefik/dynamic.supabase.yml"
        "docs/README.md"
        "docs/HOST_SETUP.md"
        ".env.example"
        "supabase/config.toml"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            print_success "✓ $file"
        else
            print_error "✗ $file (missing)"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_success "All required files are present"
        return 0
    else
        print_error "${#missing_files[@]} files are missing"
        return 1
    fi
}

# Show next steps
show_next_steps() {
    echo ""
    print_success "🎉 Enhanced Church Management System v3.0 is ready!"
    echo ""
    echo "📋 Quick Start Guide:"
    echo ""
    echo "1. 🔧 Initialize the system:"
    echo "   ./scripts/init-system-v3.sh enhanced"
    echo ""
    echo "2. 🌐 Setup host resolution (requires sudo):"
    echo "   sudo ./scripts/setup-hosts.sh"
    echo ""
    echo "3. 🚀 Start services:"
    echo "   ./scripts/supabase-local.sh start"
    echo ""
    echo "4. 🗄️ Apply database schema:"
    echo "   ./scripts/supabase-migrate.sh apply"
    echo ""
    echo "5. ✅ Test the complete workflow:"
    echo "   ./scripts/test-workflow.sh"
    echo ""
    echo "🌟 Key Features:"
    echo "• Official Supabase CLI integration"
    echo "• Host-based routing (*.localhost)"
    echo "• Enhanced security and CORS"
    echo "• Automatic JWT management"
    echo "• Comprehensive documentation"
    echo ""
    echo "📚 Documentation:"
    echo "• Setup Guide: docs/README.md"
    echo "• Host Config: docs/HOST_SETUP.md"
    echo ""
    echo "🔗 Service URLs (when running):"
    echo "• Frontend:  http://localhost:3000"
    echo "• Studio:    http://studio.localhost"
    echo "• API:       http://api.localhost"
    echo "• Traefik:   http://traefik.localhost"
    echo ""
}

# Show upgrade information
show_upgrade_info() {
    echo ""
    echo "🔄 Upgrading from Legacy System:"
    echo ""
    echo "If you have an existing setup:"
    echo ""
    echo "1. 💾 Backup your data:"
    echo "   ./scripts/supabase-migrate.sh backup"
    echo ""
    echo "2. 🔄 Convert legacy setup:"
    echo "   ./scripts/supabase-migrate.sh convert"
    echo ""
    echo "3. 🏃 Run enhanced mode:"
    echo "   ./scripts/init-system-v3.sh enhanced"
    echo ""
    echo "4. 📥 Import your data:"
    echo "   ./scripts/supabase-migrate.sh restore backup_file.sql"
    echo ""
}

# Main setup function
main() {
    print_banner
    
    cd "$PROJECT_ROOT"
    
    # Make scripts executable
    make_scripts_executable
    echo ""
    
    # Verify files
    verify_files
    echo ""
    
    # Show completion information
    show_next_steps
    show_upgrade_info
    
    print_status "Setup completed successfully! 🚀"
    echo ""
}

# Run main function
main "$@"