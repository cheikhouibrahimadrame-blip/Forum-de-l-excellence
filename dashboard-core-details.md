# Dossier détaillé des dashboards coeur

## Périmètre exact demandé
Ce document couvre uniquement les fichiers suivants:
- app/src/App.tsx
- app/src/components/layout/DashboardLayout.tsx
- app/src/pages/dashboard/admin/AdminDashboard.tsx
- app/src/pages/dashboard/parent/ParentDashboard.tsx
- app/src/pages/dashboard/student/StudentDashboard.tsx
- app/src/pages/dashboard/teacher/TeacherDashboard.tsx

## 1) App.tsx (orchestrateur global des routes)

### Rôle
- Point d’entrée de l’application côté routing.
- Déclare les providers globaux (theme + auth).
- Configure les layouts et toutes les routes dashboard protégées.

### Structure principale
- ThemeProvider puis AuthProvider enveloppent AppContent.
- AppContent contient:
  - Router
  - ScrollToTop
  - Suspense avec fallback LoadingSpinner
  - Routes

### Stratégie de chargement
- Les pages dashboard sont chargées en lazy loading (code splitting).
- Les layouts PublicLayout, DashboardLayout, AuthLayout restent eager.

### Sécurité / accès
- ProtectedRoute:
  - redirige vers /login si pas connecté
  - redirige vers /change-password si mustChangePassword
  - redirige vers / si rôle non autorisé
- PublicRoute: laisse passer, avec gestion loading auth

### Mapping dashboard par rôle
- STUDENT: 10 routes dédiées
- PARENT: 11 routes dédiées
- TEACHER: 10 routes dédiées
- ADMIN: 21 routes dédiées

### Implication design
- Le designer doit prévoir une cohérence visuelle inter-rôles, mais avec des contenus et priorités métier différents.
- Le fallback loading global existe (spinner plein écran) lors du chargement lazy.

## 2) DashboardLayout.tsx (shell commun des dashboards)

### Rôle
- Layout partagé pour tous les dashboards.
- Gère la navigation latérale, le header, le menu utilisateur, la zone contenu.

### Comportements clés
- Responsive:
  - Desktop: sidebar compacte type rail (icônes)
  - Mobile: drawer ouvrable/fermable + overlay
- Reset navigation:
  - scroll top sur changement de route
  - fermeture auto du menu user et de la sidebar
- Navigation dynamique selon user.role

### Zones UI
- Sidebar:
  - logo
  - menu par rôle
  - profil compact en bas
- Header sticky:
  - label page active
  - recherche
  - notifications
  - switch thème
  - menu utilisateur
- Main:
  - conteneur max width standardisé

### Navigation par rôle (source de vérité du menu)
- STUDENT: tableau de bord, notes, edt, devoirs, messages, comportement, rendez-vous, bulletins
- PARENT: tableau de bord, enfants, présence, devoirs, messages, comportement, santé, autorisations, notes, edt, rendez-vous
- TEACHER: tableau de bord, classes, élèves, présence, devoirs, messages, comportement, notes, edt
- ADMIN: tableau de bord, utilisateurs, classes, matières, années, edt, verrous notes, parents/élèves, rendez-vous, présence, comportement, santé, ramassage, page accueil, paramètres

### Détails visuels notables
- Fond dashboard avec overlays flous décoratifs.
- Header sticky avec glass effect.
- Tooltips sur sidebar compacte desktop.

### Implication design
- Toute refonte dashboard doit respecter ce layout partagé sinon risque de divergence entre rôles.
- Les patterns navigation/feedback doivent rester constants entre pages.

## 3) AdminDashboard.tsx

### Rôle
- Hub opérationnel d’administration (console de pilotage).
- Centralise accès rapide aux modules métier admin.

### Données chargées (API)
- /api/users (plusieurs requêtes: active, mustChangePassword, disabled, TEACHER)
- /api/settings
- /api/academic-years
- /api/classes
- /api/subjects
- /api/appointments

### États gérés
- academicYears
- userCounts (active, mustChangePassword, disabled)
- allowedDomainsCount
- classSummary (classes, subjects, teachers, yearsClosed)
- appointmentSummary (pending, confirmed, cancelled)
- statsError

### Structure UI
1. Hero gradient administration
2. Quick stats (4 cartes)
3. Grille de sections admin (9 cartes fonctionnelles)
4. Bloc activité récente
5. Résumé classes/matières
6. Résumé rendez-vous

### Sections fonctionnelles (cartes)
- Contenu du Site Public
- Utilisateurs & Accès
- Classes & Matières
- Années académiques
- Parents & Élèves
- Emplois du temps
- Notes & Verrous
- Rendez-vous
- Paramètres & Sécurité

### Interactions
- Scroll targeting depuis location.state.scrollTo avec highlight temporaire (ring).
- Liens internes vers pages admin avec état scrollTo propagé.

### Implication design
- C’est un dashboard “cockpit”: priorité à lisibilité, densité maîtrisée, accès rapide.
- Les badges de gouvernance et statuts doivent être très clairs visuellement.

## 4) ParentDashboard.tsx

### Rôle
- Vue parent centrée sur suivi enfant(s): notes, présence, planning, rendez-vous.

### Données chargées (API)
- /api/parent-students/my-students

### États gérés
- linkedStudents
- loadingStudents
- quickActions (local)
- recentActivity (actuellement vide)

### Structure UI
1. Header bienvenue parent
2. Quick actions (5 cartes)
3. Section Mes Enfants
  - loading state
  - empty state (aucun enfant lié)
  - cartes élève avec résumé
4. Activité récente (actuellement vide)

### Détails carte élève
- Nom + programme
- KPI simplifiés (moyenne, rang, présence)
- Statut + email
- CTA: voir notes, voir emploi du temps

### Interactions
- Scroll targeting par location.state.scrollTo
- Quick actions reliées aux pages parent spécifiques

### Implication design
- Priorité au sentiment de contrôle parental et à la clarté des infos enfant.
- Les états vide/chargement sont critiques (cas fréquent en onboarding parent).

## 5) StudentDashboard.tsx

### Rôle
- Vue élève de progression personnelle (notes, échéances, planning, progression).

### Données chargées (API)
- /api/grades/student/:studentId
- /api/schedules/student/:studentId

### États gérés
- stats
- recentGrades
- upcomingEvents
- progress (semester, attendance, mention)
- loadingData
- loadError

### Structure UI
1. Header bienvenue élève
2. Quick actions (6 cartes)
3. Stats grid (4 cartes)
4. Dernières notes
5. Prochaines échéances
6. Progression académique

### Interactions
- Scroll targeting par location.state.scrollTo
- Liens Voir tout / Voir l’emploi du temps

### Points techniques à connaître
- Le composant utilise api.get puis vérifie response.ok/response.json (pattern Fetch), ce qui peut être incohérent si api est basé Axios.
- useScrollReveal est appelé dans des map (quick actions et stats), ce qui viole les règles de hooks React.

### Implication design
- Dashboard très “motivation/progression”: hiérarchie visuelle orientée performance personnelle.
- Prévoir un bon contraste pour les KPI importants.

## 6) TeacherDashboard.tsx

### Rôle
- Vue enseignant orientée gestion de classe, volume horaire et priorités pédagogiques.

### Données chargées (API)
- /api/schedules/teacher/:teacherId

### États gérés
- classCards
- stats
- pendingTasks (actuellement vide)
- loadingData
- loadError

### Transformations métier internes
- Agrégation du planning enseignant par jour
- Tri des créneaux (ordre semaine + heure)
- Construction de cartes classe
- Calcul heures/semaine via durée des créneaux

### Structure UI
1. Header bienvenue enseignant
2. Quick actions (4 cartes)
3. Stats grid (4 cartes)
4. Mes Classes
5. Tâches en attente
6. Activité récente

### Interactions
- Scroll targeting par location.state.scrollTo
- Liens rapides vers classes, élèves, notes, emploi du temps

### Points techniques à connaître
- useScrollReveal appelé dans des map (hooks dans boucle), à corriger côté dev.

### Implication design
- Accent sur efficacité opérationnelle enseignant: réduire friction d’accès aux actions quotidiennes.
- Les zones “Tâches” et “Activité” doivent être pensées pour monter en charge (actuellement vides).

## 7) Éléments transverses importants pour le designer

### Cohérence inter-rôles
- Même shell visuel (layout commun), mais priorités métier différentes.
- Conserver des patterns UI constants:
  - cartes action
  - cartes KPI
  - sections liste/activité
  - états loading/empty/error

### États à designer explicitement
- Chargement
- Vide
- Erreur
- Succès / feedback
- Données denses (table/cards multiples)

### Responsive
- Le layout change fortement entre mobile et desktop (drawer vs rail).
- Tester lisibilité + hiérarchie sur:
  - mobile portrait
  - tablette
  - desktop large

## 8) Références directes
- app/src/App.tsx
- app/src/components/layout/DashboardLayout.tsx
- app/src/pages/dashboard/admin/AdminDashboard.tsx
- app/src/pages/dashboard/parent/ParentDashboard.tsx
- app/src/pages/dashboard/student/StudentDashboard.tsx
- app/src/pages/dashboard/teacher/TeacherDashboard.tsx
