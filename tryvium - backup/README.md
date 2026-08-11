# Tryvium - Experience Orchestration Platform

A B2B SaaS web application for orchestrating autonomous AI agents, human expertise, and enterprise systems.

## Architecture

This is a Turborepo monorepo with the following structure:

```
tryvium/
├── apps/
│   ├── marketing/     # Public marketing site (Next.js 14+, App Router)
│   └── app/           # Authenticated product dashboard (Next.js 14+, App Router)
├── packages/
│   ├── ui/            # Shared React component library
│   ├── db/            # Prisma schema and database client
│   └── config/        # Shared ESLint, TypeScript, and Tailwind config
├── docker-compose.yml
├── Dockerfile.marketing
├── Dockerfile.app
└── nginx.conf
```

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth v5 (Credentials + Google OAuth)
- **Billing**: Stripe
- **Background Jobs**: BullMQ + Redis
- **Deployment**: Docker Compose (self-hosted VPS)

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (for deployment)
- PostgreSQL (for local dev)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Set up the database

```bash
cd packages/db
npx prisma generate
npx prisma db push
npx prisma db seed
cd ../..
```

### 4. Run development servers

```bash
pnpm dev
```

This starts:
- Marketing site at http://localhost:3000
- App dashboard at http://localhost:3001

### 5. Build for production

```bash
pnpm build
```

## Docker Deployment

```bash
docker-compose up -d --build
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Marketing site on port 3000
- App dashboard on port 3001
- Nginx on port 80

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | NextAuth secret | Yes |
| `AUTH_URL` | Auth callback URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | For Google login |
| `STRIPE_SECRET_KEY` | Stripe secret key | For billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | For billing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | For billing |

## Project Structure (MVC Pattern)

- **Models**: Prisma schema in `packages/db/prisma/schema.prisma`
- **Views**: React components in `apps/marketing/src/app/` and `apps/app/src/app/`
- **Controllers**: API routes and Server Actions in respective apps
- **Services**: Shared business logic in `packages/`

## Pages

The marketing site includes all pages from the tryvium.ai sitemap:

### Main Pages
- Home (`/`)
- Platform (`/platform/experience-orchestration-platform`)
- Why Tryvium (`/why-tryvium`)
- About Us (`/about-us`)
- Contact (`/contact-us`)
- Resources (`/resources`)
- Careers (`/careers`)

### Solutions
- Tryvium for AWS (`/solution/tryvium-for-aws`)
- Tryvium for Azure (`/solution/tryvium-for-azure`)
- Tryvium for GCP (`/solution/tryvium-for-gcp`)

### Services
- Contact Center (`/services/contact-center`)
- Contact Center Modernization (`/services/contact-center-modernization`)
- Workforce Management (`/services/workforce-management`)

### Blog
- Blog Index (`/blog`)
- 4 individual blog posts

### Case Studies
- Case Studies Index (`/case-study`)
- 3 individual case studies

### Utility
- Free Trial (`/free-trial`)
- Schedule a Demo (`/schedule-a-demo`)
- Thank You (`/thank-you`)
- Privacy Policy (`/privacy-policy`)
- Cookie Policy (`/cookie-policy`)
- Disclaimer (`/disclaimer`)
