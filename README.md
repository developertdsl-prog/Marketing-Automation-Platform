# Marketing Automation Platform

A complete, production-ready Marketing Automation Platform for managing marketing
campaigns, automating customer communication, managing leads, tracking customer
engagement, and analyzing marketing performance from a centralized dashboard.

## Repository

Single GitHub monorepo containing frontend + backend + database + documentation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts |
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, Redis + BullMQ, JWT auth |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Testing | Jest, Vitest, Playwright |

## Features

- **Authentication & Authorization** — JWT access/refresh tokens, RBAC, org auto-provisioning
- **Contact Management** — CRUD, tags, segmentation, import/export, activity history
- **Lead Management** — Capture, scoring, status tracking, assignment
- **Campaign Management** — CRUD, scheduling, launch/pause, email templates, performance stats
- **Automation Workflow Engine** — Visual builder, triggers, actions, conditions, BullMQ job queue, duplicate-event protection
- **Integrations** — SendGrid, Mailgun, AWS SES, SMTP, Slack (AES-256-GCM encrypted config)
- **Notifications** — In-app notifications, read/unread status, unread count
- **Analytics & Reporting** — Dashboard stats, contact growth, campaign performance, email performance, lead analytics, conversion metrics
- **Audit Logs** — Full action tracking with tenant isolation

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15 (or use docker-compose)
- Redis 7 (or use docker-compose)

### 1. Clone & Install

```bash
git clone git@github.com:developertdsl-prog/Marketing-Automation-Platform.git
cd Marketing-Automation-Platform
cp .env.example .env
# Edit .env with your own values
```

### 2. Start Infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d
```

### 3. Backend (NestJS)

```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

### 4. Frontend (Next.js)

```bash
cd ../frontend
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs (Swagger): http://localhost:3001/api/docs

## Production Deployment

See `docs/DEPLOYMENT.md` for the complete deployment guide.

### Quick Production Start

```bash
cp .env.example .env
# Edit .env with production values
docker compose -f docker-compose.prod.yml up -d
docker exec -it map_backend_prod npx prisma migrate deploy
```

## Project Structure

```
marketing-automation-platform/
├── frontend/                 # Next.js app
├── backend/                  # NestJS API
├── database/                 # Seed SQL, migration backups
├── docs/                     # Architecture, API, deployment guides
├── tests/                    # E2E (Playwright)
├── scripts/                  # Dev / seed / deploy scripts
├── .github/workflows/        # CI/CD pipelines
├── .env.example
├── .gitignore
├── docker-compose.yml        # Dev: Postgres + Redis
├── docker-compose.prod.yml   # Production: Full stack
├── Dockerfile.backend
├── Dockerfile.frontend
├── plan.md
└── README.md
```

## Development Milestones

Work is tracked in 11 sequential milestones (see `plan.md`). All 11 milestones
have been completed:

1. ✅ Repository Analysis and Project Setup
2. ✅ Database and Backend Foundation
3. ✅ Authentication and User Management
4. ✅ Frontend Foundation
5. ✅ Contact and Lead Management
6. ✅ Campaign Management
7. ✅ Automation Workflow Engine
8. ✅ Integrations and Notifications
9. ✅ Analytics and Reporting
10. ✅ Testing and Quality Assurance
11. ✅ Deployment and Final Documentation

## Testing

```bash
# Backend unit tests
cd backend
npm test

# Frontend unit tests
cd ../frontend
npm test

# E2E tests
npx playwright test
```

## Security

See `docs/SECURITY_REMEDIATION.md` for known vulnerabilities and remediation plan.

**Important:** Never commit secrets. All configuration goes in `.env` (gitignored)
or environment variables. A `.env.example` is provided with placeholder values.

## License

Private — internal use.

-- End of README --