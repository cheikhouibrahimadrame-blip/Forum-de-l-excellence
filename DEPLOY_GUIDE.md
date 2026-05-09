# Guide de déploiement — Forum de l'Excellence

Cible : **frontend + backend en production sur 100% free tier**.

| Composant | Hébergeur | Coût |
|---|---|---|
| Frontend statique (Vite/React) | Render Static Site | **Gratuit** |
| Backend API (Express/Prisma) | Render Web Service (free) | **Gratuit** (sleep après 15 min inactivité) |
| Postgres | [Neon](https://neon.tech) | **Gratuit** (0.5 GB) |
| Redis | [Upstash](https://upstash.com) | **Gratuit** (256 MB, 10K cmd/jour) |

Temps total : **~30 minutes** la première fois.

---

## 1. Créer la base Postgres sur Neon (5 min)

1. Va sur https://console.neon.tech → **Sign up** (avec GitHub, c'est le plus rapide).
2. Crée un projet :
   - **Name** : `forum-excellence`
   - **Postgres version** : 16
   - **Region** : Frankfurt (`eu-central-1`) ou Paris (`eu-west-3`) — la plus proche de Mbour.
3. Une fois créé, sur la page du projet, copie la **Connection string** (onglet "Connection Details") en mode **Pooled connection**. Elle ressemble à :
   ```
   postgresql://forum_user:xxx@ep-xxx-pooler.eu-central-1.aws.neon.tech/forum_excellence?sslmode=require
   ```
   Garde-la dans un bloc-notes — c'est ton **`DATABASE_URL`**.

> ℹ️ Pas besoin d'importer `forum_excellence_neon.sql` à la main : Prisma va créer le schéma automatiquement au premier déploiement via `prisma migrate deploy`.

---

## 2. Créer Redis sur Upstash (3 min)

1. Va sur https://console.upstash.com → **Sign up**.
2. **Create Database** :
   - **Name** : `forum-excellence-redis`
   - **Type** : Regional (pas Global, plus stable pour le free tier)
   - **Region** : `eu-west-1` (Ireland) ou la plus proche
3. Une fois créé, sur la page de la DB, section "Connect to your database" → **Node.js** → copie la valeur de `redis://...`. Tu auras une **TLS URL** qui commence par `rediss://` (deux `s`). C'est cette version qu'il te faut.
   ```
   rediss://default:xxxxxxxx@usw1-xxx.upstash.io:6379
   ```
   C'est ton **`REDIS_URL`**.

---

## 3. Pousser le code sur GitHub (2 min)

Le repo est déjà connecté à `github.com/cheikhouibrahimadrame-blip/Forum-de-l-excellence`. Il faut juste pousser les changements récents (mon nouveau `render.yaml`, les fixes UI mobile, etc.) :

```powershell
git add .
git commit -m "deploy: free-tier render blueprint + mobile responsive fixes"
git push origin main
```

---

## 4. Générer les secrets JWT (1 min)

Sur ta machine, lance ces 2 commandes. **Garde le résultat** dans ton bloc-notes.

```powershell
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT_REFRESH_SECRET (relance la même commande, tu obtiens une 2e valeur différente)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Tu obtiens 2 chaînes hex de 128 caractères. **Ne les réutilise pas entre `JWT_SECRET` et `JWT_REFRESH_SECRET`** — il en faut deux différentes.

---

## 5. Déployer sur Render via Blueprint (10 min)

1. Va sur https://dashboard.render.com → **Sign up** (avec GitHub, plus rapide).
2. **New** → **Blueprint**.
3. **Connect a repository** → autorise Render à lire ton GitHub → sélectionne `Forum-de-l-excellence`.
4. Render détecte automatiquement `render.yaml` et te montre les 2 services (`forum-excellence-api` + `forum-excellence-frontend`).
5. Clique **Apply**. Render va créer les services mais te bloquer en attente des env vars `sync: false`.

### Remplir les env vars du backend (`forum-excellence-api`)

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | la connection string Neon de l'étape 1 |
| `REDIS_URL` | la `rediss://...` URL Upstash de l'étape 2 |
| `JWT_SECRET` | la 1re chaîne hex de l'étape 4 |
| `JWT_REFRESH_SECRET` | la 2e chaîne hex de l'étape 4 |
| `FRONTEND_URL` | `https://forum-excellence-frontend.onrender.com` (Render te donne le sous-domaine exact à droite du nom du service) |
| `BACKEND_PUBLIC_URL` | `https://forum-excellence-api.onrender.com` (idem) |

### Remplir les env vars du frontend (`forum-excellence-frontend`)

| Variable | Valeur |
|---|---|
| `VITE_API_BASE_URL` | la même valeur que `BACKEND_PUBLIC_URL` ci-dessus |

6. Clique **Save Changes** sur chaque service. Render relance automatiquement le build.

---

## 6. Premier build & vérification (10 min)

- L'API met **5–8 minutes** à build (npm ci + Prisma generate + tsc + migrate deploy).
- Le frontend met **2–3 minutes**.
- Surveille les logs en direct dans le dashboard Render. À la fin :
  - Backend : `Server running on port 10000` (Render assigne un port dynamique).
  - Frontend : `Your site is live ✨`.

### Tester

1. Ouvre `https://forum-excellence-frontend.onrender.com` → la page d'accueil doit s'afficher.
2. Ouvre `https://forum-excellence-api.onrender.com/api/health` → tu dois voir un JSON `{"status":"ok",...}`.
3. Essaie de te connecter avec un compte admin de seed (voir `forum_excellence.sql` ou `STARTUP_GUIDE.md` pour les credentials par défaut).

---

## 7. Pièges connus & solutions

### ❌ "Redis required in production. Startup aborted."
La `REDIS_URL` est mal copiée. Vérifie :
- Elle commence par `rediss://` (TLS), pas `redis://`.
- Le mot de passe ne contient pas d'espace.

### ❌ Le frontend charge mais le login échoue silencieusement
- Ouvre la console DevTools → onglet Network. Si tu vois des requêtes vers `localhost:5001`, c'est que `VITE_API_BASE_URL` n'a pas été défini AVANT le build du frontend. Rebuild manuellement le frontend depuis le dashboard Render après avoir mis la variable.
- CORS : si tu vois des erreurs CORS, vérifie que `FRONTEND_URL` côté backend est bien l'URL Render exacte (avec `https://`, sans slash final).

### ❌ Premier appel API lent (~30 sec)
Normal sur free tier Render — le backend dort après 15 min d'inactivité, et le 1er hit le réveille. Cela passe à <1 sec sur les hits suivants.

### ❌ Build Prisma échoue : "Cannot find module @prisma/client"
- Render exécute `npm ci` qui n'installe que les dépendances. `npx prisma generate` doit être dans le `buildCommand` (déjà le cas dans `render.yaml`). Si tu vois encore l'erreur, vérifie que le push a bien envoyé `prisma/schema.prisma`.

---

## 8. Mises à jour futures

Une fois la config initiale faite, déployer une nouvelle version = juste :

```powershell
git push origin main
```

Render rebuild et redéploie automatiquement le backend ET le frontend en parallèle.

---

## Architecture finale

```
[Visiteur]
    │
    │  https://forum-excellence-frontend.onrender.com
    ▼
[Render Static]                  [Render Web Service]
  Vite bundle ─── HTTPS API ───►  Express + Prisma
                                       │
                                       ├── Postgres (Neon)
                                       └── Redis    (Upstash)
```
