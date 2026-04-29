# KHOUR - Primary-First Implementation Blueprint (Forum de l'Excellence)

Date: 2026-04-27
Scope: PRIMARY only (no 6eme -> Terminale rollout yet)

## 1) North Star (Primary-Only)

Build a stable, truthful, deployable primary school platform where:
- Data persists in PostgreSQL (no critical in-memory dependencies for core workflows).
- Auth/session lifecycle is correct (login, refresh, logout, password change).
- ADMIN, TEACHER, PARENT, STUDENT flows are reliable and secure.
- Middle/high school expansion is intentionally deferred (standby), not mixed into current delivery.

## 2) Architecture Understanding (Current State)

### Frontend
- React + TypeScript + Vite app with role-based dashboards.
- Central API client and token refresh flow in app/src/lib/api.ts.
- Session/user state in app/src/contexts/AuthContext.tsx.
- Routing and guards in app/src/App.tsx.

### Backend
- Express + Prisma + PostgreSQL.
- Auth/session controllers in backend/src/controllers/authController.ts.
- Route wiring in backend/src/server.ts and backend/src/routes/auth.ts.
- Security/middleware in backend/src/middleware/auth.ts and backend/src/middleware/rateLimiter.ts.

### Database
- Active schema appears to be backend/prisma/schema.prisma (runtime default).
- A larger primary-oriented reference exists in backend/prisma/schema_primary_school.prisma.
- Current active schema still contains university-era concepts (Program, DegreeType, department-centric structure).

## 3) Verified Gaps (Confirmed in Code)

### G1 - Token refresh is effectively broken by API client behavior
- File: app/src/lib/api.ts
- Problem: validateStatus returns true for every status, preventing normal Axios error path behavior.
- Impact: 401 flow, error handling consistency, and refresh logic reliability are degraded.

### G2 - Refresh flow misses tokenVersion on user select
- File: backend/src/controllers/authController.ts
- Problem: refresh query selects id/email/role/isActive but not tokenVersion.
- Impact: password reset/change invalidation can desync with token checks.

### G3 - getMe leaks nested user password hash via parent -> student -> user include
- File: backend/src/controllers/authController.ts
- Problem: nested include uses user: true.
- Impact: sensitive data exposure risk.

### G4 - Cross-user force logout route lacks admin gate
- File: backend/src/routes/auth.ts
- Problem: any authenticated user can call force-logout endpoint logic.
- Impact: privilege boundary weakness.

### G5 - Change-password route is public in routing
- File: app/src/App.tsx
- Problem: route is not wrapped with ProtectedRoute.
- Impact: inconsistent auth guard and route contract.

### G6 - Login flow duplicates auth/me request unnecessarily
- File: app/src/pages/auth/LoginPage.tsx
- Problem: post-login API call to /api/auth/me duplicates state hydration.
- Impact: extra failure point and race conditions.

### G7 - ChangePassword page does not consume new token response path
- File: app/src/pages/auth/ChangePassword.tsx
- Problem: success path navigates to login without handling server token behavior consistently.
- Impact: inconsistent UX/session continuity.

### G8 - Security hardening gaps in server wiring
- File: backend/src/server.ts
- Problems observed:
  - inline /api/health plus health route mounting overlap risk,
  - duplicate user route mount (/api/users and /api/admin/users),
  - CSP upgradeInsecureRequests uses null branch.

### G9 - Auth middleware enforces teacher profile existence globally
- File: backend/src/middleware/auth.ts
- Problem: teacher integrity check in generic authentication path.
- Impact: auth fragility for unrelated endpoints.

## 4) Scope Freeze (Explicit)

This implementation file intentionally does NOT add middle/high school features now.

Standby items (deferred):
- 6eme, 5eme, 4eme, 3eme
- 2nde, 1ere, Terminale tracks
- SchoolType-based UI expansion for non-primary levels
- High-school-specific track/department behavior

Rule:
- Keep database and UI extension points ready, but seed and expose PRIMARY-only operational data for this cycle.

## 5) Execution Plan (Primary-First)

## Phase P0 - Foundation truth fixes (must complete first)

Deliverable: auth, refresh, and route guards behave correctly.

Tasks:
1. Fix API client status handling
- Update app/src/lib/api.ts
- Remove validateStatus override.
- Keep 2xx in success path and all 4xx/5xx in error interceptor path.
- Keep queued refresh retry logic with single in-flight refresh.

2. Fix refresh user select
- Update backend/src/controllers/authController.ts
- Include tokenVersion in refresh user select.

3. Fix getMe nested user exposure
- Update backend/src/controllers/authController.ts
- Replace nested user: true with explicit safe field select.

4. Guard force-logout cross-user operation
- Update backend/src/routes/auth.ts
- Require ADMIN when req.body.userId targets another user.

5. Guard /change-password route
- Update app/src/App.tsx
- Wrap route in ProtectedRoute + AuthLayout for consistency.

6. Correct ChangePassword token/error handling
- Update app/src/pages/auth/ChangePassword.tsx
- Handle both AxiosError and normalized response error paths.
- Consume returned access token or explicitly logout (choose one strategy and keep it consistent).

Done criteria:
- 401 refresh path tested from an expired access token.
- Password change no longer causes refresh lockout.
- Parent /me payload contains no password hashes.

## Phase P1 - Primary schema alignment (without middle/high rollout)

Deliverable: schema supports primary workflows cleanly and safely.

Tasks:
1. Normalize active schema in backend/prisma/schema.prisma:
- Keep primary-ready models as source of truth.
- Remove or isolate university-only fields that break primary semantics (major, GPA storage if computed, DegreeType dependencies where not needed).

2. Security data model fixes:
- AuditLog.entityId from UUID-only to VarChar(100) for mixed identifiers.
- Add UserSession.expiresAt and enforce in middleware.
- Remove raw secrets from SecretRotationAudit.

3. Primary seed policy:
- Seed CP, CE1, CE2, CM1, CM2 only for now.
- No middle/high seed entries in this cycle.

Done criteria:
- Prisma migration applies cleanly from a fresh DB.
- Seed script creates only primary levels and validates uniqueness/order.

## Phase P2 - Remove in-memory truth for primary-critical domains

Deliverable: core admin data survives restarts.

Priority migration targets:
1. classes route/controller to Prisma
2. subjects route/controller to Prisma
3. academic years/trimesters route/controller to Prisma
4. grade locks route/controller to Prisma
5. page/home content controllers to Prisma-backed content

Done criteria:
- Restarting backend does not lose class/subject/year/grade-lock/content data.
- CRUD smoke tests pass for these resources.

## Phase P3 - Security hardening baseline

Deliverable: reduce high-risk exposure and improve forensic quality.

Tasks:
1. Use shared errorHandler middleware in backend/src/server.ts.
2. Fix CSP object spread for production-only upgradeInsecureRequests.
3. Remove duplicate and shadow route mounts.
4. Add refresh-specific rate limiter (10/min).
5. Fix health skip path in rate limiter (/health under /api mount context).
6. Add logger redact for password/token/secret fields.
7. Enforce session expiresAt in auth middleware.
8. Move teacher profile integrity validation out of global authenticate.

Done criteria:
- Security smoke tests pass (refresh throttling, expired session rejection, sanitized logs).

## Phase P4 - Frontend correctness and UX cleanup

Deliverable: stable login/change-password UX and accurate French errors.

Tasks:
1. AuthContext login error handling aligned with Axios error flow.
2. LoginPage removes redundant auth/me call; navigate from user state effect.
3. Add 429-specific message for brute-force lockout.
4. Add autocomplete attributes to login fields.
5. Normalize error extraction pattern: err.response?.data?.error || err.data?.error.
6. Keep Register page removed if unrouted/dead.

Done criteria:
- Login flow completes with a single auth call.
- French error messages are consistent across pages.

## Phase P5 - Primary feature completion (no level expansion)

Deliverable: close high-value half-built features for primary operation.

Priority:
1. Teacher homework submissions panel + grading actions.
2. Admin grade lock table + unlock action.
3. Forgot/reset password flow using PasswordResetToken.
4. Security admin tab wired to real backend logic.

Done criteria:
- Teachers can review and grade submissions end-to-end.
- Admin can view/unlock grade locks.
- Users can recover password securely.

## 6) Out-of-Scope for This Cycle

Not implemented now:
- Any UI navigation or data exposure for 6eme through Terminale.
- High-school tracks/series UX.
- Multi-school-type feature gating in production UI.

Note:
- Keep abstractions extension-friendly, but keep runtime data and UI primary-focused.

## 7) Proposed File Touch Registry (This Cycle)

Frontend likely touched:
- app/src/lib/api.ts
- app/src/contexts/AuthContext.tsx
- app/src/App.tsx
- app/src/pages/auth/LoginPage.tsx
- app/src/pages/auth/ChangePassword.tsx

Backend likely touched:
- backend/src/controllers/authController.ts
- backend/src/routes/auth.ts
- backend/src/server.ts
- backend/src/middleware/auth.ts
- backend/src/middleware/rateLimiter.ts
- backend/src/utils/logger.ts
- backend/prisma/schema.prisma
- backend/prisma/migrations/*

## 8) Validation Checklist (Primary-Only Go/No-Go)

Auth/Security:
- Login -> me -> dashboard works for all 4 roles.
- Expired access token refreshes once and replays pending requests.
- Password change updates tokens/session behavior correctly.
- Force logout cannot target another user without ADMIN role.

Data truth:
- Classes/subjects/years/grade-locks persist after restart.
- CMS page content persists after restart.

Primary policy:
- Only CP/CE1/CE2/CM1/CM2 operationally seeded and exposed.
- No accidental middle/high records in default datasets.

## 9) Implementation Order Summary

1. P0 first (foundation truth)
2. P1 schema stabilization
3. P2 in-memory removals
4. P3 security hardening
5. P4 frontend cleanup
6. P5 feature completion

No new feature work should start before P0 is complete.

## Current Progress (2026-04-27)

- P0 (Foundation truth fixes): largely completed — auth refresh, `tokenVersion` selection, nested user leak fix, force-logout guard, and change-password route protection have been implemented and validated in unit tests.
- Prisma migrations: primary-school models (`AcademicYear`, `Trimester`, `GradeLock`, `Class`, `Subject`) added; Prisma client regenerated and tests passing locally.
- P2 migrations for `subjects`, `academicYears`, `gradeLocks`, and `classes` have been migrated to Prisma and smoke-tested; server required a small schema addition (`Subject`) to align generated client types.

## Immediate Next Actions (start now)

1. Run authenticated integration smoke tests against the running dev server (login, `GET /api/auth/me`, `GET /api/academic-years`, `GET /api/classes`, `GET /api/grade-locks`).
  - Command: `node backend/scripts/smoke-integration-debug.js`
2. Harden `server.ts` wiring and rate-limiter exceptions (ensure `/api/health` is reachable without auth where intended).
  - Files: `backend/src/server.ts`, `backend/src/middleware/rateLimiter.ts`
3. Finish `settings` route Prisma alignment (move defaults + fallbacks into DB-backed reads).
  - File: `backend/src/routes/settings.ts` (already migrated to use Prisma; verify default fallbacks and admin-only writes).
4. Prepare a minimal staging deployment checklist (migrations, environment, secrets, seed primary-only data).
  - Commands: `npx prisma migrate deploy`, `npm run build`, `npm start` (on staging host)

## Owners & Estimates

- Backend fixes & integration tests: `@assistant` (3-5 hours) — complete high-priority P0 followups and run integration smoke tests.
- Frontend small fixes (api client + change-password flow): `@assistant` (2-4 hours).
- Staging deploy checklist & verification: `@assistant` + `@you` (1-2 hours to run with proper env).

If you'd like, I can (choose best option):
- Run the authenticated integration smoke tests now and attach results (recommended).
- Open a PR with the P0 fixes and the updated `khour.md` as part of the change (if you want commits staged).
- Draft a short runbook for staging deploy based on current migrations.

