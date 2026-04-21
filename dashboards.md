# Dashboard Design Brief

## Objectif
Ce document centralise toutes les informations nécessaires pour un designer qui intervient sur les dashboards de la plateforme Forum de L'excellence.

## Portée
- Espace public: hors périmètre de ce document
- Espace authentifié dashboard: dans le périmètre
- Rôles dashboard couverts: ADMIN, PARENT, STUDENT, TEACHER

## Architecture Dashboard
- Routing principal: app/src/App.tsx
- Layout dashboard partagé: app/src/components/layout/DashboardLayout.tsx
- Protection des routes: composant ProtectedRoute (contrôle rôle + session)
- Chargement pages dashboard: lazy loading (code splitting)

## Routes Dashboard par rôle

### Student
- /student
- /student/grades
- /student/schedule
- /student/appointments
- /student/homework
- /student/messages
- /student/behavior
- /student/report-cards
- /student/lessons
- /student/subjects

### Parent
- /parent
- /parent/children
- /parent/grades
- /parent/schedule
- /parent/appointments
- /parent/attendance
- /parent/homework
- /parent/messages
- /parent/behavior
- /parent/health
- /parent/pickup

### Teacher
- /teacher
- /teacher/classes
- /teacher/students
- /teacher/grades
- /teacher/lessons
- /teacher/attendance
- /teacher/schedule
- /teacher/homework
- /teacher/messages
- /teacher/behavior

### Admin
- /admin
- /admin/users
- /admin/classes
- /admin/subjects
- /admin/years
- /admin/programs
- /admin/courses
- /admin/reports
- /admin/mainpage
- /admin/content/admissions
- /admin/content/programs
- /admin/content/campuslife
- /admin/settings
- /admin/parents-students
- /admin/schedules
- /admin/grade-locks
- /admin/appointments
- /admin/attendance
- /admin/health
- /admin/behavior
- /admin/pickup

## Navigation Dashboard (sidebar)

### Student navigation
- Tableau de bord
- Mes Notes
- Mon Emploi du Temps
- Mes Devoirs
- Mes Messages
- Mon Comportement
- Mes Rendez-vous
- Mes Bulletins

### Parent navigation
- Tableau de bord
- Mes Enfants
- Présence
- Devoirs
- Messages
- Comportement
- Santé
- Personnes Autorisées
- Notes
- Emplois du Temps
- Rendez-vous

### Teacher navigation
- Tableau de bord
- Mes Classes
- Mes Élèves
- Présence
- Devoirs
- Messages
- Comportement
- Gestion des Notes
- Mon Emploi du Temps

### Admin navigation
- Tableau de bord
- Utilisateurs
- Classes
- Matières
- Années et Trimestres
- Emplois du temps
- Verrous de notes
- Parents et Élèves
- Rendez-vous
- Présence
- Comportement
- Santé
- Ramassage
- Page Accueil
- Paramètres

## Inventaire complet des fichiers Dashboard (52)

### Admin (21)
- app/src/pages/dashboard/admin/AdminAdmissionsContent.tsx
- app/src/pages/dashboard/admin/AdminAppointments.tsx
- app/src/pages/dashboard/admin/AdminAttendance.tsx
- app/src/pages/dashboard/admin/AdminBehavior.tsx
- app/src/pages/dashboard/admin/AdminCampusLifeContent.tsx
- app/src/pages/dashboard/admin/AdminClasses.tsx
- app/src/pages/dashboard/admin/AdminCourses.tsx
- app/src/pages/dashboard/admin/AdminDashboard.tsx
- app/src/pages/dashboard/admin/AdminGradeLocks.tsx
- app/src/pages/dashboard/admin/AdminHealth.tsx
- app/src/pages/dashboard/admin/AdminMainPage.tsx
- app/src/pages/dashboard/admin/AdminParentsStudents.tsx
- app/src/pages/dashboard/admin/AdminPickup.tsx
- app/src/pages/dashboard/admin/AdminPrograms.tsx
- app/src/pages/dashboard/admin/AdminProgramsContent.tsx
- app/src/pages/dashboard/admin/AdminReports.tsx
- app/src/pages/dashboard/admin/AdminSchedules.tsx
- app/src/pages/dashboard/admin/AdminSettings.tsx
- app/src/pages/dashboard/admin/AdminSubjects.tsx
- app/src/pages/dashboard/admin/AdminUsers.tsx
- app/src/pages/dashboard/admin/AdminYears.tsx

### Parent (11)
- app/src/pages/dashboard/parent/ParentAppointments.tsx
- app/src/pages/dashboard/parent/ParentAttendance.tsx
- app/src/pages/dashboard/parent/ParentBehavior.tsx
- app/src/pages/dashboard/parent/ParentChildren.tsx
- app/src/pages/dashboard/parent/ParentDashboard.tsx
- app/src/pages/dashboard/parent/ParentGrades.tsx
- app/src/pages/dashboard/parent/ParentHealth.tsx
- app/src/pages/dashboard/parent/ParentHomework.tsx
- app/src/pages/dashboard/parent/ParentMessages.tsx
- app/src/pages/dashboard/parent/ParentPickup.tsx
- app/src/pages/dashboard/parent/ParentSchedule.tsx

### Student (10)
- app/src/pages/dashboard/student/StudentAppointments.tsx
- app/src/pages/dashboard/student/StudentBehavior.tsx
- app/src/pages/dashboard/student/StudentDashboard.tsx
- app/src/pages/dashboard/student/StudentGrades.tsx
- app/src/pages/dashboard/student/StudentHomework.tsx
- app/src/pages/dashboard/student/StudentLessons.tsx
- app/src/pages/dashboard/student/StudentMessages.tsx
- app/src/pages/dashboard/student/StudentReportCards.tsx
- app/src/pages/dashboard/student/StudentSchedule.tsx
- app/src/pages/dashboard/student/StudentSubjects.tsx

### Teacher (10)
- app/src/pages/dashboard/teacher/TeacherAttendance.tsx
- app/src/pages/dashboard/teacher/TeacherBehavior.tsx
- app/src/pages/dashboard/teacher/TeacherClasses.tsx
- app/src/pages/dashboard/teacher/TeacherDashboard.tsx
- app/src/pages/dashboard/teacher/TeacherGrades.tsx
- app/src/pages/dashboard/teacher/TeacherHomework.tsx
- app/src/pages/dashboard/teacher/TeacherLessons.tsx
- app/src/pages/dashboard/teacher/TeacherMessages.tsx
- app/src/pages/dashboard/teacher/TeacherSchedule.tsx
- app/src/pages/dashboard/teacher/TeacherStudents.tsx

## Comportement Layout partagé
- Sidebar responsive:
  - Desktop: rail compact
  - Mobile: drawer repliable
- Header sticky avec:
  - titre de page active
  - recherche
  - notifications
  - switch thème
  - menu utilisateur
- Main content:
  - scroll top automatique au changement de route
  - largeur max standardisée

## Garde-fous fonctionnels à respecter côté design
- Ne pas casser la logique de rôle (chaque rôle ne voit que ses routes)
- Préserver les actions de base du header (theme, user menu, logout)
- Préserver la lisibilité en light et dark mode
- Respecter la hiérarchie d'information des pages de gestion (admin)

## Ordre recommandé pour le travail design
1. Définir le style framework commun (layout, spacing, typographie, composants)
2. Designer les écrans dashboard d'accueil par rôle
3. Designer les écrans data-heavy (tables, filtres, formulaires)
4. Designer les états (vide, loading, erreur, succès)
5. Finaliser variantes responsive (desktop/tablette/mobile)

## Fichiers de référence à lire en priorité
- app/src/App.tsx
- app/src/components/layout/DashboardLayout.tsx
- app/src/pages/dashboard/admin/AdminDashboard.tsx
- app/src/pages/dashboard/parent/ParentDashboard.tsx
- app/src/pages/dashboard/student/StudentDashboard.tsx
- app/src/pages/dashboard/teacher/TeacherDashboard.tsx
