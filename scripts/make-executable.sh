#!/bin/bash

# Make all scripts executable
chmod +x scripts/*.sh

# Test script execution
echo "Testing script permissions..."

# Test each script
scripts=(
    "scripts/supabase-install.sh"
    "scripts/supabase-local.sh" 
    "scripts/supabase-migrate.sh"
    "scripts/init-system-v3.sh"
)

for script in "${scripts[@]}"; do
    if [ -x "$script" ]; then
        echo "✓ $script is executable"
    else
        echo "✗ $script is not executable"
        chmod +x "$script"
        echo "  → Fixed permissions for $script"
    fi
done

echo "All scripts are now executable!"