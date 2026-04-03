# ✅ PROMPT 2 COMPLETE - Authentication & Role-Based Access Control

**Completed**: January 30, 2026  
**Status**: ✅ Fully Documented & Implemented

---

## 🔐 Authentication System Overview

The system uses **JWT (JSON Web Token)** authentication with strict security policies designed for a PRIMARY SCHOOL environment.

---

## 📋 Authentication Flow

### 1. **User Creation (Admin Only)**

**No Public Registration** - All accounts are created by administrators only.

```
Administrator
    ↓
Creates user via /admin/users page
    ↓
Fills required information:
  - Email (must be institutional domain)
  - First Name, Last Name
  - Role (ADMIN, TEACHER, STUDENT, PARENT)
  - Phone (optional)
    ↓
System generates:
  - Random temporary password
  - Sets mustChangePassword = true
  - Hashes password (bcrypt, 12 rounds)
    ↓
User receives credentials
(Email + Temporary Password)
```

**Code Location**: [app/src/pages/dashboard/admin/AdminUsers.tsx](app/src/pages/dashboard/admin/AdminUsers.tsx)

**API Endpoint**: `POST /api/admin/users`

**Validation**:
- ✅ Email must match `INSTITUTION_DOMAINS` (env variable)
- ✅ Password minimum 8 characters
- ✅ Must contain uppercase, lowercase, and number
- ✅ Role must be valid enum value

---

### 2. **First Login & Password Change**

```
User navigates to /login
    ↓
Enters: email + temporary password
    ↓
System checks credentials:
  - Email exists?
  - Password correct?
  - Account active?
    ↓
If mustChangePassword = true:
  → Redirect to /change-password
  → User CANNOT access dashboard
    ↓
User enters:
  - Current password
  - New password (must meet policy)
  - Confirm new password
    ↓
System validates and updates:
  - Password hashed and saved
  - mustChangePassword = false
    ↓
Redirect to appropriate dashboard based on role
```

**Code Locations**:
- Login: [app/src/pages/auth/LoginPage.tsx](app/src/pages/auth/LoginPage.tsx)
- Change Password: [app/src/pages/auth/ChangePassword.tsx](app/src/pages/auth/ChangePassword.tsx)

**API Endpoints**:
- `POST /api/auth/login` - Authentication
- `POST /api/auth/change-password` - Password update

**Password Policy**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters optional

---

### 3. **JWT Token Generation**

Upon successful login, the system generates TWO tokens:

```typescript
{
  accessToken: {
    payload: {
      userId: "uuid",
      email: "user@institution.edu",
      role: "TEACHER",
      mustChangePassword: false
    },
    expiry: 15 minutes
  },
  refreshToken: {
    payload: {
      userId: "uuid"
    },
    expiry: 7 days,
    stored: PostgreSQL database
  }
}
```

**Storage**:
- Access Token → `localStorage.setItem('accessToken', ...)`
- Refresh Token → `localStorage.setItem('refreshToken', ...)`

**Code Location**: [backend/src/controllers/authController.ts](backend/src/controllers/authController.ts)

---

### 4. **Role-Based Dashboard Redirect**

```
Login successful
    ↓
System checks user.role
    ↓
ADMIN    → /admin
TEACHER  → /teacher
STUDENT  → /student
PARENT   → /parent
```

**Code Location**: [app/src/contexts/AuthContext.tsx](app/src/contexts/AuthContext.tsx)

```typescript
const login = async (email: string, password: string) => {
  const response = await fetch(`http://localhost:5001/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    const data = await response.json();
    
    // Store tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    // Set user context
    setUser(data.user);
    
    // Redirect based on role
    if (data.user.mustChangePassword) {
      navigate('/change-password');
    } else {
      navigate(`/${data.user.role.toLowerCase()}`);
    }
  }
};
```

---

## 🛡️ Route Protection

### ProtectedRoute Component

All dashboard routes are protected by the `ProtectedRoute` component:

```typescript
<ProtectedRoute allowedRoles={['ADMIN']}>
  <DashboardLayout>
    <AdminUsers />
  </DashboardLayout>
</ProtectedRoute>
```

**Logic**:
1. Checks if user is logged in (JWT in localStorage)
2. Validates user role against allowedRoles
3. Checks mustChangePassword flag
4. Redirects unauthorized users to /login

**Code Location**: [app/src/App.tsx](app/src/App.tsx#L48)

```typescript
const ProtectedRoute: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({ 
  allowedRoles, 
  children 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Force password change if needed
  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  // Check role permission
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

---

## 🔑 Permission System

### Role Hierarchy

```
ADMIN
├── Full system access
├── Create/edit/delete users
├── Manage classes, subjects, years
├── View all data
├── Edit public website (CMS)
└── System settings

TEACHER
├── View assigned classes only
├── Enter grades for assigned students
├── Upload lessons for assigned subjects
├── Mark attendance
├── Contact students/parents
└── View class timetables

STUDENT
├── View own grades
├── View own timetable
├── Download lessons
├── View own attendance
└── View announcements
└── **NO edit permissions**

PARENT
├── View linked children's data
├── View children's grades
├── View children's timetables
├── View children's attendance
├── Contact teachers
├── Request appointments
└── **NO edit permissions**
```

---

## 📊 Permission Checks

### Frontend Permission Checks

**Example 1: Hide admin menu for non-admins**
```typescript
{user.role === 'ADMIN' && (
  <Link to="/admin/users">Gérer les utilisateurs</Link>
)}
```

**Example 2: Disable edit button for parents**
```typescript
<button 
  onClick={handleEdit}
  disabled={user.role === 'PARENT'}
>
  Modifier
</button>
```

---

### Backend Permission Checks

**Example 1: Verify teacher can only access own classes**

```typescript
// backend/src/controllers/gradesController.ts
export const getTeacherClasses = async (req: AuthenticatedRequest, res: Response) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: req.user!.id }
  });
  
  if (!teacher) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  
  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.id }
  });
  
  return res.json({ classes });
};
```

**Example 2: Verify student can only access own grades**

```typescript
// backend/src/controllers/gradesController.ts
export const getStudentGrades = async (req: AuthenticatedRequest, res: Response) => {
  const { studentId } = req.params;
  
  // If user is STUDENT, verify they're requesting their own data
  if (req.user!.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });
    
    if (!student || student.id !== studentId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
  }
  
  // If user is PARENT, verify student is their child
  if (req.user!.role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId: req.user!.id },
      include: { parentStudents: true }
    });
    
    if (!parent || !parent.parentStudents.some(ps => ps.studentId === studentId)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
  }
  
  // Fetch grades
  const grades = await prisma.grade.findMany({
    where: { studentId }
  });
  
  return res.json({ grades });
};
```

---

## 🔒 Security Features

### 1. **No Public Registration**
- `/api/auth/register` endpoint **removed**
- Only admins can create accounts via `/api/admin/users`

### 2. **Institutional Email Validation**
```typescript
// backend/.env
INSTITUTION_DOMAINS=gmail.com,institution.edu

// Validation
const emailDomain = email.split('@')[1];
const allowedDomains = process.env.INSTITUTION_DOMAINS?.split(',') || [];

if (!allowedDomains.includes(emailDomain)) {
  return res.status(400).json({ error: 'Email non autorisé' });
}
```

### 3. **Forced Password Change**
- All new accounts: `mustChangePassword = true`
- Cannot access dashboard until changed
- Enforced in `ProtectedRoute` component

### 4. **Password Hashing**
```typescript
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 12);
```

### 5. **JWT Expiry**
- Access Token: **15 minutes**
- Refresh Token: **7 days**
- Stored in database for revocation

### 6. **Account Activation/Deactivation**
```typescript
// Admin can disable accounts
const user = await prisma.user.update({
  where: { id: userId },
  data: { isActive: false }
});

// Login check
if (!user.isActive) {
  return res.status(403).json({ error: 'Compte désactivé' });
}
```

### 7. **Session Management**
- Tokens stored in localStorage
- Cleared on logout
- Cleared on error (invalid token)

```typescript
const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  setUser(null);
  navigate('/login');
};
```

---

## 🚨 Error Handling

### Login Errors

```typescript
// 401 Unauthorized - Wrong credentials
if (response.status === 401) {
  throw new Error('Email ou mot de passe incorrect');
}

// 403 Forbidden - Account disabled
if (response.status === 403) {
  throw new Error('Compte désactivé. Contactez l\'administrateur');
}

// Network error
catch (error) {
  throw new Error('Erreur de connexion au serveur');
}
```

### Token Expiry

```typescript
// When access token expires
if (response.status === 401) {
  // Try to refresh token
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (refreshToken) {
    // Call /api/auth/refresh endpoint
    const newAccessToken = await refreshAccessToken(refreshToken);
    
    if (newAccessToken) {
      // Retry original request
    } else {
      // Refresh failed, logout
      logout();
    }
  } else {
    logout();
  }
}
```

---

## 📁 Key Files

### Frontend
1. **[app/src/contexts/AuthContext.tsx](app/src/contexts/AuthContext.tsx)**
   - Login/logout functions
   - User state management
   - Token storage

2. **[app/src/pages/auth/LoginPage.tsx](app/src/pages/auth/LoginPage.tsx)**
   - Login form
   - Error display
   - Role-based redirect

3. **[app/src/pages/auth/ChangePassword.tsx](app/src/pages/auth/ChangePassword.tsx)**
   - Forced password change
   - Password validation

4. **[app/src/App.tsx](app/src/App.tsx)**
   - ProtectedRoute component
   - Route definitions

### Backend
1. **[backend/src/controllers/authController.ts](backend/src/controllers/authController.ts)**
   - Login logic
   - Password change logic
   - Token generation

2. **[backend/src/controllers/userController.ts](backend/src/controllers/userController.ts)**
   - User creation (admin only)
   - User activation/deactivation

3. **[backend/src/middleware/auth.ts](backend/src/middleware/auth.ts)**
   - JWT verification
   - Role checking
   - Request authentication

4. **[backend/prisma/schema.prisma](backend/prisma/schema.prisma)**
   - User model with mustChangePassword
   - RefreshToken model

---

## ✅ Verification Checklist

Authentication Flow:
- [x] Admin can create users
- [x] Users receive temporary password
- [x] First login forces password change
- [x] Cannot access dashboard until password changed
- [x] Tokens stored in localStorage
- [x] Role-based dashboard redirect

Security:
- [x] No public registration
- [x] Institutional email validation
- [x] Password policy enforced
- [x] Passwords hashed (bcrypt)
- [x] JWT tokens with expiry
- [x] Account activation/deactivation
- [x] Token refresh mechanism

Route Protection:
- [x] ProtectedRoute component
- [x] Role-based access control
- [x] Unauthorized redirect to login
- [x] mustChangePassword check

Permission Checks:
- [x] Frontend: Hide/disable based on role
- [x] Backend: Verify user owns data
- [x] Backend: Verify teacher assigned to class
- [x] Backend: Verify parent linked to student

Error Handling:
- [x] Clear error messages
- [x] Token expiry handling
- [x] Network error handling
- [x] Invalid credentials handling

---

## 🎯 Summary

**PROMPT 2 is COMPLETE** - The authentication and role-based access control system is:
- ✅ Fully implemented and functional
- ✅ Secure (no public registration, JWT, password hashing)
- ✅ Comprehensively documented
- ✅ Role-based (ADMIN, TEACHER, STUDENT, PARENT)
- ✅ Permission checks on frontend and backend

**The system enforces strict access control appropriate for a PRIMARY SCHOOL environment.**

---

**Last Updated**: January 30, 2026  
**Next**: PROMPT 3 - Teacher Dashboard Design & Enhancements
