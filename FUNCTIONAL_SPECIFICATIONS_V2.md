# Functional Specifications v2

Version: 1.0
Date: 2026-04-22
Status: Approved for implementation

## 1. Scope
This document defines the functional behavior for:
- Role-based permissions
- Announcement and notification delivery
- Timetable approval workflow
- Homework publication workflow

It is intended as implementation-ready requirements for backend, frontend, and QA.

## 2. Roles and Permissions

### 2.1 Teacher (Professeur)
- Can edit general class information.
- Cannot edit class level (Niveau) or semester.
- Can view detailed individual grades only for subjects they teach.
- Can view aggregated class average for the whole class.
- In Mes Classes > Voir les Notes, default view must display class-level general notes only (aggregated statistics, trends, averages), not student-by-student detail.

### 2.2 Admin
- Reviews and approves/rejects timetable changes.
- Acts as conflict-prevention gatekeeper for schedule modifications.

### 2.3 Authorization Rules
- Every protected endpoint must enforce role checks server-side.
- UI restrictions are required for usability but do not replace API authorization.

## 3. Announcement and Notification System

### 3.1 Data Relationship
- Parent has one-to-many relationship with Student.
- Student belongs to a Class.

### 3.2 Class Announcement Delivery
When an announcement targets a class:
1. Resolve all students in the class.
2. Resolve all linked parents for each student.
3. Create notifications for:
- Students in target class
- Linked parent accounts

### 3.3 Parent Dashboard UX
- Provide a centralized Notification Center feed.
- Each notification item must include child-aware context:
  - Child name
  - Class label
  - Example format: "CI A Update: Important message regarding Modou"

### 3.4 Student Dashboard UX
- Standard notification bell with unread badge/count.
- No blocking popup for normal announcements.
- Blocking/large popup only for critical account-level alerts.

## 4. Timetable Management (Emploi du Temps)

### 4.1 Lifecycle States
- PENDING_APPROVAL
- REJECTED
- PUBLISHED

### 4.2 Workflow
1. Teacher creates new course (Ajouter / Nouveau Cours).
2. Record is saved as PENDING_APPROVAL.
3. Entry is hidden from students until approval.
4. Admin receives a pending-review alert.
5. Admin decision:
- Reject -> status = REJECTED, teacher notified.
- Approve -> status = PUBLISHED.
6. On PUBLISHED:
- Student timetables are updated.
- Standard notification is sent to impacted students.

### 4.3 Validation Rules
- Conflict checks are mandatory before publication.
- Reject action requires a reason (stored and shown to teacher).

## 5. Homework Management (Devoirs)

### 5.1 Workflow
1. Teacher creates a new homework item.
2. On create, status is immediately PUBLISHED.
3. No admin approval is required.
4. Notifications are sent immediately to:
- Target students
- Linked parents

### 5.2 Visibility
- Students see homework in class context.
- Parents see homework notifications in Notification Center.

## 5.3 Teacher Notes View (Mes Classes)
- The Voir les Notes action in Mes Classes must open a class summary notes view.
- This view is general and aggregated at class level.
- It must not expose individual student note details in this entry point.
- If individual detail is needed, it must be accessed from subject-scoped grade management screens with teacher-subject authorization checks.

## 6. Event and Notification Standards
- Every user-facing event must create a normalized notification record.
- Required notification fields:
  - recipientUserId
  - actorUserId (optional for system events)
  - eventType
  - entityType
  - entityId
  - message
  - isRead
  - createdAt
- Unread count must be queryable per user.

## 7. API-Level Requirements

### 7.1 Timetable
- POST timetable entry -> create with PENDING_APPROVAL (teacher only).
- PATCH review endpoint (admin only) -> transitions to REJECTED or PUBLISHED.
- Students can only read PUBLISHED entries.

### 7.2 Announcements
- POST class announcement -> fan-out notifications to students and linked parents.

### 7.3 Homework
- POST homework -> immediate PUBLISHED + student/parent notifications.

## 8. Audit and Traceability
- Log all status transitions with actor, timestamp, previous state, next state.
- Log notification fan-out count for operational verification.

## 9. Acceptance Criteria

### AC-1 Roles
- Teacher cannot modify Niveau or semester via API or UI.
- Teacher grade detail is limited to assigned subjects.
- In Mes Classes > Voir les Notes, teacher sees only class-general aggregated notes.

### AC-2 Announcements
- Class announcement appears in parent Notification Center with child context.
- Student receives bell notification and unread count increments.

### AC-3 Timetable Approval
- Newly created timetable entry is not visible to students before admin approval.
- Approval publishes entry and triggers notifications.
- Rejection informs teacher and includes reason.

### AC-4 Homework
- New homework is immediately visible to relevant students.
- Parent and student notifications are created without admin action.

### AC-5 Security
- Unauthorized role attempts return 403.
- All transitions are audit-logged.

## 10. Out of Scope (for this phase)
- Offline notifications (email/SMS/push gateway specifics)
- Multi-school tenancy behavior beyond current schema
- Parent preference-based notification filtering
