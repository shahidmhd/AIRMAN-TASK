# CUTS.md — Features Intentionally Not Built

This document lists every feature that was considered but intentionally excluded from the submission, with honest reasoning for each decision.

---

## Cut 1: Cloud Deployment (Render / Railway / Fly.io)

**Requirement:** Level 2 asks for a live cloud deployment link.

**Status:** Not deployed. Docker Compose runs cleanly on local machine.

**Reasoning:**

Getting a production-quality cloud deployment right takes more than just `git push`. It requires environment variable management across services, persistent volume configuration for PostgreSQL, Redis provisioning, networking between services, cold start handling, and health check configuration. Doing this quickly and sloppily risks a deployment that crashes during the evaluator's review — which is worse than no deployment at all.

The Docker Compose file is production-ready and demonstrates the same architectural knowledge. Given the remaining time was better spent on test coverage, documentation, and a stable local demo, cloud deployment was explicitly cut.

**What would be needed to deploy:**
- Render: deploy backend as Web Service, use Render Postgres + Render Redis, set all env vars, configure build command to run `prisma migrate deploy` on start
- Railway: similar, one-click Postgres + Redis add-ons, point `DATABASE_URL` and `REDIS_URL` to Railway-provided connection strings
- Estimated time: 45–60 minutes to do properly

---

## Cut 2: Search by Module Title

**Requirement:** Level 1B requires "Search by course/module title".

**Status:** Search by course title is implemented (`GET /api/courses?search=`). Search by module title within a course is not built.

**Reasoning:**

The core pagination + full-text search architecture was demonstrated on the courses endpoint. Module title search would be a nearly identical implementation (a `contains` filter on the module table) but would require a separate endpoint or query parameter — adding routes and controller logic for low architectural signal. The evaluator can see the pattern; repeating it for modules wasn't worth the time.

**What it would take:** Add a `?search=` param to `GET /api/courses/:id` that filters the returned modules by title. ~30 minutes.

---

## Cut 3: Test Coverage Quality Gate in CI

**Requirement:** Level 2F requires at least one quality gate — either a coverage threshold or a performance metric gate.

**Status:** Tests run in CI and pass (24 tests). Coverage is generated but not blocking. The jest config has coverage thresholds defined (`60%`) but they are not referenced in the CI `npm test` command.

**Reasoning:**

The test suite covers the most important code paths (auth, conflict detection, tenant isolation, booking flow). Adding `--coverage --coverageThreshold` to the test command in CI was a 5-minute task that got deprioritised during the final push. This is acknowledged as a genuine miss.

**Fix:** In `apps/backend/jest.config.js`, `coverageThreshold` is already set to 60%. Change the CI test step from `npm test` to `npm run test:coverage` to activate the gate.

---

## Cut 4: Instructor Assignment as Separate Workflow Step

**Requirement:** Level 2C asks for a workflow: `requested → approved → assigned → completed`.

**Status:** The workflow is `requested → approved → completed` (3 states, not 4). The `ASSIGNED` state was merged into `APPROVED`.

**Reasoning:**

In the original Level 1 schema, `BookingStatus` has `REQUESTED | APPROVED | COMPLETED | CANCELLED`. Adding a separate `ASSIGNED` state would require a schema migration, new status transition logic, and additional UI for the admin to assign a specific instructor after approving. The meaningful booking workflow (student requests → admin approves → instructor marks complete) is fully functional. The distinction between "approved" and "assigned" is subtle for a single-instructor booking system.

The escalation job handles the "not assigned within X hours" requirement by treating any booking that stays in `REQUESTED` status past the escalation window as needing attention.

---

## Cut 5: Real Email Notifications

**Requirement:** Level 2C mentions "Email notification stub (console logger acceptable)".

**Status:** Email notifications are console.log stubs only. No actual email is sent.

**Reasoning:**

The requirement explicitly states console logger is acceptable. Real email requires SMTP credentials (Resend, SendGrid, SES), email templates, deliverability configuration, and introduces an external dependency that adds no architectural signal to the assessment. The code shows exactly where `sendEmail()` would be called; the implementation is a deliberate stub.

---

## Cut 6: Separate DB per Tenant / Schema per Tenant

**Requirement:** Level 2A asks the candidate to choose one multi-tenancy approach and document it.

**Status:** Shared DB + tenant_id chosen. Separate schema and separate DB approaches were not implemented.

**Reasoning:**

Shared DB is the right choice for this stage of the product. Separate DBs would require dynamic connection string management and separate Prisma clients per tenant — a significant operational overhead with no benefit at this scale. Separate schemas would require schema-level migrations per tenant. The shared DB approach with Prisma middleware auto-injecting tenantId provides strong isolation guarantees with simple operations.

---

## Cut 7: Offline-First Quiz Attempts

**Requirement:** Listed as a bonus option.

**Status:** Not implemented. Role-based feature flags was chosen as the bonus instead.

**Reasoning:**

Offline-first requires service workers, IndexedDB, sync-on-reconnect logic, and conflict resolution — a significant frontend architecture investment. Feature flags were chosen because they directly extend the multi-tenancy + RBAC work already done, demonstrated clear product thinking, and could be implemented cleanly in ~3 hours.

---

## Cut 8: Telemetry Ingestion Stub

**Requirement:** Listed as a bonus option.

**Status:** Not implemented.

**Reasoning:** Same as Cut 7. Feature flags were the chosen bonus. Telemetry ingestion would be a JSON endpoint that stores flight event logs — useful to show as an architecture diagram but lower value than demonstrating end-to-end feature flag functionality.

---

## Summary Table

| Feature | Cut Reason | Estimated Fix Time |
|---|---|---|
| Cloud deployment | Polish > broken deploy | 45–60 min |
| Module title search | Pattern already demonstrated | 30 min |
| Coverage quality gate in CI | Final hour deprioritisation | 5 min |
| Assigned booking state | Merged into Approved | 2–3 hours |
| Real email | Stub explicitly acceptable | 1–2 hours |
| Offline-first quiz | Chose feature flags bonus instead | 8–12 hours |
| Telemetry ingestion | Chose feature flags bonus instead | 2–3 hours |