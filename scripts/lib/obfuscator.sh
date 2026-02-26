#!/bin/bash
# CloutScape Obfuscation Module
# Developed by your Personal CloutScape Agent

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

install_obfuscator() {
    if ! pnpm list -g javascript-obfuscator >/dev/null 2>&1; then
        info "Installing javascript-obfuscator globally..."
        sudo pnpm add -g javascript-obfuscator >> "$LOG_FILE" 2>&1
    fi
}

obfuscate_build() {
    local dist_dir="${1:-dist}"
    info "Starting sophisticated code obfuscation on $dist_dir..."
    
    install_obfuscator
    
    if [ -d "$dist_dir" ]; then
        # Obfuscate all JS files in the dist directory
        find "$dist_dir" -name "*.js" -exec javascript-obfuscator {} --output {} \
            --compact true \
            --control-flow-flattening true \
            --dead-code-injection true \
            --string-array true \
            --rotate-string-array true \
            --shuffle-string-array true \
            --string-array-threshold 0.75 \
            --unicode-escape-sequence true >> "$LOG_FILE" 2>&1
        
        check_status $? "Obfuscation failed"
        success "Build obfuscation complete."
    else
        error "Dist directory $dist_dir not found. Build the project first."
        return 1
    fi
}
