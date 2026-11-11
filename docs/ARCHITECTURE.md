# Marketing Automation Platform — Technical Architecture

## 1. Overview

A production-ready, multi-tenant Marketing Automation Platform for managing campaigns,
automating customer communication, managing leads, tracking engagement, and analyzing
performance from a centralized SaaS dashboard.

Repository: single GitHub monorepo containing frontend + backend + database + docs.

## 2. Technology Stack (Preferred)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | Next.js 14+ (App Router) | React SSR/SSG, SaaS dashboard UI |
| Frontend Language | TypeScript | End-to-end type safety |
| Styling | Tailwind CSS | Responsive, utility-first UI |
| UI Components | shadcn/ui + Radix UI | Accessible, professional components |
| Forms | React Hook Form + Zod | Validation (shared schemas with backend) |
| Server State | TanStack Query (React Query) | Caching, loading/error states, mutations |
| Client State | Zustand | Lightweight global state |
| Charts | Recharts | Dashboard & campaign analytics |
| Backend Framework | NestJS | Modular Node.js API, DI, guards, Swagger docs |
| Backend Language | TypeScript | Shared language across repo |
| ORM | Prisma | Type-safe queries, migrations |
| Database | PostgreSQL 15 | Relational data, JSONB for custom fields/tags |
| Cache + Job Queue | Redis 7 + BullMQ | Background jobs, rate limiting, caching |
| Auth | JWT (access + refresh) + argon2 | Stateless auth, RBAC guards |
| Email | Nodemailer + provider adapters | SendGrid / Mailgun / AWS SES / SMTP |
| API Docs | Swagger/OpenAPI (nestjs/swagger) | Auto-generated docs |
| Logging | Pino | Structured logging |
| Testing (Backend) | Jest + Supertest | Unit + API tests |
| Testing (Frontend) | Vitest + React Testing Library | Unit + component tests |
| E2E | Playwright | Critical user flows |
| CI/CD | GitHub Actions | Lint, test, build, deploy |
| Containerization | Docker + Docker Compose | Local dev parity |

## 3. Repository Structure (Single Repo)

```
marketing-automation-platform/
├── frontend/                 # Next.js app
│   ├── src/app/              # App Router routes
│   ├── src/components/       # shadcn/ui + custom
│   ├── src/lib/              # API client, utils, Zod schemas
│   ├── src/store/            # Zustand stores
│   └── src/types/            # Shared TypeScript types
├── backend/                  # NestJS API
│   ├── src/modules/          # auth, users, contacts, leads, campaigns, workflows, integrations, analytics
│   ├── src/common/           # guards, interceptors, pipes, exceptions
│   ├── prisma/schema.prisma  # Database schema + migrations
│   └── test/
├── database/                 # Seed SQL, migration backups
├── docs/                     # Architecture, API, deployment guides
├── tests/                    # E2E (Playwright)
├── scripts/                  # Dev / seed / deploy scripts
├── .github/workflows/        # CI/CD pipelines
├── .env.example
├── .gitignore
├── docker-compose.yml        # Postgres + Redis
├── Dockerfile.frontend
├── Dockerfile.backend
└── README.md
```

## 4. Database Design (Normalized, Multi-Tenant)

Core entities with tenant isolation (`organization_id` on every entity):

- `users`, `organizations`, `teams`, `roles`
- `contacts`, `contact_tags`, `contact_segments`
- `leads`
- `campaigns`, `campaign_recipients`
- `email_templates`, `email_events`
- `automation_workflows`, `workflow_nodes`, `workflow_executions`
- `integrations`, `notifications`, `audit_logs`

All tables include: `id` (UUID), `created_at`, `updated_at`, `organization_id` (FK),
appropriate indexes and foreign keys.

## 5. Automation Engine

- **Triggers:** new contact, form submission, tag added, lead status changed, campaign event
- **Actions:** send email, add tag, update contact, assign lead, wait/delay, webhook, update lead status
- **Conditions:** contact attributes, tags, lead score, campaign engagement
- **Reliability:** retries, execution logs, error handling, duplicate-event protection (idempotency keys)

## 6. Security Rules (from plan.md)

- No hardcoded tokens, API keys, or secrets — use `.env` / GitHub Secrets
- Same repository for frontend + backend
- Role-based access control (RBAC) on all APIs
- Rate limiting on auth and public endpoints
- Tenant isolation enforced via middleware/guards
- Meaningful conventional commits: `feat(scope): description`

## 7. Milestones (11 total, sequential)

1. Repository Analysis & Project Setup
2. Database & Backend Foundation
3. Authentication & User Management
4. Frontend Foundation
5. Contact & Lead Management
6. Campaign Management
7. Automation Workflow Engine
8. Integrations & Notifications
9. Analytics & Reporting
10. Testing & Quality Assurance
11. Deployment & Final Documentation

## 8. Local Development

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Copy env
cp .env.example .env
# Edit .env with your values

# 3. Backend
cd backend
npm install
npx prisma migrate dev
npm run start:dev

# 4. Frontend
cd ../frontend
npm install
npm run dev
```

Frontend: http://localhost:3000
Backend API: http://localhost:3001
API Docs: http://localhost:3001/api/docs

-- End of Architecture --