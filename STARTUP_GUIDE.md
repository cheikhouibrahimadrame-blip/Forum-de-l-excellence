# Forum de L'excellence - Standalone Startup Guide

## Quick Start

### Option 1: Start Everything at Once (Recommended)
1. Double-click `start-all.bat` in the root folder
2. Two terminal windows will open automatically
3. Backend will start on port 5001
4. Frontend will start on port 5173
5. Open browser and go to: http://localhost:5173

### Option 2: Start Services Individually

#### Backend Server
1. Open `backend` folder
2. Double-click `start-backend.bat`
3. Server will start on http://localhost:5001

#### Frontend Server
1. Open `app` folder
2. Double-click `start-frontend.bat`
3. Server will start on http://localhost:5173

## Requirements

- **Node.js** v18+ installed (from https://nodejs.org/)
- **PostgreSQL** running on your computer
- Database: `forum_excellence` created
- User with credentials in `.env` file

## Configuration

### Backend Configuration (.env)
Edit `backend/.env`:
```
DATABASE_URL=postgresql://postgres:khaliloulah66@127.0.0.1:5432/forum_excellence?connect_timeout=10
PORT=5001
INSTITUTION_DOMAINS=gmail.com,institution.edu
```

### Frontend Configuration
Edit `app/vite.config.ts` if backend port is different:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5001',
    changeOrigin: true,
  }
}
```

## Login Credentials

```
Email:    [configured admin email]
Password: [configured admin password]
```

After login, you'll be required to change password on first login.

## Troubleshooting

### Port Already in Use
If you get "port 5001 already in use" or "port 5173 already in use":
- Kill existing Node processes: `taskkill /IM node.exe /F`
- Or change the PORT in backend/.env

### Dependencies Missing
- Backend: `npm install` in the `backend` folder
- Frontend: `npm install` in the `app` folder

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Verify database `forum_excellence` exists

### SSL/Certificate Error
- On Windows, ensure you trust the PostgreSQL certificate
- Or use IP address (127.0.0.1) instead of localhost in DATABASE_URL

## File Structure

```
OKComputer_College Management System Architecture/
├── start-all.bat                 ← Click to start everything
├── backend/
│   ├── start-backend.bat         ← Click to start backend only
│   ├── server-simple.js          ← Main backend server
│   ├── .env                      ← Configuration file
│   └── node_modules/
├── app/
│   ├── start-frontend.bat        ← Click to start frontend only
│   ├── package.json
│   └── src/
└── README.md                     ← This file
```

## Features Implemented

✅ Admin authentication system
✅ Login with email & password validation
✅ Forced password change on first login
✅ Admin dashboard with sidebar navigation
✅ User management (CRUD operations)
✅ Role-based access control (ADMIN, TEACHER, STUDENT, PARENT)
✅ JWT authentication with refresh tokens

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

### Admin Users
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `PATCH /api/admin/users/:userId/activate` - Activate user
- `PATCH /api/admin/users/:userId/deactivate` - Deactivate user
- `POST /api/admin/users/:userId/reset-password` - Reset password

## Support

For issues or questions, check:
1. Backend logs in the terminal window
2. Frontend console (F12 → Console tab in browser)
3. PostgreSQL is running and accessible
4. .env file is properly configured

---

**Last Updated:** January 27, 2026
**Version:** 1.0.0
