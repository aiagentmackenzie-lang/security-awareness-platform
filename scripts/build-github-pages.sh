#!/bin/bash
# Build script for GitHub Pages deployment
# Creates static site with localStorage-based data

set -e

echo "🔨 Building Security Awareness Platform for GitHub Pages..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[BUILD]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

cd client

# Install dependencies
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install
fi

# Update vite config for GitHub Pages
log_info "Configuring for GitHub Pages..."
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
EOF

# Build
log_info "Building..."
npm run build

log_info "✅ Build complete!"
log_info "📁 Output: client/dist/"
log_info ""
log_info "To deploy to GitHub Pages:"
log_info "  1. Create repo on GitHub"
log_info "  2. Push this repo"
log_info "  3. Enable GitHub Pages (Settings > Pages)"
log_info "  4. Select 'Deploy from a branch' > 'main' > '/dist' folder"
