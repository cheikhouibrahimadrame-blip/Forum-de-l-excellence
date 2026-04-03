# PRIMARY SCHOOL System - Complete Implementation Plan

**Date Created**: January 30, 2026  
**Status**: In Progress - Autonomous Execution  
**Target**: Complete PRIMARY SCHOOL Management System (CI → CM2)

---

## Overview

Transforming the current college/university system into a comprehensive PRIMARY SCHOOL management system for "Forum de L'excellence" in Mbour, Senegal.

### School Levels (Classes)
- **CI** (Cours d'Initiation) - Nursery/Pre-K
- **CP** (Cours Préparatoire) - Grade 1
- **CE1** (Cours Élémentaire 1) - Grade 2
- **CE2** (Cours Élémentaire 2) - Grade 3
- **CM1** (Cours Moyen 1) - Grade 4
- **CM2** (Cours Moyen 2) - Grade 5

### Roles
- **ADMIN**: Full system control (academic, users, CMS)
- **TEACHER**: Assigned classes, lesson upload, grade entry, timetable
- **STUDENT**: View subjects/lessons/grades/timetable (auto-detected class)
- **PARENT**: View child's progress, contact teachers, no edit rights

### Primary-Specific Notes
- A class can have a **main classroom teacher** plus **subject specialists**.
- Support **local grading scales** (e.g., 0–10 or 0–20), configured per school.
- Attendance can include **absence reasons** (parent note).
- Report cards ("bulletins") are generated **per trimester**.

---

## PROMPT 1: ADMIN Dashboard Design

### Requirements
**Academic Management:**
- Classes management (CI, CP, CE1, CE2, CM1, CM2)
- Dynamic subjects (not hardcoded - flexible per school)
- **Classroom teacher + subject specialist assignments**
- Academic years and trimesters
- Timetable management
- Grade locking per trimester (admin-configurable)
- **Report card (bulletin) generation**

**User Management:**
- Create/edit teachers, students, parents
- Link parents to students
- Assign teachers to classes
- Activate/deactivate accounts

**CMS (Public Website):**
- Edit homepage content
- Manage announcements
- Update school information

### Pages Required
1. ✅ AdminDashboard.tsx - Main overview
2. ✅ AdminUsers.tsx - User CRUD (existing)
3. ✅ AdminSettings.tsx - System settings (existing)
4. ✅ AdminMainPage.tsx - CMS homepage editor (existing)
5. 🔄 AdminClasses.tsx - NEW: Classes management
6. 🔄 AdminSubjects.tsx - NEW: Subjects management
7. 🔄 AdminAssessments.tsx - NEW: Evaluations/assessments
8. 🔄 AdminYears.tsx - NEW: Academic years/trimesters
9. 🔄 AdminTimetable.tsx - NEW: Timetable editor
10. 🔄 AdminReportCards.tsx - NEW: Bulletin generation

### Backend Requirements
- Classes CRUD API
- Subjects CRUD API
- **Assessments CRUD API (primary-style evaluations)**
- Academic years API
- Timetable API
- Teacher-Class assignment API
- Parent-Student linking API
- Report card generation API

---

## PROMPT 2: Authentication & Role-Based Access Control

### Requirements
**Authentication Flow:**
1. Admin creates account (no public registration)
2. User receives credentials (email + temp password)
3. First login → forced password change
4. JWT tokens (access 15min, refresh 7 days)
5. Role detection redirects to appropriate dashboard

**Permission System:**
- ADMIN: All pages accessible
- TEACHER: Only assigned classes visible
- STUDENT: Only own class data visible
- PARENT: Only linked children's data visible

**Security:**
- Institutional email validation
- Password policy enforcement
- Account activation/deactivation
- Session management

### Implementation Status
- ✅ JWT authentication implemented
- ✅ Forced password change on first login
- ✅ Role-based route protection (ProtectedRoute component)
- ✅ Admin-only user creation
- ✅ Account activation/deactivation
- ✅ Institutional email validation

### Enhancements Needed
- 🔄 Explain login flow in documentation
- 🔄 Document permission checks per role
- 🔄 Add role-specific data filtering logic

---

## PROMPT 3: TEACHER Dashboard Design

### Requirements
**View Restrictions:**
- See ONLY assigned classes
- Cannot view other teachers' classes
- Limited to assigned subjects

**Functionality:**
- Upload lessons (PDF, documents) per subject (optional)
- Enter grades per evaluation type
- Mark attendance
- View class timetable
- Contact students/parents
- View student files (dossiers)

**Data Filtering:**
- Backend filters by teacherId
- Frontend shows only relevant classes

### Pages Required
1. ✅ TeacherDashboard.tsx - Overview
2. ✅ TeacherClasses.tsx - Assigned classes (existing, functional)
3. ✅ TeacherStudents.tsx - Class students (existing, functional)
4. ✅ TeacherGrades.tsx - Grade entry (existing, functional)
5. ✅ TeacherSchedule.tsx - Timetable view (existing)
6. 🔄 TeacherLessons.tsx - NEW: Upload/manage lessons (optional)
7. 🔄 TeacherAttendance.tsx - NEW: Attendance marking
8. 🔄 TeacherObservations.tsx - NEW: Behavior/observations (lightweight)

### Backend Requirements
- Filter classes by teacherId
- Lessons upload/storage API (optional)
- Attendance CRUD API (with absence reason)
- Grade validation per trimester
- Behavior/observations API (optional)

---

## PROMPT 4: STUDENT Dashboard Design

### Requirements
**Auto-Detection:**
- System auto-detects student's class (CI/CP/CE1/CE2/CM1/CM2)
- Shows subjects for that class
- Displays lessons and grades
- Shows class timetable

**View-Only Interface:**
- Cannot edit anything
- Child-friendly UI
- Simple navigation

**Data Display:**
- My subjects
- My lessons (downloadable)
- My grades (by trimester)
- My timetable
- My teachers
- Announcements

### Pages Required
1. ✅ StudentDashboard.tsx - Overview (existing)
2. ✅ StudentGrades.tsx - View grades (existing)
3. ✅ StudentSchedule.tsx - Timetable (existing)
4. 🔄 StudentLessons.tsx - NEW: View/download lessons (optional)
5. 🔄 StudentSubjects.tsx - NEW: View subjects
6. 🔄 StudentTeachers.tsx - NEW: View teachers

### Backend Logic
- Determine class from Student model
- Fetch subjects assigned to that class
- Fetch lessons for those subjects
- Fetch grades filtered by studentId
- Fetch timetable for class

---

## PROMPT 5: PARENT Dashboard Design

### Requirements
**Multi-Child Support:**
- Parent can be linked to multiple students
- Switch between children
- View each child's data separately

**View-Only Access:**
- Cannot edit grades
- Cannot edit timetables
- Can only view and contact

**Functionality:**
- View child's grades
- View child's progress
- View announcements
- Contact teachers
- Request parent-teacher meetings (optional)
- View child's timetable
- View child's attendance (with absence reason)

### Pages Required
1. ✅ ParentDashboard.tsx - Overview (existing)
2. ✅ ParentChildren.tsx - Select child (existing, functional)
3. ✅ ParentGrades.tsx - Child's grades (existing)
4. ✅ ParentSchedule.tsx - Child's timetable (existing)
5. ✅ ParentAppointments.tsx - Meetings (existing)
6. 🔄 ParentAttendance.tsx - NEW: View child's attendance

### Backend Logic
- ParentStudent linking table
- Filter data by linked studentIds
- Prevent editing operations
- Allow read-only access

---

## PROMPT 6: Database Schema Design

### Requirements
**Scalability:**
- Support different schools
- Dynamic subjects (not hardcoded)
- Flexible class structure
- Multi-year support

**Core Models:**
1. **Classes** (CI, CP, CE1, CE2, CM1, CM2)
   - id, name, level, academicYearId, capacity, mainTeacherId

2. **Subjects** (Dynamic)
   - id, name, code, description
   - NOT hardcoded - created by admin

3. **ClassSubjects** (Many-to-many)
   - classId, subjectId, teacherId
   - Links subjects to classes with assigned teacher

4. **AcademicYears**
   - id, year (2025-2026), isActive, startDate, endDate

5. **Trimesters**
   - id, academicYearId, name (Trimestre 1/2/3), startDate, endDate

6. **Assessments**
   - id, subjectId, classId, name, type (Devoir/Contrôle/Examen), dueDate, trimesterId

7. **Lessons** (Optional)
   - id, subjectId, classId, teacherId, title, fileUrl, uploadDate, trimesterId

8. **Grades**
   - id, studentId, assessmentId, score, coefficient, comments, locked

9. **Timetable** (Schedule)
   - id, classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room

10. **Attendance**
    - id, studentId, classId, date, status (Present/Absent/Late), reason, comments

11. **StudentClasses** (Enrollment)
    - studentId, classId, academicYearId

12. **ParentStudent** (Existing)
    - parentId, studentId, relationship

13. **Announcements**
    - id, title, content, targetRole, publishDate, expiryDate

14. **CMSPages** (Public website)
    - id, pageName, content (JSON), updatedBy, updatedAt

15. **ReportCards**
    - id, studentId, trimesterId, generatedAt, fileUrl

16. **Observations** (Optional)
    - id, studentId, classId, teacherId, trimesterId, notes

17. **StudentHealthNotes** (Optional)
    - id, studentId, allergies, emergencyContact, notes

### Schema Modifications Needed
🔄 Add new models to schema.prisma:
- Classes
- Subjects
- ClassSubjects
- AcademicYears
- Trimesters
- Assessments
- Lessons
- Attendance
- Announcements
- CMSPages
- ReportCards
- Observations
- StudentHealthNotes

🔄 Modify existing models:
- Remove Program, Department models (college-specific)
- Simplify Course model or replace with ClassSubjects
- Update Grade model to link to Assessments
- Add trimesterId to relevant models

---

## Implementation Status

### Completed ✅
- User authentication (JWT)
- Forced password change on first login
- Admin user management
- Role-based route protection
- Teacher: View classes, students, grades
- Parent: View children, grades, schedules
- Student: View grades, schedule
- CMS homepage editor

### In Progress 🔄
- Admin: Classes management
- Admin: Subjects management
- Admin: Assessments management
- Admin: Academic years/trimesters
- Admin: Timetable editor
- Admin: Report cards
- Teacher: Lessons upload (optional)
- Teacher: Attendance marking
- Teacher: Observations
- Student: Lessons view (optional)
- Parent: Attendance view
- Database schema migration

### Next Steps
1. Create new admin pages (Classes, Subjects, Assessments, Years, Timetable, Report Cards)
2. Update database schema (add primary school models)
3. Create backend APIs for new models
4. Update teacher pages (Lessons, Attendance, Observations)
5. Update student pages (Lessons, Subjects)
6. Update parent pages (Attendance)
7. Test complete workflow
8. Document system architecture

---

## Design Principles

1. **Simplicity**: Child-friendly interfaces for students
2. **Security**: Role-based access strictly enforced
3. **Flexibility**: Dynamic subjects, not hardcoded
4. **Scalability**: Support multiple academic years
5. **Traceability**: All actions logged
6. **Offline-ready**: Cache data for offline access (future)

---

**Last Updated**: February 3, 2026  
**Next Update**: After PROMPT 1 completion
