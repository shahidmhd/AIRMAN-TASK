# AIRMAN — Postmortem

## What Went Wrong

### 1. Port Conflict (AirPlay vs Backend)
Port 5000 was occupied by macOS AirPlay/AirTunes service, causing all API calls to return
403 Forbidden. Diagnosis took ~45 minutes.
**Fix:** Changed backend to port 4000.

### 2. Prisma v7 Breaking Change
The setup script installed Prisma v7 which changed datasource configuration format,
breaking migrations. Downgraded to Prisma v5.
**Fix:** `npm install prisma@5.22.0 @prisma/client@5.22.0`

### 3. CORS with credentials
Using `origin: '*'` with `credentials: true` is rejected by browsers. Caused all
frontend API calls to fail.
**Fix:** Explicit origin array with specific localhost URLs.

### 4. Express 5 Wildcard Routes
`app.options('*', cors())` throws PathError in Express 5. Required `/{*path}` syntax.
**Fix:** Updated to Express 5 compatible wildcard syntax.

### 5. Route Order Bug
Express matched `/courses/:id` before `/courses/modules/:moduleId/lessons`, causing
lesson creation to 404. Took time to debug.
**Fix:** Moved specific routes before parameterized routes.

### 6. Docker Image Pull Failures
TLS errors pulling postgres:15-alpine image on unstable network connection.
**Fix:** Used `postgres:15` (non-alpine) and added DNS configuration.

## Technical Challenges

- **Prisma relations with cascade deletes** — Ensuring modules delete lessons, lessons
  delete quizzes required careful schema design
- **JWT token refresh race condition** — Multiple simultaneous requests on 401 could
  trigger multiple refresh calls. Mitigated with retry flag on axios interceptor
- **Time-based conflict detection** — Overlapping time interval logic requires careful
  boundary conditions (back-to-back bookings should not conflict)

## What Would Be Improved With One More Week

### Architecture
- Add Redis caching for course list and user profile endpoints
- Implement proper request correlation IDs for tracing
- Add database indexes on frequently queried columns
  (bookings.instructorId, bookings.date, courses.createdById)

### Features
- Email notifications for booking status changes
- File upload support for lesson content (PDFs, images)
- Student progress tracking (which lessons completed)
- Instructor analytics (booking rates, student performance)

### DevOps
- Cloud deployment (Fly.io or Railway)
- Environment-based secrets management
- Database backup strategy
- Proper staging environment

### Testing
- E2E tests with Playwright
- Performance tests for pagination endpoints
- Load testing for booking conflict detection

### Security
- Re-enable Helmet.js with proper CSP configuration
- Add request rate limiting per user (not just per IP)
- API key rotation strategy
- Audit logging for sensitive operations