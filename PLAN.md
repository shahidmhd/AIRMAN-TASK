# PLAN.md — AIRMAN 72-Hour Assessment

## Schedule Breakdown

### Phase 1 — Foundation (Hours 0–8)

**Goal:** Monorepo scaffolded, DB schema designed, Docker baseline working.

| Time | Task | Status |
|---|---|---|
| 0–2h | Create folder structure, init git, setup backend (Express + Prisma) | ✅ Done |
| 2–4h | Design Prisma schema (Users, Courses, Bookings, Quizzes) | ✅ Done |
| 4–6h | Docker Compose (postgres + backend + frontend) | ✅ Done |
| 6–8h | GitHub Actions CI pipeline (lint, test, build) | ✅ Done |

**Key decisions made here:** Monorepo without Nx (too much overhead for 72h), shared DB multi-tenancy approach documented, PostgreSQL as required.

---

### Phase 2 — Auth + RBAC (Hours 8–18)

**Goal:** Working login/register, JWT tokens, RBAC middleware, seed data.

| Time | Task | Status |
|---|---|---|
| 8–11h | Auth service (register, login, refresh, logout) with bcrypt + JWT | ✅ Done |
| 11–13h | RBAC middleware (requireRole, requireAdmin, requireInstructor) | ✅ Done |
| 13–15h | Users module (admin creates instructors, approves students) | ✅ Done |
| 15–17h | Auth unit tests (register, login, hashing, approval) | ✅ Done |
| 17–18h | Seed script with demo credentials for all roles | ✅ Done |

**Commits:** `feat(auth): implement register/login with bcrypt + JWT` → `feat(auth): add RBAC middleware` → `test(auth): unit tests for auth service`

---

### Phase 3 — Learning Module (Hours 18–32)

**Goal:** Course → Module → Lesson hierarchy, MCQ quizzes, quiz scoring.

| Time | Task | Status |
|---|---|---|
| 18–22h | Courses CRUD (create, list with pagination + search, get by ID) | ✅ Done |
| 22–25h | Modules and Lessons CRUD (route ordering fix for Express) | ✅ Done |
| 25–28h | Quiz creation (MCQ) + attempt submission + scoring logic | ✅ Done |
| 28–30h | Frontend: Instructor course management pages | ✅ Done |
| 30–32h | Frontend: Student course browsing + quiz attempt UI | ✅ Done |

**Commits:** `feat(courses): CRUD with pagination + search` → `feat(quizzes): MCQ creation and scoring` → `feat(frontend/instructor): course + quiz management`

---

### Phase 4 — Scheduling Module (Hours 32–46)

**Goal:** Instructor availability, student bookings, conflict detection, admin approval, weekly calendar.

| Time | Task | Status |
|---|---|---|
| 32–36h | Scheduling service: availability CRUD + conflict detection logic | ✅ Done |
| 36–39h | Booking workflow (create, status transitions, role-based filters) | ✅ Done |
| 39–41h | Weekly calendar endpoint (grouped by date) | ✅ Done |
| 41–43h | Unit tests for conflict detection (5 test cases) | ✅ Done |
| 43–46h | Frontend: Instructor schedule, student booking, admin approval, calendar | ✅ Done |

**Commits:** `feat(scheduling): conflict detection + booking workflow` → `test(scheduling): unit tests` → `feat(frontend): full scheduling UI`

---

### Phase 5 — Level 2: Multi-Tenancy (Hours 46–54)

**Goal:** Two flight school tenants, all queries scoped, cross-tenant access blocked.

| Time | Task | Status |
|---|---|---|
| 46–49h | Add Tenant model to schema, tenantId on all rows, seed 2 tenants | ✅ Done |
| 49–51h | tenantMiddleware: extract tenant from x-tenant-id header | ✅ Done |
| 51–53h | Prisma middleware: auto-inject tenantId into all queries | ✅ Done |
| 53–54h | Integration tests: tenant isolation (4 test cases) | ✅ Done |

---

### Phase 6 — Level 2: Audit Logs + Jobs + Cache (Hours 54–64)

**Goal:** Aviation-grade audit logging, BullMQ escalation jobs, Redis caching.

| Time | Task | Status |
|---|---|---|
| 54–57h | Audit log model + service + admin endpoint with filters | ✅ Done |
| 57–59h | BullMQ worker: escalate unassigned bookings after N hours | ✅ Done |
| 59–61h | Redis caching on courses, features, audit log list | ✅ Done |
| 61–63h | Rate limiting (auth: 20/15min, bookings: 30/15min) | ✅ Done |
| 63–64h | Feature flags bonus (per-tenant enable/disable) | ✅ Done |

---

### Phase 7 — Frontend Integration + Bug Fixes (Hours 64–70)

**Goal:** Fully working end-to-end flows for all roles.

| Time | Task | Status |
|---|---|---|
| 64–66h | Admin dashboard pages (users, bookings, audit, feature flags) | ✅ Done |
| 66–68h | Login page with tenant selector, auth store, proxy middleware | ✅ Done |
| 68–70h | Bug fixing: double sidebar, API response shapes, route guards | ✅ Done |

---

### Phase 8 — Documentation + Final Polish (Hours 70–72)

| Time | Task | Status |
|---|---|---|
| 70–71h | README.md, PLAN.md, CUTS.md, POSTMORTEM.md | ✅ Done |
| 71–72h | Final test run, commit history cleanup, demo video | ✅ Done |

---

## What Was Shipped

### Level 1 ✅
- Auth + RBAC (3 roles, bcrypt, JWT rotation)
- Learning: Course → Module → Lesson → Quiz (MCQ), attempts, scoring
- Scheduling: availability, bookings, conflict detection, weekly calendar
- Docker Compose (one command startup)
- GitHub Actions CI
- 20+ tests (unit + integration)
- Full frontend (admin, instructor, student dashboards)

### Level 2 ✅
- Multi-tenancy (shared DB + tenant_id, 2 demo tenants)
- Audit logs (user_id, tenant_id, before/after, correlation_id)
- BullMQ escalation workflow with retry handling
- Redis caching (TTL 5 min) on read-heavy endpoints
- DB indexes documented
- Pagination on all list endpoints
- Rate limiting on auth + booking routes
- Feature flags (bonus)
- Swagger API documentation
- 24 tests passing (including 4 tenant isolation tests)

---

## What Was Intentionally Cut

See **CUTS.md** for full detail and reasoning.

Summary of cuts:
- Cloud deployment (Render/Railway) — prioritised working code over hosting setup
- Search by module title — only course title search built
- Test coverage quality gate in CI — threshold not wired in (tests pass, coverage just not blocking)
- Instructor assignment workflow (separate from approve) — merged into approve flow
- Email notification implementation — console.log stub only

---

## Why Certain Features Were Deprioritised

**Cloud deployment** was cut because getting a clean, well-tested local Docker stack was worth more in evaluation signal than a half-working cloud deployment. A broken cloud link is worse than no cloud link.

**Module title search** was a minor variant of course title search. The core pagination + search architecture was demonstrated on courses. Replicating it for modules was low-signal given time constraints.

**Email** is a stub by design in this type of assessment — real email requires SMTP credentials, deliverability setup, and template work that adds no architectural signal. The console.log pattern shows where the integration point sits.