# Marketing Automation Platform

A complete, production-ready Marketing Automation Platform for managing marketing
campaigns, automating customer communication, managing leads, tracking customer
engagement, and analyzing marketing performance from a centralized dashboard.

## Repository

Single GitHub monorepo containing frontend + backend + database + documentation.

## Tech Stack

- **Frontend:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts
- **Backend:** NestJS, TypeScript, Prisma, PostgreSQL, Redis + BullMQ, JWT auth
- **DevOps:** Docker, Docker Compose, GitHub Actions

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

### 2. Start Infrastructure

```bash
docker-compose up -d
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

## Project Structure

See `docs/ARCHITECTURE.md` for the full technical architecture and folder layout.

## Development Milestones

Work is tracked in 11 sequential milestones (see `plan.md`). Progress is reported
after each milestone in the repository.

## License

Private — internal use.

-- End of README --