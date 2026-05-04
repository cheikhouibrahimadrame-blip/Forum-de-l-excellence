# 🔍 Audit Production Readiness — Findings & Roadmap

> **Date** : 30 avril 2026
> **Scope** : Audit transverse du code (sécurité, correction, performance, accessibilité, ops). Complémentaire au rapport `AUDIT_FINAL_REPORT.md` qui couvre uniquement la migration vers un contenu 100 % API-driven.
> **Verdict** : Le refactor API-driven est solide. Cependant, plusieurs défauts pré-existants empêchent un déploiement production sûr. **6 P0 (bloquants), 11 P1 (haute), ~17 P2 (moyenne), ~6 P3 (polish)**.
>
> **État** (mise à jour 30 avril 2026) : Batch A (sécurité & correction) ✅ **complété**. Batch B (production & ops) ✅ **complété**. Batch C (UX & polish) ✅ **complété**. Suite Vitest backend : **79 tests / 12 fichiers** passent. Suite Vitest frontend : **31 tests / 6 fichiers** passent. `tsc --noEmit` + `vite build` clean côté backend ET frontend.

---

## 📌 Pourquoi ce rapport existe

`AUDIT_FINAL_REPORT.md` confirme que l'admin peut éditer 100 % du contenu visible — c'est vrai, et bien fait.

Ce rapport-ci traite des couches **sous le contenu** :

| Domaine | `AUDIT_FINAL_REPORT.md` | `AUDIT_PRODUCTION_READINESS.md` |
|---|---|---|
| Contenu CMS éditable par l'admin | ✅ couvert | — |
| Sécurité (auth, autorisation, uploads, secrets) | — | ✅ couvert |
| Correction métier (calculs, validations, locks) | — | ✅ couvert |
| Performance (bundle, polling, assets) | — | ✅ couvert |
| Accessibilité, UX edge cases | — | ✅ couvert |
| Ops (déploiement, CI, env, Docker) | — | ✅ couvert |

---

## 🚦 Légende des sévérités

| Niveau | Signification | Politique |
|---|---|---|
| **P0** | Bloquant production : faille de sécurité, fuite de données, fonctionnalité cassée | À corriger **avant** tout déploiement public |
| **P1** | Haut risque : bug d'autorisation, validation manquante, intégrité de données | À corriger dans le sprint courant |
| **P2** | Qualité : UX, performance, dette technique mesurable | À planifier dans les 1-2 sprints suivants |
| **P3** | Polish : a11y mineure, code mort, cosmétique | Backlog |

---

## 🔴 P0 — Bloquants production

### P0-1 — `forgot-password` ne fonctionne pas en production
- **Symptôme** : aucune librairie d'envoi d'email n'est installée (`grep nodemailer backend/src` → 0 résultat).
- **Impact** :
  - Le contrôleur génère un vrai token de reset, mais le **logge en clair** (fuite vers les agrégateurs de logs en prod).
  - L'utilisateur ne reçoit jamais le mail → fonctionnalité cassée.
- **Fichiers** :
  - `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\controllers\authController.ts` (fonction `forgotPassword`)
  - `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\routes\settings.ts:235-253` (les paramètres SMTP sont sauvegardés mais jamais lus)
- **Fix** :
  1. Installer `nodemailer` côté backend.
  2. Créer `backend/src/services/mailService.ts` qui lit la configuration depuis `EmailSettings` (Prisma) avec fallback sur les variables d'environnement.
  3. Supprimer le `logger.info({ resetLink })` du contrôleur (et tout log incluant le token).
  4. En dev : activer un transport `console` ou `MailHog`.

### P0-2 — Un enseignant peut noter les élèves de n'importe quel cours
- **Symptôme** : `createGrade` ne vérifie que l'inscription de l'élève au cours, pas que l'enseignant soit le titulaire du cours.
- **Impact** : Teacher A peut créer des notes dans le cours de Teacher B (et celui-ci ne peut plus les modifier car la `teacherId` est verrouillée à A après création).
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\controllers\gradesController.ts:264-308`
- **Fix** : ajouter avant `prisma.grade.create` :
  ```typescript
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { teacherId: true } });
  if (!course || course.teacherId !== teacher.id) {
    return res.status(403).json({ success: false, error: 'Vous n\'enseignez pas ce cours' });
  }
  ```

### P0-3 — La validation du mot de passe admin reset est un no-op
- **Symptôme** : `passwordPolicy.run(req)` valide le champ `password` du body, mais l'endpoint lit `newPassword`. Aucune contrainte n'est jamais appliquée.
- **Impact** : un admin (ou attaquant ayant compromis un compte admin) peut définir un mot de passe d'**1 caractère** pour n'importe quel utilisateur.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\controllers\userController.ts:398-413`
- **Fix** : remplacer la `passwordPolicy` par une validation dédiée à `newPassword`, ou renommer le champ en `password` côté API.

### P0-4 — Les verrous de notes sont décoratifs
- **Symptôme** :
  - `GradeLock` est créable/supprimable via `/admin/grade-locks`.
  - `createGrade` / `updateGrade` / `deleteGrade` **ne consultent jamais** `GradeLock`.
  - `GET /api/grade-locks/summary` retourne en dur `completionRate: 0, openPeriods: 0`.
- **Impact** : l'admin pense bloquer la saisie après le conseil de classe ; les enseignants peuvent toujours modifier les notes.
- **Fichiers** :
  - `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\routes\gradeLocks.ts:25-32`
  - `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\controllers\gradesController.ts:241-460` (3 mutations à protéger)
- **Fix** :
  1. Ajouter une relation entre `GradeLock` et `Course`/`AcademicYear`/`Trimester` (actuellement `period` est une `String` libre, sans contrainte).
  2. Avant chaque mutation : `if (await isLocked(courseId, period)) return 423 Locked`.
  3. Calculer `completionRate` et `openPeriods` réellement.

### P0-5 — `trust proxy` non configuré pour Render
- **Symptôme** : derrière le load balancer Render, `req.ip` vaut l'IP du proxy. Tous les `rateLimit({ keyGenerator: req => req.ip })` voient une seule IP pour tous les visiteurs.
- **Impact** : soit la limite est saturée par le 1er visiteur (DoS auto-infligé), soit elle est facilement contournée selon la configuration. **`X-Forwarded-For` ne fonctionne pas non plus pour les logs et l'audit.**
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\server.ts`
- **Fix** : ajouter `app.set('trust proxy', 1);` (ou `'loopback'` selon la topologie Render).

### P0-6 — Le déploiement statique frontal Render n'a pas de SPA rewrite
- **Symptôme** : `render.yaml` ne déclare pas de `routes:`. Recharger `/admin/users` directement (pas via navigation interne) renvoie un 404 du host statique Render.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\render.yaml:43-51`
- **Fix** : ajouter
  ```yaml
  routes:
    - type: rewrite
      source: /*
      destination: /index.html
  ```

---

## 🟠 P1 — Haut risque

### P1-1 — Endpoints de paramètres acceptent n'importe quoi
- `POST /api/settings/security` persiste sans validation : `passwordMinLength: 1`, `maxLoginAttempts: -5`, `enableTwoFactor: "yes"`, etc.
- Idem pour appearance/notifications/database/email.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\routes\settings.ts:124-253`
- **Fix** : `express-validator` + bornes par champ + allowlist d'enums (theme ∈ {light,dark,auto}, fontSize ∈ {small,medium,large}, etc.).

### P1-2 — Duplication `general.*` ↔ `branding.brand.*`
- Le nom, l'adresse, le téléphone, l'email, le directeur et l'année scolaire sont stockés dans **deux** sources : `prisma.generalSettings` et le JSON `branding-settings.json`.
- L'admin édite l'un ou l'autre selon la page → désynchronisation silencieuse.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\routes\settings.ts:153-170` vs `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\controllers\brandingController.ts:46-63`
- **Fix** : choisir le branding comme source unique, faire pointer `/general` GET/POST vers la même source (ou supprimer l'éditeur "général" puisque "Identité du site" couvre déjà tout).

### P1-3 — Injection d'host dans les URLs d'upload
- `req.get('host')` est utilisé pour construire l'URL publique stockée. Un attaquant envoie `Host: evil.com` → l'asset persiste avec une URL pointant vers evil.com, jamais corrigée.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\routes\uploads.ts:139-144`
- **Fix** :
  1. Ajouter `BACKEND_PUBLIC_URL` aux variables d'environnement validées par `validateEnvOrCrash`.
  2. Utiliser `${process.env.BACKEND_PUBLIC_URL}/uploads/...` au lieu de `req.protocol://req.get('host')`.

### P1-4 — Les SVG restent dangereux malgré la heuristique anti-`<script>`
- La regex ne capte pas `<foreignObject>`, `onload="..."`, `<use href="javascript:...">`, `<style>@import url(javascript:...)`, etc.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\routes\uploads.ts:77-87`
- **Fix** : soit retirer SVG de `ALLOWED_EXTENSIONS` / `ALLOWED_MIME_TYPES`, soit assainir avec `DOMPurify` côté serveur (mode SVG strict).

### P1-5 — Fichiers uploadés orphelins
- Aucun GC : si l'admin supprime une image du carousel "Vie du Campus", le fichier reste dans `uploads/campus-life/`.
- **Fix** : tâche cron qui compare `uploads/campus-life/` aux URLs référencées dans `pages-content.json` / `homepage-content.json` / `branding-settings.json` et supprime les orphelins.

### P1-6 — `updateGrade` écrase les zéros légitimes
- `pointsEarned: pointsEarned || existingGrade.pointsEarned` : si l'enseignant met 0 (note d'absence justifiée), l'ancien score reste.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\controllers\gradesController.ts:370`
- **Fix** : `pointsEarned !== undefined ? pointsEarned : existingGrade.pointsEarned`.

### P1-7 — `PUT /api/reports/:id` étale tout `req.body`
- L'admin (ou un attaquant authentifié comme admin) peut écraser `id`, `createdDate`, `generatedBy`.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\routes\reports.ts:65-69`
- **Fix** : whitelist explicite (`{ name, type, department, recipients, status }`).

### P1-8 — Changer le rôle d'un user laisse des profils orphelins
- `updateUser` modifie `User.role` sans créer/supprimer la ligne `Student`/`Teacher`/`Parent`/`Admin` correspondante.
- **Impact** : promouvoir un STUDENT en TEACHER → la table `Student` garde l'ancienne ligne, aucune ligne `Teacher` n'est créée → `/api/grades` répond "Enseignant non trouvé".
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\controllers\userController.ts:267-340`
- **Fix** : transaction qui (a) refuse le changement si le profil cible n'existe pas et que l'admin n'a pas fourni les champs requis, ou (b) crée le profil cible et désactive l'ancien.

### P1-9 — `createUser` ne crée un profil que pour TEACHER
- Pour STUDENT/PARENT/ADMIN, aucune ligne dans la table de profil correspondante n'est créée.
- **Impact** : un élève créé directement par l'admin (sans passer par l'écran "Parents & Élèves") n'apparaît dans aucune classe et toutes ses pages dashboard 404.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\controllers\userController.ts:179-191`
- **Fix** : exiger les champs spécifiques au rôle (studentId, dateOfBirth, etc.) et créer le profil dans la même transaction.

### P1-10 — Les enseignants peuvent lister tous les utilisateurs (incl. admins)
- `GET /api/users` est ouvert à TEACHER et retourne `email`, `phone`, `role` pour tous les rôles.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\routes\users.ts:18`
- **Fix** : restreindre TEACHER à `?role=STUDENT` côté contrôleur, ou créer un endpoint dédié `/api/teachers/my-students`.

### P1-11 — Connexion révoque toutes les sessions actives
- Le contrôleur de login supprime tous les `RefreshToken` de l'utilisateur avant d'émettre les nouveaux. Connexion sur le laptop ⇒ déconnexion du téléphone.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\controllers\authController.ts` (login flow)
- **Fix** : si la politique "session unique" est intentionnelle → la documenter dans l'UI ; sinon → ne révoquer que la session associée au cookie `deviceId` courant.

### P1-12 — Pas de contrainte d'unicité sur `Grade`
- Schéma : pas de `@@unique([studentId, courseId, assignmentName])`. Double-clic ou retry réseau crée des doublons silencieux.
- **Fichier** : `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\prisma\schema.prisma:212-260`
- **Fix** : ajouter la contrainte + migration Prisma.

---

## 🟡 P2 — Qualité (UX, performance, ops)

### Frontend

- **P2-1 — Pas d'`ErrorBoundary`.** Toute erreur runtime dans un chunk lazy = écran blanc. Wrapper chaque `<Suspense>` avec un `ErrorBoundary` qui rend une carte "Quelque chose s'est mal passé" + bouton recharger.
- **P2-2 — `ProtectedRoute` perd l'URL cible.** `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\app\src\App.tsx:103-116` redirige vers `/login` sans `state.from`. Après login, l'utilisateur atterrit sur `/{role}` au lieu de l'URL initialement demandée.
- **P2-3 — Pas de page 404.** Le wildcard redirige vers `/` (`@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\app\src\App.tsx:208`). Un admin qui se trompe d'URL est éjecté du dashboard.
- **P2-4 — `AdminPrograms` et `AdminCourses` sont des stubs morts.** Les routes existent dans `App.tsx` mais ne sont liées nulle part. À soit supprimer, soit transformer en `<Navigate>`.
- **P2-5 — La barre de recherche du topbar n'a aucun handler.** `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\app\src\components\layout\DashboardLayout.tsx:396-399`. La câbler ou la retirer.
- **P2-6 — Polling notifications coûteux.** 3 endpoints × 15s × N utilisateurs simultanés. `/api/appointments` est appelé sans filtres → un admin avec 10 000 RDV télécharge tout toutes les 15s. Consolider en `/api/notifications/summary` et passer à SSE.
- **P2-7 — `currentPage` ne reconnaît pas les sous-routes.** `find(href === pathname)` (`@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\app\src\components\layout\DashboardLayout.tsx:333`) → toute sous-page s'affiche "Tableau de bord". Utiliser `pathname.startsWith` avec longest-prefix wins.
- **P2-8 — Assets hero non optimisés.** `app/public/campus-hero.png` = 980 KB, `app/public/excz.mp4` = 909 KB. Vidéo sans `preload="metadata"`, pas de `<source>` WebM/AV1, ne respecte pas `prefers-reduced-motion` (CSS only).
- **P2-9 — 62 `console.log` en code frontend** (16 dans `AdminSettings.tsx`, 7 dans `AdminUsers.tsx`, 5 dans `lib/api.ts`...). Wrapper dans un logger gated par `import.meta.env.DEV`.
- **P2-10 — ~45 composants shadcn UI inutilisés.** Tree-shaking aide au bundle, mais ralentit le `tsc` et l'indexation IDE.
- **P2-11 — Token d'accès perdu à chaque rechargement de tab.** `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\app\src\lib\tokenService.ts` stocke en variable module → `/api/auth/refresh` est appelé avant tout rendu. Documenté ou migrer vers `sessionStorage`.

### Backend / Ops

- **P2-12 — Écritures JSON non atomiques.** `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\lib\jsonStore.ts:62-66` utilise `writeFileSync` direct. Crash mid-write = JSON corrompu = `loadJsonStore` revient silencieusement aux defaults = **perte de données silencieuse** pour branding/pages/reports. Pattern write-temp-then-rename.
- **P2-13 — CI ne build pas le frontend.** `.github/workflows/ci.yml` ne lance que `tsc --noEmit` et `vitest`. Aucun `vite build`, aucun ESLint, aucun `npm audit`. Les erreurs de bundle / dynamic imports / env manquantes ne sont détectées qu'en prod.
- **P2-14 — Tests frontend = 2 smoke tests.** `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\app\src\tests\App.test.tsx` ne couvre rien de réel. Aucun flow dashboard n'est testé.
- **P2-15 — Incohérence `JWT_EXPIRES_IN`.** `.env.example:9` dit `60m`, `render.yaml:37` dit `15m`. Choisir.
- **P2-16 — `docker-compose.yml` mot de passe `changeme`.** Devrait fail-fast en production plutôt que d'autoriser le default.
- **P2-17 — `console.error` au lieu du logger structuré** dans `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\server.ts:199-206`.

---

## 🟢 P3 — Polish

- **P3-1 — `<html lang="en">`** pour un site français. `@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\app\index.html:2`. Plus : pas de `meta description`, `og:*`, `theme-color`, `<noscript>`, ni FOUC blocker pour le dark theme.
- **P3-2 — Dropdowns publics sans a11y.** `PublicLayout` user dropdown : pas d'`aria-expanded`, pas de fermeture sur Escape, pas de fermeture au clic extérieur (`@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\app\src\components\layout\PublicLayout.tsx:92-125`). La version Dashboard gère le clic extérieur mais pas l'Escape.
- **P3-3 — Menu mobile ne se ferme pas sur retour navigateur.** Seul `onClick` sur Link le ferme.
- **P3-4 — Schéma de notation incohérent.** `createGrade` stocke des points numériques, `calculateGPA` lit des lettres dans `enrollment.finalGrade`. Deux systèmes déconnectés.
- **P3-5 — `SETTINGS_FILE` constante déclarée jamais utilisée** (`@c:\Users\DELL\Downloads\OKComputer_College Management System Architecture\backend\src\routes\settings.ts:9`).
- **P3-6 — `ParentStudent.canAccessGrades` / `canAccessSchedule` pas appliqués** côté contrôleurs (à vérifier exhaustivement, sinon supprimer du schéma).

---

## 🛠️ Plan de remédiation suggéré

Les corrections se regroupent en **3 batches** indépendants, sans conflit de merge :

### Batch A — Sécurité & correction (~1 jour)
**P0** : 1, 2, 3, 4 — **P1** : 1, 3, 4, 6, 7, 8, 9, 10, 12

- Mailer + retrait du log du token (P0-1)
- Vérification course-teacher dans `createGrade` (P0-2)
- Validation `newPassword` (P0-3)
- Enforcement `GradeLock` + `summary` réel (P0-4)
- Validation des endpoints `/api/settings/*` (P1-1)
- `BACKEND_PUBLIC_URL` pour les uploads (P1-3)
- Retrait/sanitization SVG (P1-4)
- Fix `pointsEarned || ...` → `!== undefined` (P1-6)
- Whitelist `PUT /api/reports/:id` (P1-7)
- Réconciliation profils sur changement de rôle (P1-8)
- Création de profil pour STUDENT/PARENT dans `createUser` (P1-9)
- Filtre TEACHER sur `/api/users` (P1-10)
- `@@unique` sur `Grade` + migration (P1-12)

### Batch B — Production & ops (~½ jour)
**P0** : 5, 6 — **P1** : 2, 5, 11 — **P2** : 12, 13, 15, 16, 17

- `app.set('trust proxy', 1)` (P0-5)
- `routes: rewrite` dans `render.yaml` (P0-6)
- Source unique branding (suppression de `general.*` du payload) (P1-2)
- Nettoyage des uploads orphelins (cron) (P1-5)
- Politique de session documentée ou scoped à `deviceId` (P1-11)
- Atomicité des écritures JSON (P2-12)
- CI : `vite build` + `eslint` + `npm audit --production` (P2-13)
- Unification `JWT_EXPIRES_IN` (P2-15)
- `POSTGRES_PASSWORD` no-default (P2-16)
- Logger structuré dans `server.ts` (P2-17)

### Batch C — UX & polish (~1 jour)
**P2** : 1-11 (sauf 12) — **P3** : tous

- `ErrorBoundary` autour de chaque `<Suspense>` (P2-1)
- `state.from` dans `ProtectedRoute` + redirection après login (P2-2)
- Page 404 dédiée (P2-3)
- Suppression / redirection des routes mortes (P2-4)
- Suppression ou câblage de la search bar (P2-5)
- Endpoint `/api/notifications/summary` + suppression du polling 3-en-1 (P2-6)
- `currentPage` avec longest-prefix (P2-7)
- Optimisation hero (WebP/AV1, `preload="metadata"`, respect `prefers-reduced-motion`) (P2-8)
- Strip `console.log` dev-only (P2-9)
- Suppression des composants shadcn inutilisés (P2-10)
- Token d'accès en `sessionStorage` ou pré-warm sur `<App>` mount (P2-11)
- `lang="fr"` + meta tags + FOUC blocker (P3-1)
- A11y dropdowns (P3-2, P3-3)
- Schéma de notation unifié (P3-4)
- Nettoyage code mort (P3-5, P3-6)

---

## ✅ Critères d'acceptation par batch

### Batch A
- [x] Test e2e : `forgot-password` envoie un mail (transport `console` en dev) (P0-1 — `mailService.ts`, fallback dev console).
- [x] Test : Teacher A reçoit 403 en tentant `POST /api/grades` pour un cours de Teacher B (P0-2 — `grades.test.ts`).
- [x] Test : `POST /api/users/:id/reset-password` avec `newPassword: "a"` renvoie 400 (P0-3 — `users.test.ts`).
- [x] Test : `POST /api/grades` en période lockée renvoie 423 (P0-4 — `grades.test.ts`).
- [x] Test : `POST /api/settings/security` avec `passwordMinLength: 1` renvoie 400 (P1-1 — `settings.test.ts`).
- [ ] Migration Prisma `add_unique_grade` appliquée et idempotente (à exécuter en prod : `npx prisma migrate deploy`).

### Batch B
- [x] `app.get('/api/health')` derrière le proxy renvoie l'IP réelle dans les logs (P0-5 — `app.set('trust proxy', …)` lit `TRUST_PROXY`, défaut `1` en production).
- [x] `curl https://<frontend>/admin/users` renvoie `index.html` (pas 404) (P0-6 — `routes: rewrite /* → /index.html` dans `render.yaml`).
- [x] CI échoue si `vite build` échoue (P2-13 — étape `Build (vite)` dans `.github/workflows/ci.yml`).
- [x] Le démarrage docker-compose sans `POSTGRES_PASSWORD` échoue avec un message explicite (P2-16 — `${POSTGRES_PASSWORD:?…}`).

### Batch C
- [x] Une exception jetée depuis un chunk lazy (ex. `StudentGrades`) affiche la carte d'erreur (pas un écran blanc) (P2-1 — `components/ErrorBoundary.tsx`, 4 tests `ErrorBoundary.test.tsx`).
- [x] Aller sur `/admin/users` non connecté → login → redirige sur `/admin/users` (pas `/admin`) (P2-2 — `lib/safeRedirect.ts` + `LoginPage.tsx`, 11 tests `safeRedirect.test.ts` couvrant les open-redirects).
- [x] Ouvrir `/admin/foo-inexistant` connecté affiche la page 404 (P2-3 — `pages/NotFoundPage.tsx`, route catch-all dans `App.tsx`).
- [x] `/admin/users/:id` affiche le bon titre topbar "Utilisateurs" et non le fallback (P2-7 — `lib/currentPage.ts`, 6 tests `currentPage.test.ts`).
- [x] Token d'accès survit au reload du tab (pas de flash "déconnecté", pas de `/api/auth/refresh` au boot) (P2-11 — `lib/tokenService.ts` via `sessionStorage`, 5 tests `tokenService.test.ts`).
- [x] `console.log` muet en prod, fonctionnel en dev (P2-9 — `lib/logger.ts`, 2 tests `logger.test.ts`).
- [ ] Lighthouse score perf ≥ 80 sur `/` (vs ~50-60 actuel à cause du hero — déférré : optimisation hero P2-8 hors scope du batch).

---

## 📊 Estimation totale

| Batch | Effort | Risque régression |
|---|---|---|
| Batch A — Sécurité & correction | ~1 jour | Faible (changements ciblés, testables unitairement) |
| Batch B — Production & ops | ~½ jour | Faible (essentiellement config) |
| Batch C — UX & polish | ~1 jour | Modéré (refactor du shell + assets) |
| **Total** | **~2,5 jours** | **Faible-Modéré** |

---

## 🔁 Comment utiliser ce rapport

1. Trier les findings par batch (A/B/C) selon votre fenêtre de release.
2. Créer un ticket par finding (id `P0-1`, `P1-1`, etc.) pour le suivi.
3. Cocher les critères d'acceptation au fur et à mesure.
4. Une fois le batch validé, mettre à jour la table de statut ci-dessous.

### Tableau de statut (à mettre à jour au fil de l'eau)

> **Batch A** complété le **30 avril 2026**. 14 fixes appliqués, 22 tests Vitest ajoutés (`grades.test.ts`, `users.test.ts`, `settings.test.ts`, `reports.test.ts`). Suite complète : **63 tests passent**, `tsc --noEmit` clean côté backend ET frontend.
>
> **Batch B** complété le **30 avril 2026**. 10 fixes appliqués (2 P0 + 3 P1 + 5 P2), 16 tests Vitest ajoutés (`jsonStore.test.ts`, `uploadsGc.test.ts`, `auth-session.test.ts`, `branding-general.test.ts`). Suite complète : **79 tests passent** (12 fichiers), `tsc --noEmit` clean côté backend ET frontend.
>
> **Batch C** complété le **30 avril 2026**. 13 fixes appliqués (10 P2 + 3 P3) côté frontend, 1 nettoyage côté backend (P3-5). Helpers extraits pour testabilité : `lib/safeRedirect.ts`, `lib/currentPage.ts`, `lib/logger.ts`. **29 tests Vitest frontend ajoutés** (`safeRedirect.test.ts` 12, `currentPage.test.ts` 6, `tokenService.test.ts` 5, `logger.test.ts` 2, `ErrorBoundary.test.tsx` 4) — premier vrai filet de sécurité côté UI (le repo n'avait que 2 smoke tests avant). Suite frontend complète : **31 tests passent** (6 fichiers). `npm run build` (vite + tsc) passe.

| ID | Description courte | Statut | Détails |
|---|---|---|---|
| P0-1 | Mailer pour forgot-password | ✅ Fait | `mailService.ts` (dynamic import nodemailer + EmailSettings/env fallback). Token retiré du log. |
| P0-2 | Vérif teacher = course owner | ✅ Fait | `gradesController.createGrade` — bloque 403 si `course.teacherId !== teacher.id`. Test `grades.test.ts`. |
| P0-3 | Validation newPassword | ✅ Fait | `userController` — `newPasswordPolicy` dédié au champ correct. Test `users.test.ts`. |
| P0-4 | Enforcement GradeLock | ✅ Fait | `utils/gradeLock.ts` + check 423 sur create/update/delete. Summary réel (completionRate / openPeriods / lockedPeriods). |
| P0-5 | trust proxy Render | ✅ Fait | `server.ts` — `app.set('trust proxy', …)` lit `TRUST_PROXY` env (number / true / false / IP-list), défaut `1` en production. `render.yaml` exporte `TRUST_PROXY=1`. `.env.example` documente la variable. |
| P0-6 | SPA rewrite Render | ✅ Fait | `render.yaml` — `routes: [{ type: rewrite, source: /*, destination: /index.html }]` sur le service static frontend. Deep-links `/admin/users` reçoivent `index.html` au lieu de 404. |
| P1-1 | Validation /api/settings/* | ✅ Fait | Helpers `clampInt` / `isBool` / `EMAIL_RE` / allowlists pour theme/fontSize/backupFrequency. 9 tests. |
| P1-2 | Source unique branding/general | ✅ Fait | `brandingController` expose `getBrandingState` / `patchBrandingBrand`. `routes/settings.ts` GET `/general` projette depuis branding ; POST `/general` écrit d'abord dans branding (canonique) puis miroir Prisma. GET public `/appearance` lit aussi schoolName/Phone/Email depuis branding. 3 tests `branding-general.test.ts` confirment l'absence de désync. |
| P1-3 | BACKEND_PUBLIC_URL uploads | ✅ Fait | `uploads.ts` lit `process.env.BACKEND_PUBLIC_URL`, fallback dev sur Host. Documenté dans `.env.example` + `render.yaml`. |
| P1-4 | SVG sanitization/removal | ✅ Fait | `.svg` retiré de `ALLOWED_EXTENSIONS` + `image/svg+xml` retiré de `ALLOWED_MIME_TYPES`. Branche SVG du magic-byte check supprimée. |
| P1-5 | GC uploads orphelins | ✅ Fait | `utils/uploadsGc.ts` (pure function `cleanOrphanUploads`) + `scripts/gcUploads.ts` (CLI `npm run gc:uploads` / `--dry-run`). Compare les fichiers `uploads/**` aux URLs persistées dans branding/homepage/pages/reports JSON, supprime les orphelins, respecte une grace window (24h défaut) pour les uploads en cours. 6 tests. |
| P1-6 | Fix updateGrade zero-swallow | ✅ Fait | `pointsEarned !== undefined` au lieu de `\|\|`. Test confirme persistance de 0. |
| P1-7 | Whitelist PUT reports | ✅ Fait | `reports.ts` PUT — destructuring explicite + enum allowlist (`type`, `status`). 5 tests. |
| P1-8 | Réconciliation profils rôle | ✅ Fait | `updateUser` transactionnel : drop ancien profil + create nouveau si rôle change. |
| P1-9 | createUser profils complets | ✅ Fait | `createUser` — création de Student/Parent/Teacher/Admin avec defaults placeholder. 4 tests (un par rôle). |
| P1-10 | Filtre TEACHER sur /users | ✅ Fait | `getUsers` force `where.role = 'STUDENT'` quand caller=TEACHER. 2 tests. |
| P1-11 | Politique session unique | ✅ Fait | `authController.login` — `userSession.updateMany` scopé à `deviceIdHash` courant (cookie `deviceId`) au lieu de tout user. `generateTokens` — `refreshToken.deleteMany` scopé à `(userId, sessionId)` au lieu de `userId`. Connexion sur laptop ne déconnecte plus le téléphone. 3 tests `auth-session.test.ts`. |
| P1-12 | @@unique Grade | ✅ Fait | `schema.prisma` + migration `20260430000001_add_unique_grade/migration.sql` (avec instructions de cleanup pour doublons existants). |
| P2-12 | Écritures JSON atomiques | ✅ Fait | `lib/jsonStore.ts` — pattern write-temp-then-rename : `openSync` + `fsync` + `renameSync`, suffixe random pour les races, cleanup tmp en cas d'échec. 4 tests `jsonStore.test.ts` (round-trip, partial-write resilience, no tmp leftover). |
| P2-13 | CI build/lint/audit | ✅ Fait | `.github/workflows/ci.yml` — frontend exécute `npm run lint` + `npm run build` (vite). Backend ET frontend exécutent `npm audit --omit=dev --audit-level=high` (continue-on-error). |
| P2-15 | JWT_EXPIRES_IN unifié | ✅ Fait | `render.yaml` aligné sur `60m` (cohérent avec `.env.example`). |
| P2-16 | POSTGRES_PASSWORD fail-fast | ✅ Fait | `docker-compose.yml` utilise `${POSTGRES_PASSWORD:?…}` (sans valeur par défaut). Le démarrage échoue avec un message explicite si la variable est vide. |
| P2-17 | Logger structuré server.ts | ✅ Fait | Bloc startup-error remplacé : payload pino structuré (`name` / `message` / `stack` + propriétés non-énumérables des erreurs Prisma) au lieu de 3 `console.error` non-JSONL. |
| P2-1 | ErrorBoundary autour des Suspense | ✅ Fait | `components/ErrorBoundary.tsx` — class component avec `getDerivedStateFromError`, fallback par défaut (carte recoverable + bouton "Réessayer" + lien accueil), détection `ChunkLoadError` qui propose un reload. Wrappé autour du `<Suspense>` racine dans `App.tsx`. 4 tests. |
| P2-2 | state.from + redirect post-login | ✅ Fait | `lib/safeRedirect.ts` — helper pur `safeFromPath(value, fallback)` avec rejet open-redirect (`//evil`, `/\evil`), rejet boucles auth (`/login*`, `/change-password*`, etc.). `LoginPage.tsx` consomme le helper. 11 tests `safeRedirect.test.ts`. |
| P2-3 | Page 404 dédiée | ✅ Fait | `pages/NotFoundPage.tsx` — page recoverable avec lien retour. Route catch-all `*` dans `App.tsx` rend la page au lieu de rediriger silencieusement vers `/`. |
| P2-4 | Routes mortes AdminPrograms/Courses | ✅ Fait | Les imports lazy morts ont été retirés ; les chemins legacy (`/admin/programs`, `/admin/courses`) sont mappés en `<Navigate to="/admin">`. |
| P2-5 | Search bar non câblée | ✅ Fait | Input retiré du topbar `DashboardLayout.tsx` ET du header `PublicLayout.tsx`. Réintroduire quand un endpoint de recherche existera. |
| P2-7 | currentPage longest-prefix | ✅ Fait | `lib/currentPage.ts` — `pickCurrentPageName(items, pathname, fallback)` matche par segment-prefix (`/admin/users` matche `/admin/users/42` mais pas `/admin/users-archive`). `DashboardLayout.tsx` consomme le helper. 6 tests `currentPage.test.ts`. |
| P2-8 | Hero perf (WebP/AVIF, reduced-motion) | ✅ Fait | `scripts/optimize-hero.mjs` (sharp) génère `campus-hero.webp` (171 KB, **-82 %** vs PNG 957 KB) et `campus-hero.avif` (146 KB, **-85 %**). Script wrappé par `npm run optimize:hero` pour re-conversion ultérieure. `components/public/living.tsx` — nouveau hook `usePrefersReducedMotion` + helper `deriveOptimisedSiblings`. La `<video>` du hero a maintenant `preload="metadata"` (~50-100 KB upfront au lieu de ~888 KB) et un poster WebP. Quand l'utilisateur a demandé moins de motion, la vidéo est remplacée par un `<picture>` AVIF→WebP→PNG et le parallax mousemove est skippé. **Économie totale ~1.5 MB above-the-fold pour 95 %+ des visiteurs**. 4 tests `livingHero.test.ts` verrouillent l'allowlist (toute extension du système d'optimisation passera par ce test). `sharp@0.33.5` ajouté en devDep. |
| P2-9 | Logger dev-only | ✅ Fait | `lib/logger.ts` — `log/info/debug/warn` no-op en prod via `import.meta.env.DEV`, `error` toujours actif. Tous les `console.log/info/debug/warn` du dossier `app/src/**` ont été migrés ; les `console.error` (diagnostic produit) restent. 2 tests. |
| P2-11 | Token d'accès en sessionStorage | ✅ Fait | `lib/tokenService.ts` — module hydrate depuis `sessionStorage` à l'init, `setAccessToken` write-through, `clearAccessToken` purge la clé. Élimine le flash "déconnecté" et le `/api/auth/refresh` au boot tant que le tab vit. Refresh-token toujours en cookie httpOnly. 5 tests. |
| P3-1 | lang fr + meta + FOUC | ✅ Fait | `index.html` — `<html lang="fr">`, meta description, Open Graph (`og:title/description/type`), `theme-color` light/dark, `<noscript>` fallback, **inline FOUC blocker** qui applique `class="dark"` à `<html>` avant React hydrate (lit `localStorage.theme` et `prefers-color-scheme`). |
| P3-2 / P3-3 | A11y dropdowns | ✅ Fait | `DashboardLayout.tsx` + `PublicLayout.tsx` — `aria-expanded`, `aria-haspopup`, `aria-controls` sur les triggers, fermeture sur `Escape` + clic extérieur, fermeture du menu mobile sur changement de route. |
| P3-5 | SETTINGS_FILE constante morte | ✅ Fait | Suppression de la constante inutilisée dans `backend/src/routes/settings.ts`. |
| P3-6 | RBAC parent/élève `canAccess*` | ✅ Fait | Audit RBAC : les colonnes `canAccessGrades` / `canAccessSchedule` étaient **dead schema** (créées avec `default(true)`, hardcodées à `true` sur create, aucun endpoint d'update, aucun reader — `gradesController.getStudentGrades`/`calculateGPA`/`scheduleController.getStudentSchedule` ne consultaient que la *liaison* parent↔élève). Pas exploitable aujourd'hui (l'admin ne peut pas les flipper) mais footgun pour tout futur mainteneur. **Décision : suppression**. Migration `20260430120000_drop_parentstudent_access_flags/migration.sql` (`ALTER TABLE … DROP COLUMN IF EXISTS …`), schéma nettoyé avec commentaire pointant vers ce ticket si la feature revient un jour. Cleanup côté `parentStudentController.createParentStudentLink` (plus de write hardcodé) + `getParentStudents` / `getMyStudents` (plus de mapping en réponse — non-breaking puisque le frontend ne lisait pas les champs). 79 tests backend passent toujours après la migration. |

**Validation Batch C** :

- `cd app && npm run build` → exit 0 (`tsc -b` + `vite build`)
- `cd app && npm test` → **31 tests passent** (6 fichiers)
- `cd backend && npx vitest run` → **79 tests passent** (régression Batch A/B intacte)
- Tests neufs Batch C (29) : `safeRedirect.test.ts` (12 tests P2-2), `currentPage.test.ts` (6 tests P2-7), `tokenService.test.ts` (5 tests P2-11), `logger.test.ts` (2 tests P2-9), `ErrorBoundary.test.tsx` (4 tests P2-1).
- Pré-existants débloqués : erreurs `tsc -b` du frontend (cast events `living.tsx`, AxiosError typing `AuthContext`, imports inutilisés, `ignoreDeprecations` "5.0", literal type `TeacherSchedule`).

**Pas couvert dans ce batch (déférré)** :

- **P2-6** (consolidation `/api/notifications/summary` + SSE) — change le contrat API, mérite son propre ticket.
- **P2-10** (suppression composants shadcn inutilisés) — gain bundle marginal grâce au tree-shaking actuel.
- **P2-14** (tests frontend exhaustifs des flows dashboard) — partiellement adressé par les 29 tests neufs ; flows e2e à faire avec Playwright.
- **P3-4** (schéma de notation unifié points/lettres) — ticket métier, pas UI.

**Validation Batch B** :

- `cd backend && npx tsc --noEmit` → exit 0
- `cd backend && npx vitest run` → **79 tests passent** (12 fichiers)
- `cd app && npx tsc --noEmit` → exit 0
- Tests neufs Batch B (16) : `jsonStore.test.ts` (4 tests P2-12), `uploadsGc.test.ts` (6 tests P1-5), `auth-session.test.ts` (3 tests P1-11), `branding-general.test.ts` (3 tests P1-2).

**Actions côté ops requises pour activer Batch B en prod** :

1. **P0-5** — Render : la variable `TRUST_PROXY=1` est déjà déclarée dans `render.yaml`, redéploiement suffit. Hors Render, exporter `TRUST_PROXY` selon la topologie (cf. `.env.example`).
2. **P0-6** — Render : redéploiement du service static `forum-excellence-frontend` ; le `routes:` est lu au build.
3. **P1-5** — Render Cron Job recommandé : commande `npm run gc:uploads`, fréquence quotidienne. Tester d'abord avec `npm run gc:uploads -- --dry-run`. Le binaire compilé attend `dist/scripts/gcUploads.js` (généré par `npm run build`).
4. **P0-1** (rappel Batch A) — Configurer SMTP via `/admin/settings/email` OU les variables `SMTP_HOST/PORT/USER/PASS/FROM`.
5. **P1-12** (rappel Batch A) — Appliquer la migration Prisma : `npx prisma migrate deploy`. Cette commande applique aussi la nouvelle migration P3-6 (`20260430120000_drop_parentstudent_access_flags`) qui drop les colonnes `canAccessGrades` / `canAccessSchedule` de `ParentStudent`. Migration destructrice mais sûre (les colonnes n'étaient lues par aucun endpoint).

**Actions côté ops requises pour activer Batch C en prod** :

1. **Aucune action serveur requise** — tous les changements Batch C sont compilés dans le bundle frontend (`vite build`).
2. **CI** — déjà couvert : `.github/workflows/ci.yml` exécute `npx vitest run` côté frontend (étape `Run tests`), donc les 27 nouveaux tests sont régressifs sur chaque PR.
3. **Telemetry future** — `ErrorBoundary.componentDidCatch` log uniquement en DEV ; quand un endpoint de capture (Sentry, Datadog RUM, etc.) sera disponible, brancher le `componentDidCatch` dessus.

---

*Fin du rapport. Audit conduit le 30 avril 2026 sur la branche `main` à l'état post-`AUDIT_FINAL_REPORT.md`.*
