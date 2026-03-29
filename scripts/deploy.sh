#!/bin/bash
# Security Awareness Platform - Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environment: development (default) | production

set -e

ENV=${1:-development}
echo "🚀 Deploying Security Awareness Platform - Environment: $ENV"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Check environment file
if [ ! -f .env ]; then
    log_warn ".env file not found, copying from .env.example"
    cp .env.example .env
    log_warn "Please edit .env with your configuration before continuing"
    exit 1
fi

# Database directory
mkdir -p data/postgres

if [ "$ENV" == "production" ]; then
    log_info "Building production image..."
    docker-compose -f docker-compose.yml --profile production build
    
    log_info "Starting services with nginx..."
    docker-compose -f docker-compose.yml --profile production up -d
else
    log_info "Building development image..."
    docker-compose build
    
    log_info "Starting services..."
    docker-compose up -d
fi

# Wait for database
log_info "Waiting for database..."
sleep 5

# Health check
log_info "Running health checks..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        log_info "✅ Application is healthy!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        log_error "Health check failed after $MAX_RETRIES attempts"
        docker-compose logs app
        exit 1
    fi
    
    echo -n "."
    sleep 2
done

echo ""
log_info "✅ Deployment complete!"
log_info "📊 API: http://localhost:3000"

if [ "$ENV" == "production" ]; then
    log_info "🌐 Web: http://localhost (via nginx)"
fi

log_info ""
log_info "Useful commands:"
log_info "  View logs: docker-compose logs -f app"
log_info "  Stop: docker-compose down"
log_info "  Restart: docker-compose restart"
