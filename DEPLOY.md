# Security Awareness Platform - Deployment Guide

## Quick Start (Docker)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### 1. Clone and Configure

```bash
git clone https://github.com/aiagentmackenzie-lang/security-awareness-platform.git
cd security-awareness-platform

# Copy environment file
cp server/.env.example server/.env

# Edit configuration
nano server/.env  # or vim, code, etc.
```

### 2. Deploy

```bash
# Development mode
./scripts/deploy.sh development

# Production mode (with nginx reverse proxy)
./scripts/deploy.sh production
```

### 3. Access

- **API:** http://localhost:3000
- **Web:** http://localhost (production only)
- **Health:** http://localhost:3000/api/health

## Manual Deployment

### Backend Only

```bash
# Install dependencies
npm install

# Set environment variables
export NODE_ENV=production
export PORT=3000
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=security_awareness
export DB_USER=postgres
export DB_PASSWORD=your_password
export JWT_SECRET=your_secret

# Start server
npm start
```

### Frontend Only

```bash
cd client

# Install dependencies
npm install

# Build for production
npm run build

# Serve with any static server
npx serve dist
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `security_awareness` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | `24h` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `300` |

## SSL/TLS (Production)

For production with HTTPS:

1. Obtain SSL certificates (Let's Encrypt, etc.)
2. Place in `nginx/ssl/`:
   - `cert.pem` - Certificate
   - `key.pem` - Private key
3. Deploy with production profile

```bash
./scripts/deploy.sh production
```

## Database Setup

### Initial Schema

The schema is automatically applied on first container start via `docker-entrypoint-initdb.d`.

### Manual Migration

```bash
# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

## Monitoring

### Health Checks

```bash
curl http://localhost:3000/api/health
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
```

### Metrics (optional)

Enable Prometheus metrics by setting:

```bash
export ENABLE_METRICS=true
```

## Backup and Restore

### Backup Database

```bash
docker-compose exec postgres pg_dump -U postgres security_awareness > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U postgres security_awareness < backup.sql
```

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Set strong database password
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Set up log rotation
- [ ] Enable automated backups
- [ ] Review rate limiting settings
- [ ] Disable introspection in production

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)
```

### Database Connection Failed

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify credentials in .env
cat .env | grep DB_
```

### Container Won't Start

```bash
# Rebuild without cache
docker-compose build --no-cache

# Check for errors
docker-compose logs app
```

## Support

For issues and feature requests, see the project repository.
