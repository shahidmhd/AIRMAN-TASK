# AIRMAN — Intentional Cuts

## Features Not Built

### 1. Email Notifications
**Cut because:** Would require email service setup (SendGrid/SES) adding infrastructure
complexity with no functional benefit for demo evaluation.
**Impact:** Low — console logging stubs document where emails would be sent.

### 2. File Upload for Course Content
**Cut because:** S3/storage setup adds significant complexity outside the core assessment scope.
**Impact:** Low — text content is sufficient to demonstrate the learning module architecture.

### 3. Advanced Search (full-text, filters)
**Cut because:** Basic title search covers the requirement. Full-text search (pg_trgm) would
add DB configuration complexity.
**Impact:** Low — pagination and title search are implemented as required.

### 4. Offline Quiz Attempts (sync later)
**Cut because:** This is listed as an optional bonus feature. Service workers and sync logic
would take 8+ hours to implement properly.
**Impact:** None — not a mandatory requirement.

### 5. Real-time Updates (WebSockets)
**Cut because:** Polling/refresh patterns are sufficient for a demo. WebSocket infrastructure
adds significant complexity.
**Impact:** Low — users can refresh to see updates.

### 6. Mobile-Responsive Polish
**Cut because:** Functional responsive layout is implemented but pixel-perfect mobile
optimization was deprioritized.
**Impact:** Low — all features work on mobile, just not optimized.

### 7. Level 2 Features (Multi-tenancy, Audit Logs, etc.)
**Cut because:** Level 1 completion was prioritized over partial Level 2 implementation.
A solid Level 1 is worth more than broken Level 2 features.
**Impact:** Documented — clear upgrade path exists in codebase.