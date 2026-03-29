# Security Awareness Platform - Production Dockerfile
# Multi-stage build for optimized production image

# ======================================
# Stage 1: Build Frontend
# ======================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci

# Copy client source
COPY client/ ./

# Build production bundle
RUN npm run build

# ======================================
# Stage 2: Production Server
# ======================================
FROM node:20-alpine AS production

# Install security updates
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source
COPY server/ ./

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/client/dist ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start server
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
