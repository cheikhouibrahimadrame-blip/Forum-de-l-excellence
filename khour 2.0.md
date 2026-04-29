# KHOUR 2.0 — Primary-Only Implementation Architecture

**Date:** 2026-04-29
**Scope:** PRIMARY (CI → CM2) only. College/lycée explicitly deferred (extension hooks documented).
**Goal:** A 100% deployable, 100% functional primary school platform (Forum de l'Excellence) with no in-memory truth, correct deploy probes, primary-aligned schema, and a runbook that takes a fresh DB to production.

This document supersedes `khour.md`. It is **executable**: every code block is meant to be copy-pasted into the path indicated by its `@` citation. Items marked **CRITICAL** block deploy.

---

## 1. Executive Summary

### What works (verified)
- P0 from `khour.md` is shipped: API client `validateStatus` removed, refresh selects `tokenVersion`, `getMe` no longer leaks nested `user` password hashes, force-logout requires ADMIN for cross-user, `/change-password` is gated by `ProtectedRoute`, login page no longer double-calls `/auth/me`.
- Auth pipeline is correct: helmet, HSTS+preload, CORS scoped to `FRONTEND_URL`, cookie-based refresh, sessions in DB, audit logs, structured pino logging with redaction.
- Prisma-backed: `users`, `subjects`, `academic-years`, `classes`, `grade-locks`, `settings/*`.

### What blocks deploy or correctness (verified, must fix)

| # | Severity | Where | Issue |
|---|----------|-------|-------|
| K1 | **CRITICAL** | `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/render.yaml:17` + `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/server.ts:156` | `healthCheckPath: /api/health` resolves to the **student health-records router** which is gated by `authenticate`. Render gets `401` → service marked unhealthy → restart loop. |
| K2 | HIGH | `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/prisma/schema.prisma:130-210` | University-era models (`Department`, `Program`, `Course`, `Enrollment`, `DegreeType`) still active, used by `gradesController`, `homeworkController`, `scheduleController`. Primary uses `Subject` + `Class` + trimesters, not courses + credits + semesters. |
| K3 | HIGH | `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/prisma/schema.prisma:617-628` | `Class` is orphaned: no FK to `AcademicYear`, no student-class join, `mainTeacherId` is `User.id` not `Teacher.id`. Student↔class linking happens via `Student.major` string match — fragile, no integrity. |
| K4 | HIGH | `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/controllers/scheduleController.ts:27` | Schedule approval requests stored in module-level array `pendingScheduleRequests` — lost on every restart. |
| K5 | MEDIUM | `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/routes/subjects.ts:35` + `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/routes/reports.ts:20` | `subject-assignments` and `reports` still in JSON files (`~/.okcomputer-cms-data/`). Survives restart on a single host but not portable across replicas/Render. |
| K6 | MEDIUM | `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/prisma/schema.prisma:454-468` | `UserSession.expiresAt` missing — sessions never time out by clock, only on explicit revoke. |
| K7 | MEDIUM | `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/prisma/schema.prisma:566-580` | `SecretRotationAudit` stores raw secrets in plain columns. |
| K8 | MEDIUM | `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/scripts/create-admin.js:8-9` | Real admin email + temporary password committed in source. Move to env. |
| K9 | LOW | `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/server.ts:149-150` | `/api/homepage` mounted twice (also at `/api/admin/homepage`). Shadow mount; remove the duplicate. |
| K10 | LOW | `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/app/src/pages` | Stub admin pages `AdminCourses.tsx`, `AdminPrograms.tsx` from college era are still routable — confusing for primary users. |

### What this document delivers

1. A **schema 2.0** (Prisma) keeping legacy tables only as transitional, with proper primary FKs.
2. A **public health probe** that fixes the deploy blocker.
3. A **persistence sweep** moving in-memory and JSON-only state to Prisma.
4. A **seed** that creates admin from env + CI→CM2 grade levels + 2025-2026 academic year + 3 trimesters.
5. A **deploy runbook** (Render primary, Docker fallback, Vercel for app).
6. **Extension hooks** so adding 6e/5e/4e/3e/2nde/1ère/Term is config-only later.

---

## 2. Target Architecture (Primary CI → CM2)

```
┌──────────────────────────────────────────────────────────────────────┐
│                  Vercel (static)  ─  app/dist                         │
│   React 19 + Vite + Tailwind + Radix + react-router-dom 7             │
│   Public pages | Login | Role dashboards (ADMIN/TEACHER/PARENT/STUDENT)│
└──────────────────────────────────────────────────────────────────────┘
                              │  HTTPS  Authorization: Bearer <access>
                              │         Cookie: refresh_token (HttpOnly)
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Render web service  ─  backend (Node 20 + Express)                   │
│   /api/healthz   public liveness (NEW)                                │
│   /api/auth/*    login/refresh/logout/change-password/forgot/reset    │
│   /api/users     ADMIN CRUD; TEACHER read scoped                      │
│   /api/classes   Classes (CI..CM2) + ClassAssignment (student↔class)  │
│   /api/subjects  Subjects + ClassSubjectAssignment (subject↔class↔T)  │
│   /api/academic-years   Years + Trimesters (3 per year)               │
│   /api/grades    Per-trimester /20 scale, no letter grades            │
│   /api/attendance        Daily + per-subject                          │
│   /api/homework + /api/homework-submissions                           │
│   /api/messages + /api/appointments + /api/behavior + /api/pickup     │
│   /api/health-records    (renamed from /api/health to free probe)     │
│   /api/grade-locks       per-trimester locks                          │
│   /api/reports + /api/settings/* + /api/pages + /api/homepage         │
└──────────────────────────────────────────────────────────────────────┘
        │                                      │
        ▼                                      ▼
┌────────────────────────┐         ┌──────────────────────────┐
│  PostgreSQL 16          │         │  Redis 7                 │
│  Prisma source-of-truth │         │  rate-limit store        │
└────────────────────────┘         └──────────────────────────┘
```

### Roles & access matrix (primary scope)

| Resource | ADMIN | TEACHER | PARENT | STUDENT |
|----------|-------|---------|--------|---------|
| Users CRUD | full | read scoped | self only | self only |
| Classes / Subjects | full | read assigned | — | — |
| Grades | read all | write own subjects | read children | read self |
| Attendance | read all | write own classes | read children | read self |
| Homework | read all | write own | read children | read+submit assigned |
| Messages | read+write | read+write | read+write | read+write |
| Reports / Settings | full | — | — | — |
| Health records | read all | read assigned | read+write children | read+write self |

### Naming/scope decisions

- Grade levels: `CI`, `CP`, `CE1`, `CE2`, `CM1`, `CM2` (codes are stable, label is FR).
- Trimester scheme: `T1`, `T2`, `T3` per `AcademicYear` (e.g., `2025-2026`).
- Grading: Decimal `points` on a 0..20 scale, no GPA, no letter grades.
- A class belongs to **one** grade level + **one** academic year.
- A student belongs to **at most one** active class per academic year (`ClassAssignment` join).
- A subject is taught in a class by **one** teacher per academic year (`ClassSubjectAssignment` join).

---

## 3. Verified State Audit (file-anchored)

### 3.1 Deploy blocker — health probe collision

`@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/render.yaml:17`
```yaml
healthCheckPath: /api/health
```

`@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/server.ts:156`
```ts
app.use('/api/health', healthRoutes);
```

`@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/routes/health.ts:21-23`
```ts
router.use(authenticate);
router.use(healthLimiter);
```

There is **no public unauthenticated** probe on the live server. Render will mark the service unhealthy.

### 3.2 In-memory truth — schedule requests

`@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/controllers/scheduleController.ts:27`
```ts
const pendingScheduleRequests: PendingScheduleRequest[] = [];
```

Any teacher schedule submission for ADMIN approval is wiped on every backend restart/redeploy.

### 3.3 University relics still wired

`@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/controllers/gradesController.ts:104-128` computes `gradesByCourse`, `course.credits`, letter grades A/B/C/D/F. Primary should use `Subject` + 0..20 scale.

`@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/controllers/homeworkController.ts:60-122` notifies via `Course.enrollments`. Primary should resolve student list via `ClassAssignment` of the class the homework belongs to.

### 3.4 Class is orphaned

`@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/prisma/schema.prisma:617-628`
```prisma
model Class {
  id             String   @id @default(uuid()) @db.Uuid
  name           String   @db.VarChar(100)
  level          String?  @db.VarChar(50)
  capacity       Int?
  mainTeacherId  String?  @db.Uuid
  academicYearId String?  @db.Uuid
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  @@index([academicYearId])
}
```

No relations declared; `Student.major` is the de-facto join key. Must be replaced by FKs and a `ClassAssignment` join table.

### 3.5 Other findings

- Settings models present and used (good).
- Subject CRUD is Prisma-backed (good).
- `subject-assignments.json` still on disk (`@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/routes/subjects.ts:35`) — must move to Prisma.
- `reports.json` still on disk (`@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/routes/reports.ts:20`) — should move to Prisma.
- `homepageContent` and `pagesContent` JSON-backed — acceptable for content but plan move to Prisma `CmsContent` table.
- `UserSession.expiresAt` missing — add it and enforce.
- `SecretRotationAudit` keeps secrets in plain text — drop columns; keep only metadata + sha256 fingerprints.

---

## 4. Schema 2.0 — Primary-Aligned Prisma Models

> **How to apply:** These are the models that must be added/replaced in `backend/prisma/schema.prisma`.
> Do NOT drop legacy `Course`/`Enrollment`/`Program`/`Department` tables via migration in the same step —
> mark them `@@ignore` first, run migration, then in a subsequent migration drop them.
> This gives zero-downtime with no FK cascade surprise.

### 4.1 Models to KEEP unchanged (already correct)

- `User`, `RefreshToken`, `UserSession`, `PasswordResetToken`, `AuditLog`
- `Parent`, `ParentStudent`
- `Attendance`, `Message`, `MessageAttachment`
- `BehaviorLog`, `Homework`, `HomeworkSubmission`
- `HealthRecord`, `AuthorizedPickup`, `PickupLog`
- `Appointment`
- `GeneralSettings`, `SecuritySettings`, `NotificationSettings`, `AppearanceSettings`, `DatabaseSettings`, `EmailSettings`
- `AcademicYear`, `Trimester`, `GradeLock`, `Subject`

### 4.2 Models to ADD (missing for primary integrity)

#### `GradeLevel` — stable lookup for CI/CP/CE1/CE2/CM1/CM2

```prisma
// Add to backend/prisma/schema.prisma
model GradeLevel {
  id             String      @id @default(uuid()) @db.Uuid
  code           String      @unique @db.VarChar(10)   // "CI","CP","CE1","CE2","CM1","CM2"
  label          String      @db.VarChar(50)           // "Cours Initiation" etc.
  sequenceOrder  Int                                    // 1..6 for ordering
  isActive       Boolean     @default(true)

  classes        Class[]

  @@index([sequenceOrder])
}
```

#### `Class` — REPLACE the current orphaned model

```prisma
// Replace model Class in backend/prisma/schema.prisma
model Class {
  id              String       @id @default(uuid()) @db.Uuid
  name            String       @db.VarChar(100)          // e.g. "CI A"
  gradeLevelId    String       @db.Uuid
  gradeLevel      GradeLevel   @relation(fields: [gradeLevelId], references: [id], onDelete: Restrict)
  academicYearId  String       @db.Uuid
  academicYear    AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  mainTeacherId   String?      @db.Uuid
  mainTeacher     Teacher?     @relation("ClassMainTeacher", fields: [mainTeacherId], references: [id], onDelete: SetNull)
  capacity        Int          @default(30)
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  students            ClassAssignment[]
  subjectAssignments  ClassSubjectAssignment[]
  grades              PrimaryGrade[]
  attendances         Attendance[]

  @@unique([name, academicYearId])
  @@index([gradeLevelId])
  @@index([academicYearId])
  @@index([mainTeacherId])
}
```

#### `ClassAssignment` — student ↔ class join (with history)

```prisma
// Add to backend/prisma/schema.prisma
model ClassAssignment {
  id             String    @id @default(uuid()) @db.Uuid
  studentId      String    @db.Uuid
  student        Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  classId        String    @db.Uuid
  class          Class     @relation(fields: [classId], references: [id], onDelete: Cascade)
  academicYearId String    @db.Uuid
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  enrolledAt     DateTime  @default(now()) @db.Date
  isActive       Boolean   @default(true)
  notes          String?

  @@unique([studentId, academicYearId])   // one class per student per year
  @@index([studentId])
  @@index([classId])
  @@index([academicYearId])
}
```

#### `ClassSubjectAssignment` — which teacher teaches which subject in which class

```prisma
// Add to backend/prisma/schema.prisma  (replaces JSON subject-assignments.json)
model ClassSubjectAssignment {
  id             String       @id @default(uuid()) @db.Uuid
  classId        String       @db.Uuid
  class          Class        @relation(fields: [classId], references: [id], onDelete: Cascade)
  subjectId      String       @db.Uuid
  subject        Subject      @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  teacherId      String       @db.Uuid
  teacher        Teacher      @relation("TeacherSubjectAssignments", fields: [teacherId], references: [id], onDelete: Restrict)
  academicYearId String       @db.Uuid
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@unique([classId, subjectId, academicYearId])
  @@index([classId])
  @@index([subjectId])
  @@index([teacherId])
  @@index([academicYearId])
}
```

#### `PrimaryGrade` — primary 0..20 grade (replaces university `Grade` for primary)

```prisma
// Add to backend/prisma/schema.prisma
model PrimaryGrade {
  id             String       @id @default(uuid()) @db.Uuid
  studentId      String       @db.Uuid
  student        Student      @relation("StudentPrimaryGrades", fields: [studentId], references: [id], onDelete: Cascade)
  classId        String       @db.Uuid
  class          Class        @relation(fields: [classId], references: [id], onDelete: Cascade)
  subjectId      String       @db.Uuid
  subject        Subject      @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  teacherId      String       @db.Uuid
  teacher        Teacher      @relation("TeacherPrimaryGrades", fields: [teacherId], references: [id], onDelete: Restrict)
  trimesterId    String       @db.Uuid
  trimester      Trimester    @relation(fields: [trimesterId], references: [id], onDelete: Restrict)

  assessmentName String       @db.VarChar(200)
  assessmentType PrimaryAssessmentType
  score          Decimal      @db.Decimal(4, 2)    // 0.00 .. 20.00
  maxScore       Decimal      @db.Decimal(4, 2)    @default(20.00)
  gradedDate     DateTime     @db.Date
  comments       String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([studentId])
  @@index([classId])
  @@index([subjectId])
  @@index([trimesterId])
  @@index([teacherId])
}
```

#### `PrimaryReportCard` — per-trimester bulletin (replaces university `ReportCard`)

```prisma
// Add to backend/prisma/schema.prisma
model PrimaryReportCard {
  id              String     @id @default(uuid()) @db.Uuid
  studentId       String     @db.Uuid
  student         Student    @relation("StudentReportCards", fields: [studentId], references: [id], onDelete: Cascade)
  classId         String     @db.Uuid
  class           Class      @relation(fields: [classId], references: [id])
  trimesterId     String     @db.Uuid
  trimester       Trimester  @relation(fields: [trimesterId], references: [id])

  generalAverage  Decimal    @db.Decimal(4, 2)
  totalAbsences   Int        @default(0)
  conduct         ConductRating
  teacherComment  String?
  parentComment   String?
  generatedAt     DateTime   @default(now()) @db.Date
  isFinal         Boolean    @default(false)

  @@unique([studentId, trimesterId])
  @@index([studentId])
  @@index([classId])
  @@index([trimesterId])
}
```

#### `ScheduleRequest` — persisted pending schedule requests (replaces in-memory array)

```prisma
// Add to backend/prisma/schema.prisma
model ScheduleRequest {
  id              String                @id @default(uuid()) @db.Uuid
  classId         String                @db.Uuid
  class           Class                 @relation(fields: [classId], references: [id], onDelete: Cascade)
  subjectId       String                @db.Uuid
  subject         Subject               @relation(fields: [subjectId], references: [id], onDelete: Restrict)
  teacherId       String                @db.Uuid
  teacher         Teacher               @relation("TeacherScheduleRequests", fields: [teacherId], references: [id], onDelete: Restrict)
  dayOfWeek       Int                   // 1 = Monday .. 5 = Friday
  startTime       String                @db.VarChar(5)  // "08:00"
  endTime         String                @db.VarChar(5)
  academicYearId  String                @db.Uuid
  academicYear    AcademicYear          @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  status          ScheduleRequestStatus @default(PENDING)
  requestedById   String                @db.Uuid
  requestedBy     User                  @relation("ScheduleRequestedBy", fields: [requestedById], references: [id])
  reviewedById    String?               @db.Uuid
  reviewedBy      User?                 @relation("ScheduleReviewedBy", fields: [reviewedById], references: [id])
  reviewedAt      DateTime?
  rejectionReason String?
  createdAt       DateTime              @default(now())

  @@index([classId])
  @@index([teacherId])
  @@index([status])
  @@index([academicYearId])
}
```

#### `Report` — persisted admin reports (replaces `reports.json`)

```prisma
// Add to backend/prisma/schema.prisma
model Report {
  id            String       @id @default(uuid()) @db.Uuid
  name          String       @db.VarChar(255)
  type          ReportType
  academicYearId String?     @db.Uuid
  generatedById String       @db.Uuid
  generatedBy   User         @relation("ReportGeneratedBy", fields: [generatedById], references: [id])
  recipients    Int          @default(0)
  status        ReportStatus @default(DRAFT)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([generatedById])
  @@index([createdAt])
}
```

### 4.3 Models to MODIFY

#### `UserSession` — add `expiresAt`

```prisma
// In model UserSession, add this field:
  expiresAt     DateTime?    // enforce in authenticate middleware
```

#### `AcademicYear` — add Class and ClassAssignment back-relations

```prisma
// In model AcademicYear, add:
  classes             Class[]
  classAssignments    ClassAssignment[]
  classSubjectAssignments ClassSubjectAssignment[]
  scheduleRequests    ScheduleRequest[]
```

#### `Trimester` — add PrimaryGrade and PrimaryReportCard back-relations

```prisma
// In model Trimester, add:
  primaryGrades    PrimaryGrade[]
  reportCards      PrimaryReportCard[]
```

#### `Subject` — add assignment/grade back-relations

```prisma
// In model Subject, add:
  classSubjectAssignments ClassSubjectAssignment[]
  primaryGrades           PrimaryGrade[]
  scheduleRequests        ScheduleRequest[]
```

#### `Teacher` — add new back-relations

```prisma
// In model Teacher, add:
  classesAsMainTeacher       Class[]                   @relation("ClassMainTeacher")
  subjectAssignments         ClassSubjectAssignment[]  @relation("TeacherSubjectAssignments")
  primaryGrades              PrimaryGrade[]            @relation("TeacherPrimaryGrades")
  scheduleRequests           ScheduleRequest[]         @relation("TeacherScheduleRequests")
```

#### `Student` — add primary-school back-relations

```prisma
// In model Student, add:
  classAssignments    ClassAssignment[]
  primaryGrades       PrimaryGrade[]      @relation("StudentPrimaryGrades")
  primaryReportCards  PrimaryReportCard[] @relation("StudentReportCards")
```

#### `SecretRotationAudit` — remove raw secret columns

```prisma
// Replace model SecretRotationAudit with:
model SecretRotationAudit {
  id                       String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rotationCount            Int
  accessSecretFingerprint  String   @db.VarChar(64)   // sha256 hex of new secret
  refreshSecretFingerprint String   @db.VarChar(64)
  rotatedAt                DateTime @default(now())
  reason                   String   @default("automatic_rotation") @db.VarChar(100)
  rotatedBy                String?  @db.VarChar(255)
  createdAt                DateTime @default(now())

  @@index([rotatedAt])
}
```

### 4.4 Models to IGNORE (university-era, not dropped yet)

Add `@@ignore` to each to keep DB tables intact while decoupling Prisma client:

```prisma
model Department { @@ignore  /* university legacy */ ... }
model Program    { @@ignore  /* university legacy */ ... }
model Course     { @@ignore  /* university legacy */ ... }
model Enrollment { @@ignore  /* university legacy */ ... }
model Grade      { @@ignore  /* superseded by PrimaryGrade */ ... }
model ReportCard { @@ignore  /* superseded by PrimaryReportCard */ ... }
model Schedule   { @@ignore  /* superseded by ScheduleRequest + ClassSubjectAssignment */ ... }
```

### 4.5 New enums to add

```prisma
enum PrimaryAssessmentType {
  DEVOIR           // homework / class exercise
  COMPOSITION      // term exam
  PARTICIPATION
  PROJET
  DICTEE
  LECTURE
}

enum ConductRating {
  EXCELLENT
  BIEN
  ASSEZ_BIEN
  INSUFFISANT
}

enum ScheduleRequestStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ReportType {
  ACADEMIC
  ATTENDANCE
  BEHAVIORAL
  ADMINISTRATIVE
}

enum ReportStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

---

## 5. Execution Plan

Phases are sequential. Each phase has a **done gate** — nothing in the next phase starts before it is met.

### Phase P0 — Deploy Blocker Fix (**CRITICAL**, ~1 hour)

**Objective:** Fix the health probe so Render doesn't restart-loop.

#### P0.1 — Add public `/api/healthz` endpoint in `server.ts`

Add before any `app.use('/api', rateLimiters...)`:

```ts
// backend/src/server.ts  — add BEFORE rate limiters (line ~132)
app.get('/api/healthz', (_req, res) => {
  res.json({ status: 'ok', service: 'forum-excellence-api', ts: new Date().toISOString() });
});
```

#### P0.2 — Rename student health route mount

```ts
// backend/src/server.ts  — change line 156
// FROM:
app.use('/api/health', healthRoutes);
// TO:
app.use('/api/health-records', healthRoutes);
```

#### P0.3 — Remove duplicate homepage mount

```ts
// backend/src/server.ts  — REMOVE line 150:
// app.use('/api/admin/homepage', homepageRoutes);   ← delete this line
```

#### P0.4 — Update `render.yaml` health path

```yaml
# render.yaml line 17 — change to:
    healthCheckPath: /api/healthz
```

#### P0.5 — Update any frontend calls from `/api/health` to `/api/health-records`

Search: `grep -r "/api/health" app/src` — update all hits to `/api/health-records`.

**Done gate:** `curl https://<render-url>/api/healthz` returns `200` without `Authorization` header.

---

### Phase P1 — Schema Migration (~2 hours)

**Objective:** Apply primary-aligned schema; keep legacy models ignored.

#### P1.1 — Edit `backend/prisma/schema.prisma`

Apply all additions from Section 4 above:
1. Add `GradeLevel`, replace `Class`, add `ClassAssignment`, `ClassSubjectAssignment`.
2. Add `PrimaryGrade`, `PrimaryReportCard`, `ScheduleRequest`, `Report`.
3. Add `@@ignore` to `Department`, `Program`, `Course`, `Enrollment`, `Grade`, `ReportCard`, `Schedule`.
4. Add `expiresAt DateTime?` to `UserSession`.
5. Replace `SecretRotationAudit` columns.
6. Add all new enums.
7. Add back-relations to `Student`, `Teacher`, `AcademicYear`, `Trimester`, `Subject`.

#### P1.2 — Generate and apply migration

```powershell
# Run from backend/
npx prisma migrate dev --name "primary_schema_v2"
npx prisma generate
```

#### P1.3 — Verify

```powershell
npx prisma studio   # inspect GradeLevel, Class, ClassAssignment tables exist and are empty
```

**Done gate:** `npx prisma migrate status` shows all migrations applied; `npx prisma validate` passes.

---

### Phase P2 — Seed Primary Data (~1 hour)

**Objective:** Seed admin (from env), grade levels CI→CM2, academic year 2025-2026, 3 trimesters.

#### P2.1 — Create `backend/prisma/seed.ts`

```ts
// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── Admin user (credentials from env, never hardcoded) ──────────────
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@forum-excellence.sn';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeOnFirstLogin!2025';
  const hashed = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashed,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'Principal',
      isActive: true,
      mustChangePassword: true,
      admin: {
        create: {
          employeeId: 'ADM-001',
          hireDate: new Date('2024-09-01'),
        },
      },
    },
  });
  console.log('✅ Admin user seeded');

  // ── Grade Levels CI → CM2 ────────────────────────────────────────────
  const gradeLevels = [
    { code: 'CI',  label: 'Cours Initiation',    sequenceOrder: 1 },
    { code: 'CP',  label: 'Cours Préparatoire',  sequenceOrder: 2 },
    { code: 'CE1', label: 'Cours Élémentaire 1', sequenceOrder: 3 },
    { code: 'CE2', label: 'Cours Élémentaire 2', sequenceOrder: 4 },
    { code: 'CM1', label: 'Cours Moyen 1',       sequenceOrder: 5 },
    { code: 'CM2', label: 'Cours Moyen 2',       sequenceOrder: 6 },
  ];

  for (const gl of gradeLevels) {
    await prisma.gradeLevel.upsert({
      where: { code: gl.code },
      update: { label: gl.label, sequenceOrder: gl.sequenceOrder },
      create: { ...gl, isActive: true },
    });
  }
  console.log('✅ Grade levels seeded (CI → CM2)');

  // ── Academic Year 2025-2026 ──────────────────────────────────────────
  let academicYear = await prisma.academicYear.findFirst({
    where: { year: '2025-2026' },
  });

  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        year: '2025-2026',
        startDate: new Date('2025-10-01'),
        endDate: new Date('2026-07-15'),
        isActive: true,
      },
    });
    console.log('✅ Academic year 2025-2026 seeded');
  }

  // ── Trimesters ───────────────────────────────────────────────────────
  const trimesters = [
    { name: 'Trimestre 1', startDate: new Date('2025-10-01'), endDate: new Date('2025-12-20'), isActive: false },
    { name: 'Trimestre 2', startDate: new Date('2026-01-06'), endDate: new Date('2026-03-28'), isActive: true  },
    { name: 'Trimestre 3', startDate: new Date('2026-04-13'), endDate: new Date('2026-07-15'), isActive: false },
  ];

  for (const t of trimesters) {
    const exists = await prisma.trimester.findFirst({
      where: { academicYearId: academicYear.id, name: t.name },
    });
    if (!exists) {
      await prisma.trimester.create({
        data: { ...t, academicYearId: academicYear.id },
      });
    }
  }
  console.log('✅ Trimesters seeded');

  // ── Core subjects (primary curriculum) ──────────────────────────────
  const subjects = [
    { code: 'MATH', name: 'Mathématiques' },
    { code: 'FR',   name: 'Français' },
    { code: 'EVE',  name: 'Éveil (Sciences)' },
    { code: 'HG',   name: 'Histoire-Géographie' },
    { code: 'EPS',  name: 'Éducation Physique et Sportive' },
    { code: 'ART',  name: 'Éducation Artistique' },
    { code: 'ANG',  name: 'Anglais' },
    { code: 'ICT',  name: 'Informatique' },
    { code: 'ISL',  name: 'Islam / Éducation Morale' },
  ];

  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: { ...s, isActive: true },
    });
  }
  console.log('✅ Core subjects seeded');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

#### P2.2 — Wire seed in `backend/package.json`

```json
// backend/package.json — add to "scripts":
"seed": "ts-node prisma/seed.ts"
```

#### P2.3 — Run seed

```powershell
# From backend/
$env:SEED_ADMIN_EMAIL="admin@forum-excellence.sn"
$env:SEED_ADMIN_PASSWORD="ChangeMeOnFirstLogin!2025"
npm run seed
```

**Done gate:** `npx prisma studio` shows 6 `GradeLevel` rows, 1 `AcademicYear`, 3 `Trimester` rows, 9 `Subject` rows, 1 `User` with role ADMIN.

---

### Phase P3 — Persistence Migration (~3 hours)

**Objective:** Move all remaining in-memory/JSON sources to Prisma.

#### P3.1 — Subject assignments → `ClassSubjectAssignment`

Replace the JSON store in `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/routes/subjects.ts:35`:

- Remove `loadJsonStore` / `saveJsonStore` calls for `subject-assignments.json`.
- Replace `router.post('/:subjectId/assign')` body to `prisma.classSubjectAssignment.upsert(...)`.
- Replace `router.get('/teacher/assignments')` to query `prisma.classSubjectAssignment.findMany({ where: { teacherId: teacher.id } })`.
- Add `router.delete('/:subjectId/assign/:assignmentId')` for cleanup.

#### P3.2 — Reports → `Report` model

Replace `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/routes/reports.ts:20`:

- Remove `loadJsonStore` / `saveJsonStore` calls.
- Replace all route handlers to use `prisma.report.create/findMany/update/delete`.

#### P3.3 — Schedule requests → `ScheduleRequest` model

Replace in `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/controllers/scheduleController.ts:27`:

```ts
// REMOVE:
const pendingScheduleRequests: PendingScheduleRequest[] = [];

// All reads/writes of pendingScheduleRequests → prisma.scheduleRequest.*
```

Key operations to rewrite:
- `createSchedule` (teacher path) → `prisma.scheduleRequest.create({ data: { status: 'PENDING', ... } })`
- `listScheduleRequests` → `prisma.scheduleRequest.findMany({ where: { status: 'PENDING' } })`
- `reviewScheduleRequest` → `prisma.scheduleRequest.update({ where: { id }, data: { status, reviewedById, reviewedAt } })`

#### P3.4 — Homepage & pages CMS → `CmsContent` (optional, low priority)

Keep JSON file store for homepage/pages for now (single-host Render is acceptable). Plan a `CmsContent` table if multi-replica is needed later. **Do not block P3 on this.**

**Done gate:** Restart the backend — all schedule requests, subject assignments, and reports survive the restart.

---

### Phase P4 — Controller Alignment (~3 hours)

**Objective:** Replace university-era query patterns in controllers with primary patterns.

#### P4.1 — `gradesController.ts` → rewrite for `PrimaryGrade`

Key changes needed:
- `getStudentGrades`: query `prisma.primaryGrade` filtered by `studentId`; group by `subjectId`; compute average `/20`.
- `createGrade`: validate via `ClassSubjectAssignment` (not `Enrollment`); write to `PrimaryGrade`.
- `calculateGPA`: rename to `calculateAverage`; return trimester average on 0..20 scale; remove letter-grade logic.
- Remove `courseId`, `credits`, `finalGrade`, `letterGrade` from all responses.
- `getCourseGrades` → rename to `getClassGrades`; query `PrimaryGrade` for a `classId`.

#### P4.2 — `homeworkController.ts` → resolve students via `ClassAssignment`

In `createHomework`, replace course enrollment lookup:

```ts
// REPLACE prisma.course.findUnique({ enrollments: ... })
// WITH:
const classAssignments = await prisma.classAssignment.findMany({
  where: { classId: homework.classId, isActive: true },
  include: {
    student: {
      select: {
        userId: true,
        user: { select: { firstName: true, lastName: true } },
        parentStudents: { include: { parent: { select: { userId: true } } } },
      },
    },
  },
});
```

Add `classId` field to `Homework` model (FK to `Class`).

#### P4.3 — `scheduleController.ts` → query `ClassSubjectAssignment`

- `getStudentSchedule`: derive schedule from `ClassSubjectAssignment` for the student's current `ClassAssignment`.
- `getTeacherSchedule`: query `ClassSubjectAssignment.where({ teacherId })`.
- Remove `semester`/`year` query params (use `academicYearId` + active `Trimester`).

**Done gate:** All 4 role dashboards load data without 500 errors on a DB with seeded data.

---

### Phase P5 — Security Hardening (~1.5 hours)

**Objective:** Close remaining security gaps verified in Section 3.

#### P5.1 — `create-admin.js` — remove hardcoded credentials

```js
// backend/scripts/create-admin.js  — replace lines 7-9:
const email = process.env.ADMIN_EMAIL;
const tempPassword = process.env.ADMIN_PASSWORD;
if (!email || !tempPassword) {
  console.error('❌ Set ADMIN_EMAIL and ADMIN_PASSWORD env vars');
  process.exit(1);
}
```

#### P5.2 — `UserSession.expiresAt` enforcement

In `@c:/Users/DELL/Downloads/OKComputer_College Management System Architecture/backend/src/middleware/auth.ts`, after loading the session:

```ts
if (session.expiresAt && session.expiresAt < new Date()) {
  return res.status(401).json({ success: false, error: 'Session expirée', code: 'SESSION_EXPIRED' });
}
```

Set `expiresAt` at session creation: `expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)` (7 days, matching refresh TTL).

#### P5.3 — `SecretRotationAudit` migration

The migration from Section 4.3 already drops the raw secret columns. Verify the `securityController.ts` writes only fingerprints:

```ts
// In securityController.ts, when writing rotation audit:
import crypto from 'crypto';
const fingerprint = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

await prisma.secretRotationAudit.create({
  data: {
    rotationCount: ...,
    accessSecretFingerprint: fingerprint(newAccessSecret),
    refreshSecretFingerprint: fingerprint(newRefreshSecret),
    reason: 'manual_rotation',
    rotatedBy: req.user?.email,
  },
});
```

#### P5.4 — Rate limiter health path exclusion

Ensure the `apiRateLimiter` skips `/api/healthz`:

```ts
// backend/src/middleware/rateLimiter.ts — add skip to apiRateLimiter config:
skip: (req) => req.path === '/healthz',
```

**Done gate:** Security smoke tests: expired session → 401, `/api/healthz` not rate-limited, secret audit rows have no raw secret values.

---

### Phase P6 — Frontend Alignment (~2 hours)

**Objective:** Remove university-era UI and align with primary routes.

#### P6.1 — Update all `/api/health` calls to `/api/health-records`

```powershell
grep -r "api/health" app/src --include="*.ts" --include="*.tsx" -l
# Edit each file found
```

#### P6.2 — Remove or stub college-era admin pages

Pages to remove routing for (keep files, just deactivate routes):
- `app/src/pages/admin/AdminCourses.tsx`
- `app/src/pages/admin/AdminPrograms.tsx`
- Any `Department` management pages

In `app/src/App.tsx`, comment out their `<Route>` entries.

#### P6.3 — Grade display components

- Replace any component using `finalGrade` (letter) or `gpa` with `average` (decimal /20).
- Replace `semester`/`year` filter params with `trimesterId` dropdown populated from `/api/academic-years`.

#### P6.4 — Class/student enrollment UI

- Admin: create class → requires `gradeLevelId` + `academicYearId`.
- Admin: assign student to class → `POST /api/classes/:classId/students` body `{ studentId }`.
- Teacher: view class roster → `GET /api/classes/:classId/students`.

**Done gate:** All 4 dashboards navigate without routing errors, grades show `/20` scale, no 404s on removed routes.

---

## 6. Deploy Runbook

### 6.1 Environment variables required

#### Backend (Render web service / Docker)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string from Render DB |
| `REDIS_URL` | ✅ | Redis connection string for rate limiters |
| `JWT_SECRET` | ✅ | Min 32 chars, unique |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars, different from `JWT_SECRET` |
| `JWT_EXPIRES_IN` | ✅ | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | `7d` |
| `FRONTEND_URL` | ✅ | Vercel app URL (e.g. `https://forum-excellence.vercel.app`) |
| `NODE_ENV` | ✅ | `production` |
| `PORT` | optional | defaults to `5000` |
| `SEED_ADMIN_EMAIL` | deploy-time | Used by `npm run seed` only |
| `SEED_ADMIN_PASSWORD` | deploy-time | Used by `npm run seed` only, set `mustChangePassword: true` |
| `PERSISTENCE_DIR` | optional | Overrides `~/.okcomputer-cms-data` for JSON stores |

Generate secrets:
```powershell
# PowerShell — generate 2 distinct 64-char secrets
[System.Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))
```

#### Frontend (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_API_BASE_URL` | ✅ | Backend URL, e.g. `https://forum-excellence-api.onrender.com` |

---

### 6.2 Render deploy (primary path)

`render.yaml` is already in repo root. After applying Section 5 fixes:

```yaml
# render.yaml — final state
databases:
  - name: forum-excellence-db
    databaseName: forum_excellence
    user: forum_user

services:
  - type: redis
    name: forum-excellence-redis
    ipAllowList: []

  - type: web
    name: forum-excellence-api
    env: node
    rootDir: backend
    buildCommand: npm ci && npx prisma generate && npm run build
    startCommand: npx prisma migrate deploy && node dist/server.js
    healthCheckPath: /api/healthz          # ← FIXED (was /api/health)
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: forum-excellence-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: forum-excellence-redis
          property: connectionString
      - key: FRONTEND_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: JWT_EXPIRES_IN
        value: 15m
      - key: JWT_REFRESH_EXPIRES_IN
        value: 7d

  - type: web
    name: forum-excellence-frontend
    runtime: static
    rootDir: app
    buildCommand: npm ci && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_BASE_URL
        sync: false
```

**First deploy sequence:**
```
1. Push to main branch → Render auto-deploys
2. Wait for DB service to be healthy
3. Backend build: npm ci → prisma generate → tsc
4. Backend start: prisma migrate deploy → node dist/server.js
5. Health probe hits /api/healthz → 200 → service marked healthy
6. Run seed (one-time, from Render shell or local with prod DATABASE_URL):
   SEED_ADMIN_EMAIL=admin@forum-excellence.sn \
   SEED_ADMIN_PASSWORD=<strong-temp-password> \
   npm run seed
7. Login with seeded admin, change password
```

**Subsequent deploys:** push to main → auto-redeploy. `prisma migrate deploy` is idempotent.

---

### 6.3 Docker local / self-hosted

```powershell
# From repo root
# Create backend/.env with all env vars (see 6.1)

# Start all services
docker-compose up --build -d

# First-time seed
docker-compose exec backend sh -c "SEED_ADMIN_EMAIL=admin@forum-excellence.sn SEED_ADMIN_PASSWORD=<pw> node -r ts-node/register prisma/seed.ts"

# Tail logs
docker-compose logs -f backend
```

`docker-compose.yml` already includes postgres + redis + backend. To add frontend:
```yaml
# Add to docker-compose.yml services:
  frontend:
    build:
      context: ./app
      dockerfile: Dockerfile.frontend   # create this
    ports:
      - "5173:80"
    environment:
      VITE_API_BASE_URL: http://localhost:5000
```

---

### 6.4 Vercel (frontend)

`app/vercel.json` already present with SPA rewrite rule. Deploy steps:

```
1. Connect Vercel to repo, root = app/
2. Build: npm run build
3. Output: dist/
4. Set VITE_API_BASE_URL to backend URL
5. Redeploy on every push to main
```

---

### 6.5 Rollback procedure

| Scenario | Action |
|----------|--------|
| Bad migration | Run `npx prisma migrate resolve --rolled-back <migration_name>` then fix schema |
| Bad deploy (Render) | Use Render dashboard → "Redeploy" previous commit |
| Data corruption | Restore from Render managed DB backup (daily, 7-day retention default) |
| Secret compromise | Set `JWT_SECRET_PREVIOUS=<old>`, rotate `JWT_SECRET=<new>`, redeploy |

---

## 7. API Contract Summary (Primary-Aligned)

All endpoints under `/api`. Auth header: `Authorization: Bearer <accessToken>`. Refresh via cookie `refresh_token` (HttpOnly).

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | public | Login, returns access + sets refresh cookie |
| POST | `/auth/refresh` | cookie | Rotate refresh token, return new access |
| POST | `/auth/logout` | required | Revoke refresh token + session |
| GET  | `/auth/me` | required | Get current user profile |
| POST | `/auth/change-password` | required | Change password, invalidates other sessions |
| POST | `/auth/forgot-password` | public | Send reset email (PasswordResetToken) |
| POST | `/auth/reset-password` | public | Consume reset token, set new password |

### Liveness

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/healthz` | **none** | Render/K8s health probe |

### School Structure

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/academic-years` | required | List all years + trimesters |
| POST | `/academic-years` | ADMIN | Create year |
| PATCH | `/academic-years/:id/activate` | ADMIN | Set active year |
| GET | `/academic-years/:id/trimesters` | required | List trimesters for year |
| GET | `/classes` | required | List classes (filter: `?academicYearId=&gradeLevelId=`) |
| POST | `/classes` | ADMIN | Create class |
| PUT | `/classes/:id` | ADMIN | Update class |
| GET | `/classes/:id/students` | ADMIN+TEACHER | Get class roster (ClassAssignment) |
| POST | `/classes/:id/students` | ADMIN | Assign student to class |
| DELETE | `/classes/:id/students/:studentId` | ADMIN | Remove student from class |
| GET | `/subjects` | required | List subjects |
| POST | `/subjects` | ADMIN | Create subject |
| PUT | `/subjects/:id` | ADMIN | Update subject |
| POST | `/subjects/:id/assign` | ADMIN | Assign subject to class+teacher (`ClassSubjectAssignment`) |
| GET | `/subjects/teacher/assignments` | TEACHER | My subject assignments |

### Grades & Report Cards

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/grades/student/:studentId` | ADMIN+TEACHER+PARENT+STUDENT | Get student grades (filter: `?trimesterId=`) |
| GET | `/grades/class/:classId` | ADMIN+TEACHER | Get all grades for a class |
| POST | `/grades` | TEACHER+ADMIN | Create grade (`PrimaryGrade`) |
| PUT | `/grades/:id` | TEACHER+ADMIN | Update grade |
| DELETE | `/grades/:id` | ADMIN | Delete grade |
| GET | `/grades/student/:studentId/average` | all allowed | Trimester average /20 |
| GET | `/report-cards/:studentId` | allowed | Student report cards |
| POST | `/report-cards` | TEACHER+ADMIN | Generate/update report card |

### Attendance

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/attendance` | TEACHER+ADMIN | Mark attendance for a class+date |
| GET | `/attendance/class/:classId` | TEACHER+ADMIN | Class attendance (filter: `?date=&trimesterId=`) |
| GET | `/attendance/student/:studentId` | all allowed | Student attendance history |

### Homework

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/homework` | required | List (STUDENT: assigned; TEACHER: own; ADMIN: all) |
| POST | `/homework/create` | TEACHER+ADMIN | Create homework (requires `classId`) |
| POST | `/homework/:id/submit` | STUDENT | Submit homework |
| GET | `/homework/:id/submissions` | TEACHER+ADMIN | View submissions |
| PUT | `/homework/submission/:id/grade` | TEACHER+ADMIN | Grade submission |
| DELETE | `/homework/:id` | ADMIN | Delete homework |

### Communication & Social

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/messages` | required | Inbox (sent + received) |
| POST | `/messages` | required | Send message |
| PATCH | `/messages/:id/read` | required | Mark as read |
| GET | `/appointments` | required | My appointments |
| POST | `/appointments` | required | Request appointment |
| PATCH | `/appointments/:id` | required | Update status |
| GET | `/behavior/:studentId` | TEACHER+ADMIN | Behavior log |
| POST | `/behavior` | TEACHER+ADMIN | Log behavior |

### Student Welfare

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health-records/:studentId` | scoped | Student health record |
| PUT | `/health-records/:studentId` | scoped | Update health record |
| GET | `/pickup/:studentId` | TEACHER+ADMIN | Authorized pickups |
| POST | `/pickup/:studentId` | ADMIN | Add authorized pickup |
| POST | `/pickup/:studentId/log` | TEACHER+ADMIN | Log pickup event |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | ADMIN | List users (filter: `?role=`) |
| POST | `/users` | ADMIN | Create user |
| PUT | `/users/:id` | ADMIN | Update user |
| PATCH | `/users/:id/activate` | ADMIN | Activate/deactivate |
| POST | `/users/:id/reset-password` | ADMIN | Force password reset |
| GET | `/reports` | ADMIN | List reports |
| POST | `/reports` | ADMIN | Create report |
| PUT | `/reports/:id` | ADMIN | Update report |
| DELETE | `/reports/:id` | ADMIN | Delete report |
| GET | `/grade-locks` | ADMIN | List grade locks |
| POST | `/grade-locks` | ADMIN | Lock grades for a trimester |
| DELETE | `/grade-locks/:id` | ADMIN | Unlock grades |
| GET/PUT | `/settings/:section` | ADMIN | Get/update settings section |

### Schedules

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/schedules/student/:studentId` | scoped | Student weekly schedule |
| GET | `/schedules/teacher/:teacherId` | scoped | Teacher weekly schedule |
| POST | `/schedules` | TEACHER+ADMIN | Submit schedule request |
| GET | `/schedules/requests` | TEACHER+ADMIN | List pending requests |
| PATCH | `/schedules/requests/:id/review` | ADMIN | Approve/reject request |

### Public CMS

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/homepage` | none | Homepage content |
| POST | `/homepage` | ADMIN | Update homepage content |
| GET | `/pages/:page` | none | Get page content (admissions/programs/campusLife) |
| POST | `/pages/:page` | ADMIN | Update page content |

---

## 8. Go/No-Go Checklist (Primary-Only)

### Infrastructure

- [ ] `GET /api/healthz` returns `200` without auth header (P0 fix applied)
- [ ] Render health check path set to `/api/healthz` in `render.yaml`
- [ ] No duplicate route mounts (`/api/admin/homepage` removed)
- [ ] CORS `origin` set to Vercel app URL in `FRONTEND_URL` env var

### Schema & Data

- [ ] `npx prisma migrate status` — all migrations applied, none pending
- [ ] `npx prisma validate` — no schema errors
- [ ] `GradeLevel` table has exactly 6 rows: CI, CP, CE1, CE2, CM1, CM2
- [ ] `AcademicYear` has at least 1 row with `isActive = true`
- [ ] `Trimester` has 3 rows for active year
- [ ] `Subject` has at least core 9 subjects seeded
- [ ] Admin `User` exists with `role = ADMIN` and `mustChangePassword = true`
- [ ] Legacy models (`Department`, `Program`, `Course`, `Enrollment`) are `@@ignore` — not exposed via Prisma client

### Auth & Security

- [ ] Login → access token in response, refresh token in HttpOnly cookie
- [ ] Expired access token → `POST /auth/refresh` returns new access token (single attempt)
- [ ] `GET /auth/me` for PARENT user contains no nested `password` field
- [ ] `POST /auth/force-logout` with cross-user `userId` requires ADMIN role → returns `403` for non-admin
- [ ] Password change does NOT leak raw token; invalidates old sessions
- [ ] `UserSession.expiresAt` is set at creation, enforced in middleware
- [ ] `SecretRotationAudit` rows contain no raw secret values (fingerprints only)
- [ ] `create-admin.js` reads credentials from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars

### Persistence

- [ ] Backend restart → schedule requests survive (stored in `ScheduleRequest` DB table)
- [ ] Backend restart → subject-to-class assignments survive (stored in `ClassSubjectAssignment`)
- [ ] Backend restart → reports survive (stored in `Report`)
- [ ] Settings changes survive restart (already Prisma-backed ✅)

### Primary Scope Policy

- [ ] No college-era routes (`/api/courses`, `/api/programs`, `/api/departments`, `/api/enrollments`) are mounted or responding
- [ ] No middle/high school grade levels seeded or visible in UI
- [ ] Grades show on a 0..20 scale; no letter grades (A/B/C), no GPA field in student profile
- [ ] Class creation requires `gradeLevelId` restricted to CI–CM2 codes

### Role Flows (manual smoke test)

- [ ] ADMIN: login → create class CI A → assign teacher to Français in CI A → view class roster
- [ ] TEACHER: login → view assigned subjects → create homework for CI A → mark attendance
- [ ] PARENT: login → view child grades (trimestre /20) → view child attendance → send message
- [ ] STUDENT: login → view grades → view homework → submit homework → view schedule

---

## 9. Deferred (Not This Cycle)

These items are documented so they are not accidentally started:

| Item | Trigger to start |
|------|-----------------|
| Grade levels 6ème → Terminale | Separate project kick-off |
| School type selector (primary/collège/lycée) in UI | After primary is fully stable in prod for 1 term |
| Multi-school instance support | Business decision |
| SMS/push notifications | After email flow is working |
| AI-assisted report card generation | Post-MVP |
| CmsContent Prisma table | If multi-replica Render plan is adopted |
| Drop legacy university DB tables | 1 migration cycle after `@@ignore` is in prod and confirmed unused |
| Mobile app | Post-web MVP |

---

## 10. Quick-Start Commands Reference

```powershell
# ── Dev local startup ───────────────────────────────────────
# Terminal 1: Backend
cd backend
npm install
npx prisma migrate dev
npx prisma generate
npm run dev   # nodemon on port 5000 (or VITE_BACKEND_PORT)

# Terminal 2: Frontend
cd app
npm install
npm run dev   # Vite on port 5173, proxies /api → 5000

# First-time seed (local)
cd backend
$env:SEED_ADMIN_EMAIL="admin@forum-excellence.sn"
$env:SEED_ADMIN_PASSWORD="TempLocal!2025"
npm run seed

# ── Schema changes ──────────────────────────────────────────
cd backend
npx prisma migrate dev --name "describe_the_change"
npx prisma generate

# ── Production deploy check ─────────────────────────────────
npx prisma migrate deploy    # applies pending migrations (no prompt)
npx prisma migrate status    # shows applied vs pending

# ── Health probe verification ───────────────────────────────
curl https://<your-render-url>/api/healthz
# Expected: {"status":"ok","service":"forum-excellence-api","ts":"..."}

# ── Find any remaining /api/health calls in frontend ────────
grep -r "api/health" app/src --include="*.ts" --include="*.tsx"
# Expected: no results (all updated to /api/health-records)
```

---

*End of KHOUR 2.0 — Primary-Only Implementation Architecture*
*Next review: after Phase P0 + P1 are deployed and health probe is green.*
