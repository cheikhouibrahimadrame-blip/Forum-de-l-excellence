# 🔍 Audit Report — API-Driven Coverage of the Web Application

> **Date** : 29 avril 2026
> **Scope** : Inspection systématique de toute la surface visible du site (pages publiques, layouts, auth, dashboards, contrôleurs) pour déterminer si chaque donnée, bouton et lien est piloté par l'API ou hardcodé.
> **Méthode** : Inspection ligne-par-ligne + grep ciblé + cross-check des routes backend vs. consommateurs frontend.

---

## 📊 Résumé exécutif

> **Le webapp n'est PAS 100 % API-driven.** Les 4 grandes pages publiques (`/`, `/programs`, `/campus-life`, `/admissions`) le sont entièrement. Tout ce qui les entoure ne l'est pas.

| Catégorie | Couverture API | Niveau |
|---|---|---|
| Sections de contenu des 4 grandes pages publiques | **100 %** | ✅ Excellent |
| Page détail d'un programme (`/programmes/:id`) | **0 %** | 🔴 Cassée |
| Header / footer / navigation / branding du site public | **~10 %** | 🟠 Critique |
| Layouts auth & dashboard (logo, tagline, about) | **0 %** | 🟠 À corriger |
| Bannières hero des 4 dashboards de rôle | **0 %** | 🟠 À corriger |
| Exports PDF / bulletins | **0 %** | 🟠 À corriger |
| Liens sociaux (Facebook, Instagram, WhatsApp…) | **inexistants** | 🟠 Manquant |
| Accessibilité des éditeurs admin depuis l'UI | **0 %** | 🔴 Orphelins |

---

## 🔴 BLOQUANT — bugs fonctionnels et orphelinats

### B1. La page détail d'un programme est cassée

**Symptôme** : cliquer sur n'importe quelle carte de programme → écran "Programme non trouvé".

**Localisation** : `app/src/pages/public/ProgramDetailPage.tsx:25-205`

**Cause** :
- `ProgramDetailPage.tsx` contient un tableau `programsData` de **7 programmes 100 % hardcodés** avec des IDs **entiers** (1, 2, 3…).
- Le composant fait `programsData.find(p => p.id === parseInt(id || '0'))`.
- Mais `ProgramsPage.tsx` (refactorisé pour être API-driven) navigue maintenant vers `/programmes/${program.id}` avec `program.id === 'prog-1'`, `'prog-2'`, etc. (chaînes venant de l'API).
- `parseInt('prog-1')` → `NaN` → aucune correspondance → "Programme non trouvé" pour TOUTES les fiches.

**Impact** : utilisateur final, immédiat. La page détail des programmes est totalement inaccessible.

**Correction requise** :
1. Charger les données via `GET /api/pages/programs`.
2. Retrouver le programme par `id` (chaîne) dans `content.programs`.
3. Extraire les champs détaillés (`objectives`, `curriculum`, `teachingApproach`, `enrollment`, `price`) — soit en les ajoutant au schéma `pagesDefaults.ts`, soit en les laissant comme champs facultatifs.

---

### B2. Les 3 nouveaux éditeurs admin sont orphelins (aucun lien depuis le dashboard)

**Routes définies** (`app/src/App.tsx:191-193`) :
- `/admin/content/admissions`
- `/admin/content/programs`
- `/admin/content/campuslife`

**Problème** :
- `app/src/components/layout/DashboardLayout.tsx:241` n'a **qu'une seule entrée** "Page Accueil → /admin/mainpage".
- `app/src/pages/dashboard/admin/AdminDashboard.tsx` n'a aucun bloc "Contenu site public".
- Les 3 éditeurs sont donc **inaccessibles via la navigation normale**. Un admin ne peut y aller qu'en tapant l'URL à la main.

**Impact** : fonctionnalité construite mais invisible aux utilisateurs.

**Correction requise** :
1. Ajouter 3 entrées dans la sidebar admin (`DashboardLayout.tsx:241`) :
   - Programmes (contenu) → `/admin/content/programs`
   - Vie du campus (contenu) → `/admin/content/campuslife`
   - Admissions (contenu) → `/admin/content/admissions`
2. Ajouter un bloc "Contenu site public" sur `AdminDashboard` avec `id="contenu-site-public"` et liens visuels.

---

### B3. Le bouton "Retour au tableau de bord" des 3 éditeurs ne défile nulle part

**Localisation** : tous les éditeurs renvoient vers `/admin` avec `state: { scrollTo: 'contenu-site-public' }`.

**Problème** :
- `AdminDashboard.tsx` ne lit jamais `location.state.scrollTo`.
- Aucun élément n'a `id="contenu-site-public"`.

**Impact** : le bouton fait juste retour à la racine du dashboard, sans repositionnement.

**Correction requise** : couvrir ce point en même temps que B2 (ajouter le bloc + le scroll handler dans `AdminDashboard.tsx`).

---

## 🟠 HARDCODÉ — données publiques non éditables par l'admin

### H1. PublicLayout (header + footer présents sur toutes les pages publiques)

**Fichier** : `app/src/components/layout/PublicLayout.tsx`

| Élément | Ligne | Statut |
|---|---|---|
| Logo `/logo.jpeg` | 91 | hardcodé |
| Nom d'école dans le header | 97 | hardcodé (le footer utilise `collegeInfo.name`, pas le header) |
| Tagline "College Prive" | 100 | hardcodé |
| **Tableau de navigation** (Accueil/Programmes/Admissions/Vie du Campus) | 39-44 | hardcodé |
| Bouton "Connexion (Admin / Comptes crees)" | 167 | hardcodé |
| Logo footer (icône `GraduationCap`) | 215 | hardcodé |
| Nom dans le footer | 220 | hardcodé (n'utilise pas `collegeInfo.name`) |
| Tagline footer "College Prive" | 222 | hardcodé |
| **Description "Le Forum de L'excellence est un etablissement…"** | 225-228 | hardcodé |
| Titre "Liens Rapides" + ses 3 liens | 232-258 | hardcodés |
| Titre "Contact" | 262 | hardcodé |
| Directeurs (`collegeInfo.principal`) | 264 | fallback hardcodé — **API ne l'expose pas** |
| Adresse (`collegeInfo.address`) | 267 | fallback hardcodé — **API ne l'expose pas** |
| Copyright "© {year} … Tous droits reserves." | 275 | hardcodé |
| "Fonde par M. et Mme Fall" | 278 | hardcodé |
| **Aucun lien social** (Facebook, Instagram, WhatsApp) | — | section absente |

**Source API** : `/api/settings/appearance` (`backend/src/routes/settings.ts:82-100`) n'expose que **3 champs** : `schoolName`, `schoolPhone`, `schoolEmail`. Tout le reste passe en fallback hardcodé.

---

### H2. AuthLayout (login, forgot, reset, change-password)

**Fichier** : `app/src/components/layout/AuthLayout.tsx:15-18`

- Logo `/logo.jpeg` — hardcodé
- "Forum de L'excellence" — hardcodé
- "Collège Privé - M. et Mme Fall" — hardcodé

---

### H3. DashboardLayout (sidebar de tous les rôles connectés)

**Fichier** : `app/src/components/layout/DashboardLayout.tsx:330-333`

- Logo `/logo.jpeg` — hardcodé
- "Forum de L'excellence" — hardcodé
- "FORUM-EXCELLENCE Dashboard" — hardcodé

---

### H4. Bannière hero des 4 dashboards (Admin/Teacher/Student/Parent)

**Fichiers** :
- `app/src/pages/dashboard/admin/AdminDashboard.tsx:251-256`
- `app/src/pages/dashboard/teacher/TeacherDashboard.tsx:225`
- `app/src/pages/dashboard/student/StudentDashboard.tsx:215`
- `app/src/pages/dashboard/parent/ParentDashboard.tsx:146`

Tous utilisent :
- Image `/campus-hero.png` — hardcodée
- Texte "Forum de L'excellence" — hardcodé
- Texte "Tableau de bord campus" — hardcodé

---

### H5. LoginPage

**Fichier** : `app/src/pages/auth/LoginPage.tsx:76-78,172-174`

- Logo `/logo.jpeg` — hardcodé
- Alt + sous-titre "Connectez-vous à votre compte…" — hardcodé
- Note finale "Les comptes sont créés uniquement par l'admin…" — hardcodée

---

### H6. RegisterPage — code mort hardcodé

**Fichier** : `app/src/pages/auth/RegisterPage.tsx:182-183`

Retourne `null` (registration désactivée), mais **600+ lignes d'UI hardcodée subsistent en dessous** (logo, brand name, copies françaises, validation regex de téléphone sénégalais, etc.).

**Action recommandée** : soit supprimer le fichier, soit rebrancher la fonctionnalité.

---

### H7. PDFs / bulletins générés

**Fichiers** :
- `app/src/pages/dashboard/student/StudentReportCards.tsx:160`
- `app/src/pages/dashboard/student/StudentGrades.tsx:169`
- `app/src/pages/dashboard/parent/ParentGrades.tsx:188`
- `app/src/pages/dashboard/admin/AdminReports.tsx:154`

Tous insèrent dans le HTML de l'export :
> "Forum de L'excellence - Système de Gestion Académique"

→ hardcodé. Si l'école change de nom, les PDFs ne suivent pas.

---

### H8. AdminSettings

**Fichier** : `app/src/pages/dashboard/admin/AdminSettings.tsx:42-49,650-653,694-699`

- État initial `collegeInfo` (name, address, phone, email, website, principal, year) hardcodé.
- Bloc "Support Technique" : `support@forumexcellence.sn` + "+221 33 123 4568" hardcodés.
- État initial des paramètres email (`smtp.gmail.com`, `noreply@forumexcellence.sn`, etc.) hardcodés.

---

## 🟡 MOYEN — schémas API manquants

### M1. `/api/settings/appearance` n'expose pas assez

**Champs exposés** :
- `theme`, `primaryColor`, `accentColor`, `fontSize`
- `schoolName`, `schoolPhone`, `schoolEmail`

**Champs MANQUANTS mais référencés en frontend** :
- `schoolAddress` (utilisé dans le footer)
- `schoolPrincipal` (utilisé dans le footer)
- `schoolWebsite` (présent dans state, jamais affiché)
- `schoolYear` (présent dans state, jamais affiché)
- `logoUrl` (chaque emplacement utilise `/logo.jpeg` en dur)
- `tagline` ("College Prive")
- `aboutText` (description footer)
- `socialLinks` (Facebook, Instagram, WhatsApp, YouTube…)
- `navigation` (les 4 liens du header sont en dur)
- `quickLinks` (les 3 liens du footer sont en dur)
- `copyrightText` / `foundersText`

---

### M2. Pas d'endpoint pour le "branding" du site

**Manque** :
- `GET /api/settings/branding` (logo + nom + tagline + about + nav + footer + socials)
- Un éditeur admin "Identité du site" pour piloter tout ça.

---

### M3. Duplication des défauts entre back et front

**Fichiers concernés** :
- `backend/src/controllers/pagesController.ts:14-200` duplique entièrement `app/src/lib/pagesDefaults.ts:170-450`.
- `backend/src/controllers/homepageController.ts:9-120` duplique `app/src/lib/homepageDefaults.ts`.

**Risque** : divergence à chaque évolution du schéma. Une seule source de vérité serait préférable (par exemple, un fichier JSON statique partagé ou un seed script qui hydrate les deux côtés).

---

### M4. Incohérence d'orthographe entre routes

`app/src/App.tsx:133-134` mélange les deux orthographes :
- Le footer pointe vers `/programs` (anglais)
- `ProgramsPage` ouvre `/programmes/:id` (français)

Pas un bug bloquant mais incohérent. Standardiser sur une seule orthographe.

---

## ✅ TOTALEMENT API-DRIVEN

| Surface | Endpoint | Statut |
|---|---|---|
| `/` HomePage | `GET /api/homepage` | ✅ Tout (hero, marquee, stats, features, platform, bento, news, testimonials, CTA) |
| `/programs` ProgramsPage | `GET /api/pages/programs` | ✅ Hero, marquee, filtres, programmes, CTA |
| `/admissions` AdmissionsPage | `GET /api/pages/admissions` | ✅ Hero, marquee, étapes, prérequis, calendrier, contact, FAQ, CTA |
| `/campus-life` CampusLifePage | `GET /api/pages/campusLife` | ✅ Hero, marquee, galerie, clubs, événements, installations, services, CTA |
| `AdminMainPage` | GET/POST `/api/homepage` | ✅ Édite tout |
| `AdminProgramsContent` | GET/POST `/api/pages/programs` | ✅ Édite tout *(mais inaccessible depuis le menu — voir B2)* |
| `AdminCampusLifeContent` | GET/POST `/api/pages/campusLife` | ✅ Édite tout *(idem)* |
| `AdminAdmissionsContent` | GET/POST `/api/pages/admissions` | ✅ Édite tout *(idem)* |
| `PublicLayout` footer (partiel) | `GET /api/settings/appearance` | 🟠 Seulement `name`, `phone`, `email` |

---

## 🎯 Plan d'action recommandé (par ordre d'impact)

### Étape 1 — Réparer le bug bloquant
**Tâche** : transformer `ProgramDetailPage` en consommateur de `/api/pages/programs`.

**Détails** :
- Charger via `api.get('/api/pages/programs')` + `mergeProgramsContent(...)`.
- Retrouver le programme par `id` (chaîne).
- Pour conserver les champs détaillés (`objectives`, `curriculum`, `teachingApproach`, `enrollment`, `price`), les ajouter au schéma `ProgramItem` dans `pagesDefaults.ts` et les rendre éditables dans `AdminProgramsContent`.

**Effort** : moyen. Touche 3 fichiers.

---

### Étape 2 — Rendre les éditeurs admin accessibles
**Tâches** :
1. Ajouter 3 entrées dans `DashboardLayout.tsx:241` (sidebar admin).
2. Ajouter un bloc "Contenu site public" sur `AdminDashboard.tsx` avec `id="contenu-site-public"`.
3. Faire en sorte qu'`AdminDashboard.tsx` lise `location.state.scrollTo` et défile vers la cible.

**Effort** : faible. Touche 2 fichiers.

---

### Étape 3 — Étendre `/api/settings/appearance` en endpoint "branding" complet
**Tâches** :
1. Ajouter au modèle `GeneralSettings` (Prisma) ou créer un nouveau modèle `BrandingSettings` :
   - `logoUrl`, `tagline`, `aboutText`, `address`, `principal`, `website`, `year`
   - `socialLinks: { facebook, instagram, whatsapp, youtube, twitter }`
   - `navigation: { name, href }[]`
   - `quickLinks: { name, href }[]`
   - `copyrightText`, `foundersText`
2. Exposer tout via `GET /api/settings/branding` (public).
3. Créer un éditeur admin "Identité du site" (`AdminBrandingSettings`).

**Effort** : élevé. Migration Prisma + route + éditeur.

---

### Étape 4 — Rendre les layouts data-driven
**Tâches** :
1. `PublicLayout` : consommer `/api/settings/branding`, supprimer tous les hardcodes.
2. `AuthLayout` : idem.
3. `DashboardLayout` : idem (sidebar header).
4. Bannière hero des 4 dashboards : utiliser `branding.logoUrl` / `branding.heroBannerUrl` / `branding.schoolName`.
5. PDFs (4 fichiers) : injecter `branding.schoolName` au lieu du texte hardcodé.

**Effort** : moyen. Touche 8 fichiers.

---

### Étape 5 — Décider du sort de RegisterPage
**Options** :
- A) Supprimer le fichier (registration désactivée définitivement).
- B) Rebrancher la fonctionnalité.

**Effort** : faible (A) ou élevé (B).

---

### Étape 6 — Consolider les défauts back/front
**Tâche** : extraire les défauts dans un fichier partagé (par exemple `shared/defaults/`) ou créer un seed script qui hydrate les deux.

**Effort** : moyen.

---

## 📁 Inventaire des fichiers concernés

### Pages publiques (5)
- `app/src/pages/public/HomePage.tsx` ✅ API-driven
- `app/src/pages/public/ProgramsPage.tsx` ✅ API-driven
- `app/src/pages/public/CampusLifePage.tsx` ✅ API-driven
- `app/src/pages/public/AdmissionsPage.tsx` ✅ API-driven
- `app/src/pages/public/ProgramDetailPage.tsx` 🔴 100 % hardcodé + cassée

### Layouts (3)
- `app/src/components/layout/PublicLayout.tsx` 🟠 ~10 % API-driven
- `app/src/components/layout/AuthLayout.tsx` 🟠 0 % API-driven
- `app/src/components/layout/DashboardLayout.tsx` 🟠 0 % API-driven

### Pages auth (5)
- `app/src/pages/auth/LoginPage.tsx` 🟠 hardcodé
- `app/src/pages/auth/RegisterPage.tsx` 🟠 code mort hardcodé
- `app/src/pages/auth/ForgotPassword.tsx` 🟡 à inspecter
- `app/src/pages/auth/ResetPassword.tsx` 🟡 à inspecter
- `app/src/pages/auth/ChangePassword.tsx` 🟡 à inspecter

### Dashboards (4)
- `app/src/pages/dashboard/admin/AdminDashboard.tsx` 🟠 hero hardcodé + manque liens vers éditeurs
- `app/src/pages/dashboard/teacher/TeacherDashboard.tsx` 🟠 hero hardcodé
- `app/src/pages/dashboard/student/StudentDashboard.tsx` 🟠 hero hardcodé
- `app/src/pages/dashboard/parent/ParentDashboard.tsx` 🟠 hero hardcodé

### Éditeurs admin (4)
- `app/src/pages/dashboard/admin/AdminMainPage.tsx` ✅ accessible via "Page Accueil"
- `app/src/pages/dashboard/admin/AdminProgramsContent.tsx` 🔴 orphelin
- `app/src/pages/dashboard/admin/AdminCampusLifeContent.tsx` 🔴 orphelin
- `app/src/pages/dashboard/admin/AdminAdmissionsContent.tsx` 🔴 orphelin
- `app/src/pages/dashboard/admin/AdminSettings.tsx` 🟠 hardcodés résiduels

### Backend (2 contrôleurs concernés)
- `backend/src/controllers/pagesController.ts` ✅ fonctionnel (mais duplique le schéma)
- `backend/src/controllers/homepageController.ts` ✅ fonctionnel (mais duplique le schéma)
- `backend/src/routes/settings.ts` 🟠 expose seulement 3 champs publics

### Exports PDF (4)
- `app/src/pages/dashboard/student/StudentReportCards.tsx` 🟠
- `app/src/pages/dashboard/student/StudentGrades.tsx` 🟠
- `app/src/pages/dashboard/parent/ParentGrades.tsx` 🟠
- `app/src/pages/dashboard/admin/AdminReports.tsx` 🟠

---

## 📌 Notes pour la suite

- L'audit n'a **pas** couvert en détail les pages métier des dashboards (grades, schedules, attendance, etc.) — celles-ci sont déjà API-driven par construction (elles affichent des données métier issues de Prisma).
- L'audit s'est concentré sur ce que l'admin doit pouvoir éditer : **branding, contenu marketing, identité visuelle**.
- Les 3 nouvelles pages refactorisées (Programs, Campus Life, Admissions) suivent toutes le même pattern et sont solides.

---

*Fin du rapport.*
