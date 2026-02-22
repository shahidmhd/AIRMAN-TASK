# POSTMORTEM.md — What Went Wrong and What I'd Improve

---

## What Went Wrong

### 1. Multi-Tenancy Schema Migration Broke Unique Constraints

**What happened:** When adding `tenantId` to the `User` model for Level 2, the existing `@@unique([email])` constraint on `User` needed to become `@@unique([email, tenantId])` — because two different tenants can have users with the same email address. This required a migration that dropped and recreated the unique index.

**Impact:** The seed script failed on re-run because `upsert` was still looking up by `email` alone. Tests that created users were failing with unique constraint violations because they didn't pass `tenantId`.

**How I fixed it:** Updated the seed to use `findFirst({ where: { email, tenantId } })` instead of `findUnique`, and updated all test fixtures to include `tenantId`. Also updated `auth.service.js` login to use `findFirst` with both fields.

**What I'd do differently:** Design multi-tenancy into the schema from day one, even in Level 1. The migration cost was the most painful part of the Level 1 → Level 2 transition.

---

### 2. Express Route Ordering Bug (Lesson Routes)

**What happened:** `POST /api/courses/modules/:moduleId/lessons` was being matched by Express as `GET /api/courses/:id` — with `modules` being treated as the course ID — because parameterized routes have lower specificity than literal path segments only when declared first.

**Impact:** Creating lessons returned 404 or course-not-found errors for about 2 hours of debugging.

**How I fixed it:** Moved all literal-path routes (`/modules/:moduleId/lessons`) before parameterized routes (`/:id`) in `courses.routes.js`. Classic Express gotcha.

**What I'd do differently:** Separate resources into their own routers from the start (`/api/modules`, `/api/lessons`) rather than nesting everything under `/api/courses`. This avoids ambiguous route matching entirely.

---

### 3. Next.js Middleware Conflict

**What happened:** Next.js `middleware.ts` is reserved for Next.js route middleware (it runs on the Edge Runtime). I initially named the API proxy file `middleware.ts`, which caused it to be treated as a Next.js edge middleware and broke authentication redirect logic.

**Impact:** The tenant proxy wasn't working, and login redirects were misfiring. The login page appeared to work but API calls were failing silently.

**How I fixed it:** Renamed to `proxy.ts` and kept Next.js `middleware.ts` for route guard logic only. Separated concerns.

**What I'd do differently:** Use a dedicated API client (`lib/api.ts` with Axios interceptors) that handles token refresh and tenant headers, rather than a server-side proxy function. This is cleaner and doesn't require the Edge Runtime workaround.

---

### 4. Double Sidebar Rendering Bug

**What happened:** The `app/(dashboard)/layout.tsx` file was rendering a `<Sidebar />` component. Individual pages were also wrapping themselves in `<DashboardLayout>` which renders its own `<Sidebar />`. Result: two sidebars visible simultaneously.

**Impact:** Ugly UI that confused what was working and what wasn't during development.

**How I fixed it:** Made `app/(dashboard)/layout.tsx` only handle auth redirect logic (no UI rendering). All pages use `<DashboardLayout>` directly, which owns the single sidebar render.

**What I'd do differently:** Establish the layout ownership pattern in the first commit. The rule is simple — either the layout file renders structure, or the pages render structure, never both.

---

### 5. UUID ESM Import Issue in Tests

**What happened:** The `uuid` package v9+ ships as ESM-only. Jest runs in CommonJS mode by default. Importing `uuid` directly in test files or mocked modules caused `SyntaxError: Cannot use import statement in a module` errors.

**Impact:** Several tests failed on first run, requiring debugging of the Jest/ESM interop.

**How I fixed it:** Added `transformIgnorePatterns` to `jest.config.js` to allow `uuid` to be transformed, and switched to `crypto.randomUUID()` (available natively in Node 16+) where possible.

**What I'd do differently:** Use `crypto.randomUUID()` everywhere from the start. It's built into Node.js and requires zero configuration.

---

## Technical Challenges

**Challenge 1: Prisma middleware for multi-tenancy**
Injecting `tenantId` into every Prisma operation automatically (create, findMany, update, delete) required careful middleware design. The middleware needs to handle both `data.tenantId` (for writes) and `where.tenantId` (for reads), and nested creates need special handling. Prisma's middleware documentation is sparse on multi-tenancy patterns.

**Challenge 2: BullMQ with Redis in Docker**
BullMQ worker and the main Express process need to share the same Redis connection configuration. When the Redis container isn't ready, the worker crashes silently. Added a Redis connection retry strategy and graceful degradation (server starts even if Redis is unavailable, with cache miss fallback).

**Challenge 3: Frontend API proxy vs direct API calls**
The frontend needs to send `x-tenant-id` headers on every request. This works fine with Axios interceptors. But the initial proxy-based approach added latency and complexity for no gain. Switching to direct API calls with an Axios instance that auto-attaches headers was simpler and faster.

---

## What I'd Improve With One More Week

### 1. Cloud Deployment on Render
Deploy to Render with Render Postgres and Render Redis. Set up proper environment separation (dev/staging/prod) with separate `.env` files. Document the rollback strategy (Render supports instant rollback to previous deploys via the dashboard).

### 2. End-to-End Tests with Playwright
Unit and integration tests cover the backend well. A Playwright test suite covering the 3 main user journeys (student books a session, instructor marks it complete, admin views audit log) would give confidence in the full stack working together after any refactor.

### 3. Assigned Booking State
Implement the full 4-step workflow: `requested → approved → assigned → completed`. The assignment step would let the admin explicitly assign an instructor (vs. student-requested instructor), enabling scenarios where the admin mediates instructor matching.

### 4. Real Email with Resend
Replace console.log stubs with Resend (or Nodemailer + SMTP). Template: booking confirmation to student, escalation alert to admin. ~2 hours of work with clear integration points already marked in the codebase.

### 5. Swagger Documentation Completeness
The Swagger spec covers all endpoints but some request/response schemas are incomplete. A full week would let me add proper schema definitions for every body, query param, and response shape — making the API self-documenting.

### 6. Frontend Loading States and Error Boundaries
Several pages fall back to a plain "Loading..." text. Proper skeleton loaders and React Error Boundaries would make the UX significantly better. The architecture is solid; this is purely polish.

### 7. Test Coverage Quality Gate
Wire `npm run test:coverage` into the CI pipeline so the build fails if coverage drops below 60%. The threshold is already configured in `jest.config.js` — just needs to be invoked in CI.

### 8. Accessibility
The UI is functional but has not been audited for accessibility. Proper ARIA labels, keyboard navigation, focus management on modals, and sufficient colour contrast would be the focus.

---

## Overall Reflection

The 72-hour constraint forces genuine prioritisation. The decisions that mattered most were:
- Getting multi-tenancy right early (the late schema migration was the most painful mistake)
- Writing tests before building frontend (found bugs earlier)
- Keeping the Docker setup clean from the start (paid off during final testing)

The architecture is production-minded: tenant isolation is enforced at the database middleware layer (not just at the API), audit logs capture before/after state with correlation IDs, refresh tokens rotate on use, and caching has TTL-based invalidation. These are the things that matter in a real system.