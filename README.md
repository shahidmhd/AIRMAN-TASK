# AIRMAN — Full Stack Flight School Management System

A production-grade multi-tenant flight school platform with authentication, learning management, scheduling, audit logging, and feature flags.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Demo Credentials](#demo-credentials)
- [API Documentation](#api-documentation)
- [Key Technical Decisions](#key-technical-decisions)
- [Database Schema](#database-schema)
- [Running Tests](#running-tests)

---

## Architecture

```
airman/
├── apps/
│   ├── backend/                  # Node.js + Express API
│   │   ├── src/
│   │   │   ├── config/           # DB, env, Redis, Swagger
│   │   │   ├── middleware/       # auth, RBAC, tenant, rate-limit
│   │   │   └── modules/
│   │   │       ├── auth/         # JWT login, register, refresh
│   │   │       ├── users/        # Admin user management
│   │   │       ├── courses/      # Courses, modules, lessons
│   │   │       ├── quizzes/      # MCQ quizzes and attempts
│   │   │       ├── scheduling/   # Availability, bookings, calendar
│   │   │       ├── audit/        # Audit logs (aviation-grade)
│   │   │       ├── features/     # Role-based feature flags
│   │   │       └── jobs/         # BullMQ background jobs
│   │   ├── prisma/               # Schema + migrations + seed
│   │   └── tests/                # Unit + integration tests
│   └── frontend/                 # Next.js 14 App Router
│       ├── app/
│       │   ├── (auth)/           # Login page
│       │   └── (dashboard)/      # Admin, Instructor, Student pages
│       ├── components/
│       │   ├── layout/           # Sidebar, Header, DashboardLayout
│       │   └── ui/               # Button, Card, Badge, Input, Alert
│       └── store/                # Zustand auth store
├── docker-compose.yml
├── .github/workflows/ci.yml
├── README.md
├── PLAN.md
├── CUTS.md
└── POSTMORTEM.md
```

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Browser / Client                   │
│              Next.js 14 (Port 3000)                  │
│   Auth Store (Zustand) │ Axios API Client            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP + x-tenant-id header
┌──────────────────────▼──────────────────────────────┐
│              Express API (Port 4000)                 │
│  ┌─────────────────────────────────────────────┐    │
│  │  Middleware Stack                           │    │
│  │  Rate Limit → Tenant → Auth → RBAC → Route │    │
│  └─────────────────────────────────────────────┘    │
│  Modules: auth │ users │ courses │ scheduling │      │
│           quizzes │ audit │ features │ jobs          │
└──────────┬─────────────────────┬────────────────────┘
           │                     │
┌──────────▼──────┐   ┌──────────▼──────────┐
│  PostgreSQL     │   │  Redis (Cache + BullMQ) │
│  (Port 5432)    │   │  (Port 6379)            │
│  Prisma ORM     │   │  TTL: 300s              │
└─────────────────┘   └─────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL 15 |
| Cache / Queue | Redis, BullMQ |
| Auth | JWT (access 15m, refresh 7d), bcrypt |
| Validation | Zod |
| Frontend | Next.js 14, Tailwind CSS, Zustand |
| API Docs | Swagger / OpenAPI |
| DevOps | Docker Compose, GitHub Actions |
| Testing | Jest, Supertest |

---

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/airman.git
cd airman
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Backend API** on port 4000 (with auto-migration + seed)
- **Frontend** on port 3000

### 3. Open in Browser

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:4000/api/docs |
| Health Check | http://localhost:4000/health |

### 4. Local Development (without Docker)

```bash
# Backend
cd apps/backend
cp .env.example .env           # fill in values
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev                    # starts on port 4000

# Frontend (new terminal)
cd apps/frontend
cp .env.example .env.local
npm install
npm run dev                    # starts on port 3000
```

---

## Environment Variables

### Backend (`apps/backend/.env`)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/airman_dev"
JWT_ACCESS_SECRET="your-access-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6379"
PORT=4000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
ESCALATION_HOURS=2
```

### Frontend (`apps/frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

---

## Demo Credentials

### Tenant 1 — Skyways Aviation (`x-tenant-id: skyways-aviation`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@skyways.com | Password123! |
| Instructor | instructor@skyways.com | Password123! |
| Student | student@skyways.com | Password123! |

### Tenant 2 — Eagle Flight School (`x-tenant-id: eagle-flight-school`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@eagle.com | Password123! |

> **Note:** The login page has a tenant selector dropdown. Select the tenant before logging in — the frontend automatically sends the `x-tenant-id` header.

---

## API Documentation

Full interactive documentation available at: **http://localhost:4000/api/docs**

### Authentication

All protected routes require:
```
Authorization: Bearer <access_token>
x-tenant-id: <tenant-slug>
```

### Core Endpoints

#### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register student/instructor | Public |
| POST | `/api/auth/login` | Login, get JWT tokens | Public |
| POST | `/api/auth/refresh` | Rotate refresh token | Public |
| POST | `/api/auth/logout` | Invalidate refresh token | Public |
| GET | `/api/auth/me` | Get current user | Required |

#### Users (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users (paginated) |
| POST | `/api/users/instructors` | Create instructor |
| PATCH | `/api/users/:id/approve` | Approve student/instructor |

#### Courses
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| GET | `/api/courses?page=1&limit=10&search=` | List courses | All |
| POST | `/api/courses` | Create course | Instructor, Admin |
| GET | `/api/courses/:id` | Get course with modules | All |
| POST | `/api/courses/:id/modules` | Add module | Instructor, Admin |
| POST | `/api/courses/modules/:id/lessons` | Add lesson | Instructor, Admin |

#### Quizzes
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| POST | `/api/quizzes/lessons/:id/quiz` | Create quiz | Instructor |
| GET | `/api/quizzes/:id` | Get quiz (answers hidden for students) | All |
| POST | `/api/quizzes/:id/attempt` | Submit attempt | Student |
| GET | `/api/quizzes/:id/attempts` | View attempts | All |

#### Scheduling
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| POST | `/api/scheduling/availability` | Set availability slot | Instructor |
| GET | `/api/scheduling/availability` | List availability | All |
| POST | `/api/scheduling/bookings` | Request booking | Student |
| GET | `/api/scheduling/bookings` | List bookings (role-filtered) | All |
| PATCH | `/api/scheduling/bookings/:id/status` | Update status | Role-based |
| GET | `/api/scheduling/schedule/weekly` | Weekly calendar | All |

#### Audit Logs (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/audit?page=1&action=LOGIN` | Paginated audit logs with filters |

#### Feature Flags (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/features` | List feature flags |
| PATCH | `/api/features/:id/toggle` | Enable/disable flag |

### Sample Requests

**Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: skyways-aviation" \
  -d '{"email":"admin@skyways.com","password":"Password123!"}'
```

**Create a booking (Student):**
```bash
curl -X POST http://localhost:4000/api/scheduling/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "x-tenant-id: skyways-aviation" \
  -d '{
    "instructorId": "<instructor-uuid>",
    "date": "2026-03-15",
    "startTime": "09:00",
    "endTime": "11:00",
    "notes": "First solo prep lesson"
  }'
```

**Attempt a quiz (Student):**
```bash
curl -X POST http://localhost:4000/api/quizzes/<quiz-id>/attempt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "x-tenant-id: skyways-aviation" \
  -d '{"answers": {"<question-id>": "Visual Flight Rules"}}'
```

---

## Key Technical Decisions

### 1. Multi-Tenancy: Shared DB + tenant_id

**Decision:** Shared database with `tenantId` on every row via Prisma middleware.

**Why:** Simpler operations, single migration path, easier backups. For a startup-phase product with <50 tenants, the shared DB approach gives the best balance of simplicity and isolation. The `tenantMiddleware` extracts tenant from the `x-tenant-id` header and injects it automatically into every Prisma query.

**Tradeoff:** A noisy-neighbour tenant could impact DB performance. At scale, a separate-schema approach would be better.

### 2. JWT with Refresh Token Rotation

**Decision:** Short-lived access tokens (15m) + rotating refresh tokens stored in DB.

**Why:** Access tokens expire quickly, limiting damage from token theft. Refresh token rotation means each refresh token can only be used once — reuse detection is built in.

### 3. Redis for Caching + BullMQ for Jobs

**Decision:** Same Redis instance for both cache TTL and BullMQ job queue.

**Why:** Reduces infrastructure complexity for this scale. Cache applied to read-heavy endpoints (course list, feature flags, audit logs) with 5-minute TTL. BullMQ handles escalation jobs when bookings aren't assigned within the configured window.

### 4. Audit Logging via Prisma Middleware

**Decision:** Centralised audit log writer called from service layer, not Prisma middleware.

**Why:** Service layer has access to before/after state and correlation ID from the request. Prisma middleware would only see the after state. Every critical action (login, booking status change, role change, feature flag toggle) writes a structured audit entry with `user_id`, `tenant_id`, `action`, `before`, `after`, `correlationId`, and `timestamp`.

### 5. Feature Flags as Bonus

**Decision:** Implemented role-based feature flags as the Level 2 bonus.

**Why:** Directly useful for a real multi-tenant SaaS product and straightforward to implement cleanly on top of the existing tenant + RBAC infrastructure.

---

## Database Schema

### Key Models

```
Tenant → User (many)
User → RefreshToken (many)
User → Booking (as student or instructor)
Tenant → Course → Module → Lesson → Quiz → Question
Quiz → QuizAttempt (User)
Tenant → AuditLog
Tenant → FeatureFlag
Tenant → Booking
```

### DB Indexes (documented)

| Table | Index | Reason |
|---|---|---|
| users | `(email, tenantId)` | Unique login lookup per tenant |
| bookings | `(instructorId, date, status)` | Conflict detection query |
| bookings | `(tenantId, status)` | Admin filtered list |
| audit_logs | `(tenantId, createdAt DESC)` | Paginated log retrieval |
| courses | `(tenantId, title)` | Search by title per tenant |
| refresh_tokens | `(token)` | Token lookup on refresh |

---

## Running Tests

```bash
cd apps/backend

# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Coverage

- **Unit tests:** auth service (register, login, hashing, token), booking conflict detection (5 cases)
- **Integration tests:** tenant isolation (4 cases), full booking workflow, auth flow with real DB
- **Total:** 24 tests, all passing

```
PASS  tests/unit/auth.service.test.js        (4 tests)
PASS  tests/unit/scheduling.service.test.js  (5 tests)
PASS  tests/integration/tenant.test.js       (4 tests)
PASS  tests/integration/booking.test.js      (11 tests)
```

---

## CI/CD

GitHub Actions runs on every push to `main` and every pull request:

1. **Backend:** lint → unit tests → integration tests (with Postgres container) → build
2. **Frontend:** lint → build
3. **Quality gate:** Fails if test coverage drops below 60%

See `.github/workflows/ci.yml` for full pipeline definition.