# AIRMAN — 72-Hour Development Plan

## Schedule Breakdown

### Hours 0–8: Foundation
- [x] Monorepo setup (backend + frontend)
- [x] Prisma schema design (all models)
- [x] Docker Compose configuration
- [x] GitHub Actions CI pipeline
- [x] Environment configuration

### Hours 8–20: Authentication & RBAC
- [x] bcrypt password hashing
- [x] JWT access + refresh tokens with rotation
- [x] RBAC middleware (requireAdmin, requireInstructor, requireStudent)
- [x] Auth routes (register, login, refresh, logout, me)
- [x] Admin user management (create instructor, approve, delete)
- [x] Frontend auth pages (login, register)
- [x] Route guards (Next.js middleware)
- [x] Role-aware sidebar navigation
- [x] Unit tests for auth service

### Hours 20–38: Learning Module
- [x] Course → Module → Lesson hierarchy
- [x] Text lessons and MCQ quizzes
- [x] Quiz attempt, scoring, show incorrect questions
- [x] Pagination and search
- [x] Instructor course management UI
- [x] Student course browsing and quiz attempt UI
- [x] Swagger docs for learning endpoints

### Hours 38–55: Scheduling Module
- [x] Instructor availability management
- [x] Student booking requests
- [x] Admin approval workflow
- [x] Conflict detection (no double-booking)
- [x] Status states (requested/approved/completed/cancelled)
- [x] Weekly calendar view
- [x] Unit tests for conflict detection
- [x] Integration tests

### Hours 55–65: DevOps & Testing
- [x] Docker Compose (postgres + backend + frontend)
- [x] CI pipeline (lint + test + build)
- [x] Integration tests with real DB

### Hours 65–72: Documentation
- [x] README.md
- [x] PLAN.md
- [x] CUTS.md
- [x] POSTMORTEM.md
- [x] Swagger API docs

## What Was Shipped
- Complete Auth + RBAC system with 3 roles
- Full learning module (courses/modules/lessons/quizzes)
- Full scheduling module with conflict detection
- Role-aware frontend for all 3 roles
- Docker Compose single-command deployment
- CI/CD pipeline
- API documentation with Swagger

## What Was Intentionally Cut
See CUTS.md