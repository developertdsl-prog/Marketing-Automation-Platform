# Deployment Guide

This guide covers deploying the Marketing Automation Platform to production.

## Prerequisites

- Docker & Docker Compose (v2+)
- A domain name with DNS configured
- SSL/TLS certificates (Let's Encrypt recommended)
- SMTP credentials for email delivery
- A PostgreSQL-compatible database (or use the provided Docker setup)

## Architecture

```
┌─────────┐     ┌─────────┐     ┌──────────┐
│  Nginx  │────▶│ Frontend│────▶│  Backend │
│  (SSL)  │     │  Next.js│     │   NestJS │
└─────────┘     └─────────┘     └──────────┘
                                           │
                      ┌────────────┐       │
                      │  PostgreSQL│◀──────┘
                      │   Redis    │◀──────┘
                      └────────────┘
```

## Quick Start (Docker Compose)

### 1. Clone the repository

```bash
git clone git@github.com:developertdsl-prog/Marketing-Automation-Platform.git
cd Marketing-Automation-Platform
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your production values
```

Required production values:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET` — 32+ random characters (`openssl rand -base64 32`)
- `JWT_REFRESH_SECRET` — 32+ random characters
- `INTEGRATION_ENCRYPTION_KEY` — 32+ random characters
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — email provider credentials
- `NEXT_PUBLIC_API_URL` — public backend URL
- `NEXT_PUBLIC_APP_URL` — public frontend URL

### 3. Start all services

```bash
# Using production compose file
docker compose -f docker-compose.prod.yml up -d

# Or using default (development)
docker compose up -d
```

### 4. Run database migrations

```bash
docker exec -it map_backend_prod npx prisma migrate deploy
```

### 5. Verify deployment

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs
- Health check: http://localhost:3001/health

## Production Checklist

### Security

- [ ] Change all default secrets in `.env`
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure firewall rules (only expose ports 80, 443)
- [ ] Restrict database access to backend only
- [ ] Rotate integration encryption key regularly

### Database

- [ ] Run `prisma migrate deploy` on production database
- [ ] Set up automated backups
- [ ] Monitor connection pool usage
- [ ] Enable query logging for slow queries

### Email

- [ ] Configure SMTP provider (SendGrid, Mailgun, AWS SES, or custom SMTP)
- [ ] Verify sender domain (SPF, DKIM, DMARC)
- [ ] Test email delivery with a test campaign
- [ ] Configure bounce and unsubscribe handling

### Monitoring

- [ ] Set up health check monitoring (`/health` endpoint)
- [ ] Configure log aggregation
- [ ] Set up alerting for downtime
- [ ] Monitor Redis memory usage
- [ ] Monitor database connections

## Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Node environment | No | `development` |
| `PORT` | Backend port | No | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | — |
| `POSTGRES_USER` | Postgres username | No | `postgres` |
| `POSTGRES_PASSWORD` | Postgres password | No | `postgres` |
| `POSTGRES_DB` | Postgres database name | No | `marketing_automation` |
| `REDIS_URL` | Redis connection string | No | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | JWT access token secret | Yes | — |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Yes | — |
| `JWT_ACCESS_EXPIRATION` | Access token expiry | No | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiry | No | `7d` |
| `SMTP_HOST` | SMTP server host | No | — |
| `SMTP_PORT` | SMTP server port | No | `587` |
| `SMTP_USER` | SMTP username | No | — |
| `SMTP_PASS` | SMTP password | No | — |
| `SMTP_FROM` | From email address | No | `noreply@example.com` |
| `SENDGRID_API_KEY` | SendGrid API key | No* | — |
| `MAILGUN_API_KEY` | Mailgun API key | No* | — |
| `MAILGUN_DOMAIN` | Mailgun domain | No* | — |
| `AWS_SES_REGION` | AWS SES region | No* | — |
| `INTEGRATION_ENCRYPTION_KEY` | Encryption key for integration configs | Yes | — |
| `NEXT_PUBLIC_API_URL` | Public backend URL | Yes | — |
| `NEXT_PUBLIC_APP_URL` | Public frontend URL | Yes | — |

\* At least one email provider must be configured.

## Scaling

### Horizontal Scaling

- **Backend**: Run multiple backend containers behind a load balancer
- **Frontend**: Run multiple frontend containers behind a load balancer
- **Database**: Use a managed PostgreSQL service (RDS, Aurora, etc.)
- **Redis**: Use Redis Cluster or managed Redis (ElastiCache)

### Vertical Scaling

- Increase CPU/RAM for backend (campaign sending is CPU-intensive)
- Increase RAM for Redis (caching and job queue)
- Increase storage for PostgreSQL (audit logs and email events grow over time)

## Backup Strategy

### Database

```bash
# Daily backup
docker exec map_postgres_prod pg_dumpall -U postgres > backup_$(date +%F).sql
```

### Application Data

- Docker volumes (`postgres_data`, `redis_data`) should be backed up regularly
- Uploaded files (if any) should be stored on persistent storage

## Troubleshooting

### Backend won't start

```bash
docker logs map_backend_prod
# Check DATABASE_URL and JWT secrets are set
```

### Frontend won't connect to API

```bash
# Check NEXT_PUBLIC_API_URL is correct
# Verify CORS settings if using different domains
docker logs map_frontend_prod
```

### Email not sending

```bash
# Test integration
curl -X POST http://localhost:3001/api/integrations/:id/test
# Check SMTP credentials and network connectivity
```

## Support

For deployment issues, create a GitHub issue with:
- Environment details (OS, Docker version)
- Error logs (`docker logs <container>`)
- `.env` contents (with secrets redacted)

-- End of Deployment Guide --