#!/bin/bash
# Build script for production deployment
# Builds frontend and prepares server for deployment

set -e

echo "🔨 Building Security Awareness Platform..."

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

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_warn "Node.js 18+ required. Current: $(node -v)"
    exit 1
fi

# Build frontend
log_info "Building frontend..."
cd client

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing client dependencies..."
    npm ci
fi

# Production build
npm run build

cd ..

# Prepare server
log_info "Preparing server..."
cd server

# Install production dependencies
if [ ! -d "node_modules" ]; then
    log_info "Installing server dependencies..."
    npm ci --only=production
fi

# Create public directory
mkdir -p public

# Copy built frontend
cp -r ../client/dist/* public/

cd ..

log_info "✅ Build complete!"
log_info ""
log_info "To start in production mode:"
log_info "  cd server && npm start"
log_info ""
log_info "Or use Docker:"
log_info "  ./scripts/deploy.sh production"
