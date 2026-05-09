/**
 * Single source-of-truth for backend API paths.
 * Import from here instead of hardcoding strings in components.
 * Keep in sync with backend/src/server.ts route mounts.
 */

export const API = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_ME: '/api/auth/me',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_CHANGE_PASSWORD: '/api/auth/change-password',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/auth/reset-password',
  AUTH_LOGOUT: '/api/auth/logout',

  // Users
  USERS: '/api/users',
  USER: (id: string) => `/api/users/${id}`,
  USER_ACTIVATE: (id: string) => `/api/users/${id}/activate`,
  USER_DEACTIVATE: (id: string) => `/api/users/${id}/deactivate`,
  USER_RESET_PASSWORD: (id: string) => `/api/users/${id}/reset-password`,

  // Subjects
  SUBJECTS: '/api/subjects',
  SUBJECT: (id: string) => `/api/subjects/${id}`,
  SUBJECT_ASSIGN: (id: string) => `/api/subjects/${id}/assign`,
  SUBJECTS_TEACHER_ASSIGNMENTS: '/api/subjects/teacher/assignments',

  // Courses (used by the admin schedule creation form)
  COURSES: '/api/courses',

  // Classes
  CLASSES: '/api/classes',
  CLASS: (id: string) => `/api/classes/${id}`,
  CLASS_ANNOUNCE: (id: string) => `/api/classes/${id}/announce`,
  CLASS_NOTES_SUMMARY: (id: string) => `/api/classes/${id}/notes-summary`,
  CLASS_ASSIGN_STUDENTS: (id: string) => `/api/classes/${id}/students/assign`,
  CLASSES_TEACHER_STUDENTS: '/api/classes/teacher/students',

  // Grades
  GRADES: '/api/grades',
  GRADES_BY_COURSE: (courseId: string) => `/api/grades/course/${courseId}`,
  GRADES_BY_STUDENT: (studentId: string) => `/api/grades/student/${studentId}`,

  // Schedules
  SCHEDULES: '/api/schedules',
  SCHEDULES_SUMMARY: '/api/schedules/summary',
  SCHEDULES_REQUESTS: '/api/schedules/requests',
  SCHEDULES_REQUEST_REVIEW: (id: string) => `/api/schedules/requests/${id}/review`,
  SCHEDULES_TEACHER: (teacherId: string) => `/api/schedules/teacher/${teacherId}`,
  SCHEDULES_STUDENT: (studentId: string) => `/api/schedules/student/${studentId}`,

  // Appointments
  APPOINTMENTS: '/api/appointments',
  APPOINTMENT: (id: string) => `/api/appointments/${id}`,

  // Settings
  SETTINGS: '/api/settings',
  SETTINGS_BRANDING: '/api/settings/branding',
  SETTINGS_SECURITY: '/api/settings/security',
  SETTINGS_GENERAL: '/api/settings/general',
  SETTINGS_NOTIFICATIONS: '/api/settings/notifications',
  SETTINGS_APPEARANCE: '/api/settings/appearance',
  SETTINGS_DATABASE: '/api/settings/database',
  SETTINGS_EMAIL: '/api/settings/email',

  // Homepage / CMS
  HOMEPAGE: '/api/homepage',
  ADMIN_HOMEPAGE: '/api/admin/homepage',
  PAGES: (slug: string) => `/api/pages/${slug}`,

  // Uploads
  UPLOADS: '/api/uploads',
  UPLOADS_CAMPUS_LIFE: '/api/uploads/campus-life',

  // Parent-Students
  PARENT_STUDENTS: '/api/parent-students',
  PARENT_STUDENTS_ALL: '/api/parent-students/all',
  PARENT_STUDENTS_MY: '/api/parent-students/my-students',

  // Attendance
  ATTENDANCE: '/api/attendance',
  ATTENDANCE_MARK: '/api/attendance/mark',
  ATTENDANCE_BY_CLASS: (classId: string) => `/api/attendance/class/${classId}`,
  ATTENDANCE_STUDENT: (studentId: string) => `/api/attendance/student/${studentId}`,
  ATTENDANCE_RECORD: (id: string) => `/api/attendance/${id}`,

  // Teacher attendance (admin HR-style presence tracking)
  TEACHER_ATTENDANCE_MARK: '/api/teacher-attendance/mark',
  TEACHER_ATTENDANCE_BY_TEACHER: (teacherId: string) => `/api/teacher-attendance/teacher/${teacherId}`,
  TEACHER_ATTENDANCE_RECORD: (id: string) => `/api/teacher-attendance/${id}`,

  // Messages
  MESSAGES: (type: string) => `/api/messages/${type}`,
  MESSAGES_UNREAD_COUNT: '/api/messages/unread/count',
  MESSAGE_READ: (id: string) => `/api/messages/${id}/read`,

  // Behavior
  BEHAVIOR_REPORT: '/api/behavior/report',
  BEHAVIOR_LOG: '/api/behavior/log',
  BEHAVIOR_ITEM: (id: string) => `/api/behavior/${id}`,
  BEHAVIOR_STUDENT: (studentId: string) => `/api/behavior/student/${studentId}`,

  // Homework
  HOMEWORK: '/api/homework',
  HOMEWORK_CREATE: '/api/homework/create',
  HOMEWORK_ITEM: (id: string) => `/api/homework/${id}`,
  HOMEWORK_SUBMIT: (id: string) => `/api/homework/${id}/submit`,

  // Health
  HEALTH: '/api/health',
  HEALTH_RECORD: (id: string) => `/api/health/${id}`,

  // Pickup
  PICKUP: '/api/pickup',
  PICKUP_BY_STUDENT: (studentId: string) => `/api/pickup/${studentId}`,
  PICKUP_AUTHORIZED: '/api/pickup/authorized',
  PICKUP_AUTHORIZED_ADD: '/api/pickup/authorized/add',
  PICKUP_AUTHORIZED_ITEM: (id: string) => `/api/pickup/authorized/${id}`,
  PICKUP_LOGS_HISTORY: '/api/pickup/logs/history',

  // Academic Years
  ACADEMIC_YEARS: '/api/academic-years',
  ACADEMIC_YEAR: (id: string) => `/api/academic-years/${id}`,

  // Reports
  REPORTS: '/api/reports',
  REPORT: (id: string) => `/api/reports/${id}`,

  // Grade Locks
  GRADE_LOCKS: '/api/grade-locks',
  GRADE_LOCKS_SUMMARY: '/api/grade-locks/summary',
  GRADE_LOCKS_LOCK: '/api/grade-locks/lock',

  // Admin Security
  ADMIN_SECURITY: '/api/admin/security',

  // Report Cards (persisted bulletin drafts)
  REPORT_CARDS: '/api/report-cards',
} as const;
