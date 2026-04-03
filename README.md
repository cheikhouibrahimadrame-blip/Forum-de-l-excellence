# Forum-de-l-excellence
A school's management websites just to try

## Full-Stack Deployment (Option 2)

This repository is configured for cloud deployment with:
- Backend API (Node.js + Prisma)
- PostgreSQL database
- Redis (required in production by the rate limiter)
- Frontend static app

### One-click deployment on Render

1. Open Render and create a new Blueprint.
2. Connect this GitHub repository.
3. Render will detect `render.yaml` and provision:
	- `forum-excellence-db` (PostgreSQL)
	- `forum-excellence-redis` (Redis)
	- `forum-excellence-api` (backend)
	- `forum-excellence-frontend` (static frontend)
4. Set required secret env vars on `forum-excellence-api`:
	- `JWT_SECRET`
	- `JWT_REFRESH_SECRET`
	- `FRONTEND_URL` (set to your frontend Render URL)
5. Trigger redeploy for the backend after saving env vars.

### Frontend on Vercel (optional alternative)

If you prefer Vercel for frontend:
1. Import the `app` folder as a Vercel project.
2. Add env var `VITE_API_BASE_URL=https://<your-backend-domain>`.
3. Deploy. SPA routing is handled by `app/vercel.json`.
