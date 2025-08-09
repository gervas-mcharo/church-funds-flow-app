#!/bin/bash

# JWT Token Management System for Supabase Local Stack
# Generates and manages JWT secrets, anon keys, and service role keys

set -e

# Source common functions
SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/common.sh"

PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default JWT configuration
DEFAULT_ISSUER="supabase"
DEFAULT_AUDIENCE="authenticated"
DEFAULT_EXPIRY=3600
DEFAULT_ALGORITHM="HS256"

generate_jwt_secret() {
    print_status "Generating JWT secret..."
    openssl rand -base64 32 | tr -d '\n'
}

generate_jwt_token() {
    local secret="$1"
    local role="$2"
    local aud="${3:-$DEFAULT_AUDIENCE}"
    local exp="${4:-$DEFAULT_EXPIRY}"
    local iss="${5:-$DEFAULT_ISSUER}"
    
    # Calculate expiry timestamp (current time + expiry seconds)
    local exp_timestamp=$(($(date +%s) + exp))
    local iat_timestamp=$(date +%s)
    
    # Create JWT header
    local header='{"alg":"HS256","typ":"JWT"}'
    local header_b64=$(echo -n "$header" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    
    # Create JWT payload
    local payload="{\"iss\":\"$iss\",\"ref\":\"local\",\"role\":\"$role\",\"iat\":$iat_timestamp,\"exp\":$exp_timestamp,\"aud\":\"$aud\"}"
    local payload_b64=$(echo -n "$payload" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    
    # Create signature
    local unsigned_token="$header_b64.$payload_b64"
    local signature=$(echo -n "$unsigned_token" | openssl dgst -sha256 -hmac "$secret" -binary | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    
    echo "$unsigned_token.$signature"
}

update_env_file() {
    local env_file="$PROJECT_ROOT/.env"
    local key="$1"
    local value="$2"
    
    # Escape special characters for sed
    local escaped_value=$(printf '%s\n' "$value" | sed 's/[[\.*^$()+?{|]/\\&/g')
    
    if grep -q "^$key=" "$env_file"; then
        # Update existing key - use awk for more reliable handling
        awk -v key="$key" -v value="$value" '
            BEGIN { found = 0 }
            /^[[:space:]]*#/ { print; next }
            $0 ~ "^" key "=" { print key "=" value; found = 1; next }
            { print }
            END { if (!found) print key "=" value }
        ' "$env_file" > "$env_file.tmp" && mv "$env_file.tmp" "$env_file"
    else
        # Add new key
        echo "$key=$value" >> "$env_file"
    fi
}

generate_all_tokens() {
    print_status "Generating complete JWT token set..."
    
    local env_file="$PROJECT_ROOT/.env"
    
    # Ensure .env file exists
    if [ ! -f "$env_file" ]; then
        print_error ".env file not found"
        exit 1
    fi
    
    # Generate master JWT secret
    local jwt_secret=$(generate_jwt_secret)
    print_success "Generated JWT secret"
    
    # Generate anon key (public access)
    local anon_key=$(generate_jwt_token "$jwt_secret" "anon" "authenticated" 86400)
    print_success "Generated anon key"
    
    # Generate service role key (full access)
    local service_key=$(generate_jwt_token "$jwt_secret" "service_role" "authenticated" 86400)
    print_success "Generated service role key"
    
    # Update .env file
    update_env_file "JWT_SECRET" "$jwt_secret"
    update_env_file "SUPABASE_LOCAL_ANON_KEY" "$anon_key"
    update_env_file "SUPABASE_LOCAL_SERVICE_KEY" "$service_key"
    
    # Also update legacy variables for backward compatibility
    update_env_file "SUPABASE_ANON_KEY" "$anon_key"
    update_env_file "SUPABASE_SERVICE_KEY" "$service_key"
    
    print_success "JWT tokens generated and saved to .env file"
    
    echo ""
    print_status "Token Summary:"
    echo "  JWT Secret: [HIDDEN - 32 chars]"
    echo "  Anon Key: ${anon_key:0:20}..."
    echo "  Service Key: ${service_key:0:20}..."
    echo ""
    print_warning "These tokens are critical for security. Keep them safe!"
}

validate_tokens() {
    print_status "Validating JWT tokens..."
    
    # Load current environment
    source "$PROJECT_ROOT/.env" 2>/dev/null || true
    
    local issues=0
    
    # Check JWT secret
    if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
        print_error "JWT_SECRET is missing or too short"
        issues=$((issues + 1))
    fi
    
    # Check anon key
    if [ -z "$SUPABASE_LOCAL_ANON_KEY" ]; then
        print_error "SUPABASE_LOCAL_ANON_KEY is missing"
        issues=$((issues + 1))
    fi
    
    # Check service key
    if [ -z "$SUPABASE_LOCAL_SERVICE_KEY" ]; then
        print_error "SUPABASE_LOCAL_SERVICE_KEY is missing"
        issues=$((issues + 1))
    fi
    
    if [ $issues -eq 0 ]; then
        print_success "All JWT tokens are properly configured"
        return 0
    else
        print_error "Found $issues JWT configuration issues"
        return 1
    fi
}

rotate_tokens() {
    print_warning "Rotating JWT tokens will invalidate all existing sessions!"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " confirm
    
    if [[ "$confirm" =~ ^[Yy] ]]; then
        generate_all_tokens
        print_warning "Token rotation complete. Restart all services to apply changes."
    else
        print_status "Token rotation cancelled"
    fi
}

show_tokens() {
    print_status "Current JWT Configuration:"
    
    # Load current environment
    source "$PROJECT_ROOT/.env" 2>/dev/null || true
    
    echo ""
    echo "JWT Secret: ${JWT_SECRET:+[SET - ${#JWT_SECRET} chars]} ${JWT_SECRET:-[NOT SET]}"
    echo "Anon Key: ${SUPABASE_LOCAL_ANON_KEY:+${SUPABASE_LOCAL_ANON_KEY:0:30}...} ${SUPABASE_LOCAL_ANON_KEY:-[NOT SET]}"
    echo "Service Key: ${SUPABASE_LOCAL_SERVICE_KEY:+${SUPABASE_LOCAL_SERVICE_KEY:0:30}...} ${SUPABASE_LOCAL_SERVICE_KEY:-[NOT SET]}"
    echo ""
}

print_usage() {
    echo "JWT Token Management System"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  generate     Generate new JWT secret and tokens"
    echo "  validate     Validate current JWT configuration"
    echo "  rotate       Rotate all JWT tokens (invalidates sessions)"
    echo "  show         Show current token configuration"
    echo "  help         Show this help message"
    echo ""
}

# Main execution
case "${1:-help}" in
    "generate")
        generate_all_tokens
        ;;
    "validate")
        validate_tokens
        ;;
    "rotate")
        rotate_tokens
        ;;
    "show")
        show_tokens
        ;;
    "help"|*)
        print_usage
        ;;
esac