# AIRMAN — Aviation Learning & Scheduling Platform

A production-minded full-stack application for aviation training management.

## Architecture
```
airman/
├── apps/
│   ├── backend/     # Node.js + Express + Prisma
│   └── frontend/    # Next.js 15 + Tailwind CSS
├── docker-compose.yml
└── .github/workflows/ci.yml
```
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│  Express    │────▶│  PostgreSQL  │
│  Frontend   │     │  REST API   │     │  (Prisma)   │
│  :3000      │     │  :4000      │     │  :5432      │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Quick Start
```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/airman.git
cd airman

# Run entire stack
docker compose up --build

# Open browser
# Frontend: http://localhost:3000
# API Docs:  http://localhost:4000/api/docs
```

## Manual Setup
```bash
# Backend
cd apps/backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev

# Frontend (new terminal)
cd apps/frontend
cp .env.example .env.local
npm install
npm run dev
```

## Demo Credentials

| Role       | Email                      | Password     |
|------------|---------------------------|--------------|
| Admin      | admin@airman.com           | Password123! |
| Instructor | instructor@airman.com      | Password123! |
| Student    | student@airman.com         | Password123! |

## API Documentation

Swagger UI: `http://localhost:4000/api/docs`

### Key Endpoints
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login
POST   /api/auth/refresh           Refresh token
GET    /api/auth/me                Current user

GET    /api/users                  List users (Admin)
POST   /api/users/instructors      Create instructor (Admin)
PATCH  /api/users/:id/approve      Approve user (Admin)

GET    /api/courses                List courses
POST   /api/courses                Create course (Instructor)
GET    /api/courses/:id            Get course with modules/lessons
POST   /api/courses/:id/modules    Add module (Instructor)
POST   /api/courses/modules/:id/lessons   Add lesson (Instructor)

POST   /api/quizzes/lessons/:id/quiz      Create quiz (Instructor)
POST   /api/quizzes/:id/attempt           Submit attempt (Student)

POST   /api/scheduling/availability       Set availability (Instructor)
GET    /api/scheduling/availability       Get availability
POST   /api/scheduling/bookings           Request booking (Student)
PATCH  /api/scheduling/bookings/:id/status  Update status
GET    /api/scheduling/schedule/weekly    Weekly calendar
```

### Sample Requests
```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@airman.com","password":"Password123!"}'

# Create course (Instructor token required)
curl -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Private Pilot Ground School","description":"PPL preparation course"}'

# Book session (Student token required)
curl -X POST http://localhost:4000/api/scheduling/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"instructorId":"INSTRUCTOR_ID","date":"2026-03-01","startTime":"09:00","endTime":"10:00"}'
```

## Tech Stack

| Layer     | Technology              |
|-----------|------------------------|
| Frontend  | Next.js 15, Tailwind CSS, Zustand |
| Backend   | Node.js, Express 5, Prisma ORM |
| Database  | PostgreSQL 15 |
| Auth      | JWT (access + refresh tokens), bcrypt |
| Validation| Zod |
| Testing   | Jest, Supertest |
| CI/CD     | GitHub Actions |
| Docs      | Swagger UI |

## Key Technical Decisions

1. **JWT with refresh token rotation** — Stateless auth with security via token rotation
2. **Prisma ORM** — Type-safe DB access with migration support
3. **RBAC at middleware level** — Every protected route checks role before reaching controller
4. **Conflict detection via DB query** — Uses time overlap logic at DB level, not application level
5. **Monorepo without Nx** — Simple folder structure to reduce setup overhead in 72hr window

## Running Tests
```bash
cd apps/backend
npm test                  # all tests
npm run test:unit         # unit tests only
npm run test:integration  # integration tests only
npm run test:coverage     # with coverage report
```