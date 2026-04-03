# Admin User Management Implementation

## Overview
Complete implementation of admin-only user management system with strict authentication controls for the College Management System.

## Architecture Confirmation

### 1. Authentication Rules (STRICT)
✅ **NO public registration** - `/auth/register` endpoint removed
✅ **Admin-only account creation** - All users created via `/api/admin/users` endpoint
✅ **Institutional email enforcement** - Domain validation on login and user creation (configured via `INSTITUTION_DOMAINS` env variable)
✅ **Mandatory password change on first login** - `mustChangePassword` flag forces password reset

### 2. Database Schema
```sql
User Model:
- id: String (UUID)
- email: String (unique)
- password: String (hashed with bcrypt, 12 rounds)
- firstName: String
- lastName: String
- phone: String? (optional)
- role: Role (STUDENT | PARENT | TEACHER | ADMIN)
- isActive: Boolean (default: true)
- mustChangePassword: Boolean (default: true) ✨ NEW
- createdAt: DateTime
- updatedAt: DateTime
```

### 3. Backend API Endpoints

#### User Management (Admin-only)
All routes require `authenticate` + `authorize(['ADMIN'])` middleware

- **POST /api/admin/users** - Create user
  - Validates institutional email domain
  - Enforces password policy (8+ chars, uppercase, lowercase, digit)
  - Sets `mustChangePassword = true` by default
  - Returns 201 with user data

- **GET /api/admin/users** - List users with filters
  - Query params: `role`, `status` (active/disabled/mustChangePassword), `search`
  - Returns array of users with `mustChangePassword` field

- **GET /api/admin/users/:id** - Get user details
  - Returns user with `mustChangePassword` field

- **PUT /api/admin/users/:id** - Update user
  - Validates email domain on email changes
  - Can toggle `isActive` status

- **PATCH /api/admin/users/:id/activate** - Activate user
  - Sets `isActive = true`

- **PATCH /api/admin/users/:id/deactivate** - Deactivate user
  - Sets `isActive = false`, `mustChangePassword = true`
  - Revokes all refresh tokens

- **POST /api/admin/users/:id/reset-password** - Reset password
  - Enforces password policy
  - Sets `mustChangePassword = true`
  - Revokes all refresh tokens

#### Authentication Endpoints
- **POST /api/auth/login**
  - Validates institutional email domain
  - Returns `mustChangePassword` flag in response
  - Returns JWT access token (15min) + refresh token (7 days)

- **POST /api/auth/change-password**
  - Validates current password
  - Enforces password policy on new password
  - Clears `mustChangePassword` flag
  - Revokes all refresh tokens
  - Returns new access token

- **GET /api/auth/me**
  - Returns current user with `mustChangePassword` field

### 4. Frontend Implementation

#### Admin User Management Page (`/admin/users`)
Located at: `app/src/pages/dashboard/admin/AdminUsers.tsx`

**Features:**
- ✅ User creation modal with form:
  - Email input (institutional domain)
  - First name / Last name
  - Phone (optional)
  - Role selector (STUDENT | PARENT | TEACHER | ADMIN)
  - Temporary password input (8+ chars)
  - Auto-informs user must change password on first login

- ✅ User list table:
  - Search by name or email
  - Filter by role (all/STUDENT/PARENT/TEACHER/ADMIN)
  - Filter by status (all/active/disabled/mustChangePassword)
  - Displays: name, email, role badge, status badge

- ✅ Status badges:
  - **Actif** (green) - Active user who has changed password
  - **Désactivé** (red) - Inactive user
  - **Doit changer MDP** (amber) - Active but must change password

- ✅ Action buttons per user:
  - Activate/Deactivate toggle (UserCheck/UserX icons)
  - Reset password (Key icon) - prompts for new temp password

**API Integration:**
- `GET /api/admin/users` on component mount
- `POST /api/admin/users` for user creation
- `PATCH /api/admin/users/:id/activate` or `/deactivate`
- `POST /api/admin/users/:id/reset-password`

#### Change Password Flow (`/change-password`)
Located at: `app/src/pages/auth/ChangePassword.tsx`

**Features:**
- ✅ Forced password change page (no escape)
- ✅ Form inputs:
  - Current password (with show/hide toggle)
  - New password (with show/hide toggle)
  - Confirm new password (with show/hide toggle)
- ✅ Password policy display:
  - At least 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
- ✅ Client-side validation:
  - Passwords match
  - New password != current password
  - Password meets policy
- ✅ API call to `POST /api/auth/change-password`
- ✅ On success: redirects to role-based dashboard

#### Login Page Updates (`/login`)
Located at: `app/src/pages/auth/LoginPage.tsx`

**Changes:**
- ✅ After successful login, checks `mustChangePassword` flag
- ✅ If true, redirects to `/change-password`
- ✅ Otherwise, redirects to role-based dashboard

#### Protected Route Updates (`App.tsx`)
Located at: `app/src/App.tsx`

**Changes:**
- ✅ Added `mustChangePassword?: boolean` to User interface
- ✅ ProtectedRoute component checks `user.mustChangePassword`
- ✅ If true, redirects to `/change-password` before allowing dashboard access
- ✅ Added `/change-password` route (no layout, full-screen)

### 5. Environment Configuration

**Backend (.env):**
```env
# Server
PORT=5000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/forum_db

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# Institution
INSTITUTION_DOMAINS=institution.edu,college.edu
FRONTEND_URL=http://localhost:5173
```

**Frontend (vite env):**
```env
VITE_BACKEND_PORT=5000  # or 5001 for VS Code
```

### 6. Security Features

#### Password Policy (enforced everywhere)
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- Bcrypt hashing with 12 rounds

#### Token Management
- Access tokens: 15 minutes lifespan
- Refresh tokens: 7 days lifespan
- Tokens revoked on:
  - User deactivation
  - Password reset by admin
  - Password change by user
- JWT stored in localStorage (access) + cookies (refresh)

#### Domain Enforcement
- Login validates email domain against `INSTITUTION_DOMAINS`
- User creation validates email domain
- User updates validate email domain if changed
- Error message: "Email non autorisé. Seuls les emails institutionnels sont acceptés."

#### Role-Based Access Control
- All admin routes require `ADMIN` role
- ProtectedRoute component checks role before rendering
- Unauthorized users redirected to home

### 7. User Flow Examples

#### Admin Creates New Student
1. Admin navigates to `/admin/users`
2. Clicks "Créer un utilisateur"
3. Fills form:
   - Email: `fatou.ndiaye@institution.edu`
   - First/Last name: Fatou Ndiaye
   - Role: STUDENT
   - Temporary password: `TempPass123`
4. Submits → Backend creates user with `mustChangePassword = true`
5. Admin shares credentials with student

#### Student First Login
1. Student navigates to `/login`
2. Enters email + temporary password
3. Login succeeds → `mustChangePassword = true` detected
4. Redirected to `/change-password`
5. Enters current password + new password (must meet policy)
6. Submits → Backend clears `mustChangePassword`, revokes refresh tokens
7. Redirected to `/student` dashboard

#### Admin Resets User Password
1. Admin navigates to `/admin/users`
2. Finds user, clicks reset password button (Key icon)
3. Prompted for new temporary password
4. Submits → Backend sets `mustChangePassword = true`, revokes tokens
5. User logged out, must login with new temp password
6. User forced to `/change-password` flow again

#### Admin Deactivates User
1. Admin navigates to `/admin/users`
2. Finds user, clicks deactivate button (UserX icon)
3. Backend sets `isActive = false`, `mustChangePassword = true`, revokes tokens
4. User cannot login (inactive account error)
5. Admin can reactivate later with activate button (UserCheck icon)

## Testing Checklist

### Backend API Tests
- [ ] POST /api/admin/users creates user with mustChangePassword=true
- [ ] POST /api/admin/users rejects non-institutional email
- [ ] POST /api/admin/users enforces password policy
- [ ] GET /api/admin/users returns users with mustChangePassword field
- [ ] GET /api/admin/users filters by status=mustChangePassword
- [ ] PATCH /api/admin/users/:id/deactivate sets mustChangePassword=true
- [ ] POST /api/admin/users/:id/reset-password sets mustChangePassword=true
- [ ] POST /api/auth/login rejects non-institutional email
- [ ] POST /api/auth/login returns mustChangePassword flag
- [ ] POST /api/auth/change-password clears mustChangePassword flag
- [ ] POST /api/auth/change-password revokes refresh tokens

### Frontend UI Tests
- [ ] /admin/users shows create user modal
- [ ] Create user form validates email domain (client-side)
- [ ] User list displays mustChangePassword status badge
- [ ] Activate/deactivate buttons toggle user status
- [ ] Reset password button prompts for new password
- [ ] /login redirects to /change-password if mustChangePassword=true
- [ ] /change-password enforces password policy
- [ ] /change-password redirects to dashboard on success
- [ ] ProtectedRoute redirects to /change-password if mustChangePassword=true

### Integration Tests
- [ ] Admin creates user → user logs in → forced to change password → redirected to dashboard
- [ ] Admin resets password → user logs in → forced to change password
- [ ] Admin deactivates user → user cannot login
- [ ] User changes password → refresh tokens revoked → must re-login

## Files Changed

### Backend
- `backend/src/routes/auth.ts` - Removed register route, added change-password
- `backend/src/controllers/authController.ts` - Added changePassword, updated login to return mustChangePassword
- `backend/src/controllers/userController.ts` - Added createUser, updated all handlers for mustChangePassword
- `backend/src/routes/users.ts` - Added POST / route for createUser
- `backend/prisma/schema.prisma` - Added mustChangePassword field to User model
- `backend/prisma/migrations/20260127130000_add_must_change_password/migration.sql` - Migration SQL
- `backend/.env` - Added INSTITUTION_DOMAINS

### Frontend
- `app/src/pages/dashboard/admin/AdminUsers.tsx` - Complete rewrite with API integration
- `app/src/pages/auth/ChangePassword.tsx` - New forced password change page
- `app/src/pages/auth/LoginPage.tsx` - Updated to check mustChangePassword and redirect
- `app/src/contexts/AuthContext.tsx` - Added mustChangePassword to User interface
- `app/src/App.tsx` - Added /change-password route, updated ProtectedRoute to check mustChangePassword

## Next Steps (Not Yet Implemented)

### Pending Features
1. **Classes & Subjects Management**
   - Admin page for creating/editing classes (CI, CP, CE1, CE2, CM1, CM2)
   - Subject assignment (Mathématiques, Français, SVT, etc.)
   - Teacher assignment to classes

2. **Academic Years Management**
   - Create/activate academic years
   - Trimester configuration

3. **Parent-Student Linking**
   - Admin interface to link parent accounts to student accounts
   - Multiple students per parent support

4. **Schedules Management**
   - Weekly schedule editor
   - Class-specific timetables

5. **Grades Input/View**
   - Teacher grade entry interface
   - Grade locking by trimester

6. **Appointments System**
   - Request/approve appointments
   - Calendar view

## Documentation
- See [SECURITY_VALIDATION.md](SECURITY_VALIDATION.md) for security audit
- See [TESTING_GUIDE.md](TESTING_GUIDE.md) for test procedures
- See [QUICK_START.md](QUICK_START.md) for development setup

## Support
For questions or issues, refer to the main [README.md](README.md) or architecture documentation in [INDEX.md](INDEX.md).
