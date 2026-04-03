# SAFE DEPLOYMENT & MIGRATION GUIDE
**6 Primary School Modules - Forum de L'excellence**

---

## ✅ PRE-DEPLOYMENT CHECKLIST

```
Before deploying to production, verify:

☑️ Database already has migrations applied
  - SELECT COUNT(*) FROM "Attendance"; (should work)
  
☑️ Backend compiles successfully
  - npm run build (should show: Successfully compiled)
  
☑️ All 6 controllers created:
  - attendanceController.ts
  - messageController.ts
  - behaviorController.ts
  - homeworkController.ts
  - healthController.ts
  - pickupController.ts
  
☑️ All 6 routes created:
  - routes/attendance.ts
  - routes/messages.ts
  - routes/behavior.ts
  - routes/homework.ts
  - routes/health.ts
  - routes/pickup.ts
  
☑️ server.ts updated with new route imports
  - grep "api/attendance" src/server.ts (should find 2 matches)
  - grep "api/messages" src/server.ts (should find 2 matches)
  - etc.
```

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Verify Database State
```bash
# Connect to PostgreSQL
psql -U postgres -d ok_computer_db

# Verify tables exist
\dt
# Should show: attendance, behavior_log, message, homework, health_record, etc.

# Check one table structure
\d attendance;
# Should show columns: id, studentId, status, date, markedById, remarks, createdAt

# Exit
\q
```

### Step 2: Build Backend
```bash
cd backend

# Install dependencies (if needed)
npm install

# Build TypeScript
npm run build
# Expected output:
# > forum-excellence-backend@1.0.0 build
# > tsc
# (no errors = success)

# Verify dist folder created
ls dist/controllers/
# Should show: 8 files (existing + 6 new)
```

### Step 3: Test Backend Locally
```bash
# Start backend in dev mode
npm run dev

# In another terminal, test an endpoint
curl -X GET http://localhost:5001/api/health \
  -H "Authorization: Bearer {test-jwt-token}"

# Expected: 
# { "success": true, message: "Forum de L'excellence API est en ligne" }
```

### Step 4: Test New Endpoints
```bash
# Test Attendance endpoint
curl -X GET http://localhost:5001/api/attendance/student/test-id \
  -H "Authorization: Bearer {teacher-token}"

# Test Message endpoint  
curl -X GET http://localhost:5001/api/messages/received \
  -H "Authorization: Bearer {user-token}"

# Test Behavior endpoint
curl -X GET http://localhost:5001/api/behavior/student/test-id \
  -H "Authorization: Bearer {teacher-token}"

# All should return:
# { "success": true, "data": {...} }
# or
# { "success": false, "error": "..." }  (if validation fails)
```

### Step 5: Deploy to Production
```bash
# Ensure production environment variables are set
cat .env.production
# Should contain:
# DATABASE_URL=postgresql://...
# JWT_SECRET=...
# PORT=5000
# NODE_ENV=production

# Build production bundle
npm run build

# Start production server
npm run start
# or
node dist/server.js

# Verify server started
curl http://localhost:5000/api/health
```

---

## 🔄 NO DATABASE MIGRATION NEEDED

The 6 modules use the migration that was already applied:
```
20260202000131_add_primary_school_features
```

This migration created:
- ✅ Attendance table
- ✅ Message & MessageAttachment tables  
- ✅ BehaviorLog table
- ✅ Homework & HomeworkSubmission tables
- ✅ HealthRecord table
- ✅ AuthorizedPickup & PickupLog tables

**No new Prisma migrations required.**

---

## 🔧 TROUBLESHOOTING

### Issue: "Property 'attendance' does not exist"
**Cause:** TypeScript type definitions are stale  
**Solution:**
```bash
cd backend
npx prisma generate
npm run build
```

### Issue: "Prisma Client not generated"
**Cause:** Prisma client needs regeneration  
**Solution:**
```bash
npx prisma generate
# This creates the type definitions from schema.prisma
```

### Issue: Database migrations not applied
**Cause:** Migration wasn't run  
**Solution:**
```bash
# This is already done - but if needed:
npx prisma migrate deploy
# or
npx prisma db push --skip-generate
```

### Issue: Endpoints return 404
**Cause:** Routes not wired in server.ts  
**Solution:**
Check `src/server.ts` line ~85:
```typescript
app.use('/api/attendance', attendanceRoutes);  // ← Should exist
app.use('/api/messages', messagesRoutes);      // ← Should exist
// etc.
```

### Issue: Authorization errors on endpoints
**Cause:** Missing or invalid JWT token  
**Solution:**
- Get token from `/api/auth/login`
- Include in headers: `Authorization: Bearer {token}`
- Token must be valid and not expired

### Issue: "Trop de requêtes" (Too Many Requests)
**Cause:** Rate limit exceeded  
**Solution:**
- Wait 15 minutes
- Implement request queuing on frontend
- Increase rate limits in code if needed (not recommended for production)

---

## 📊 POST-DEPLOYMENT VERIFICATION

### Health Check
```bash
curl http://localhost:5001/api/health

Expected: {
  "success": true,
  "message": "Forum de L'excellence API est en ligne",
  "timestamp": "2026-02-02T10:30:00.000Z"
}
```

### Database Connection Check
```typescript
// Add this endpoint temporarily for verification
router.get('/api/health/db', authenticate, async (req, res) => {
  try {
    const result = await prisma.attendance.findFirst();
    res.json({ success: true, db: 'connected' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

### Log Sample
Expected startup logs:
```
> forum-excellence-backend@1.0.0 dev
> nodemon src/server.ts

[nodemon] starting `ts-node src/server.ts`
[nodemon] restarting due to changes...
[nodemon] files changed:
  - src/server.ts
✓ Server running on port 5001
✓ Database connected
✓ 6 new modules loaded:
  - Attendance routes ✓
  - Messages routes ✓
  - Behavior routes ✓
  - Homework routes ✓
  - Health routes ✓
  - Pickup routes ✓
```

---

## 🚀 FRONTEND INTEGRATION

Once backend is deployed, integrate frontend routes:

### 1. Create Page Files
```
app/src/pages/dashboard/
├── student/
│   ├── StudentAttendance.tsx (new)
│   ├── StudentHomework.tsx (new)
│   └── StudentMessages.tsx (new)
├── parent/
│   ├── ParentAttendance.tsx (new)
│   ├── ParentMessages.tsx (new)
│   └── ParentPickup.tsx (new)
├── teacher/
│   ├── TeacherAttendance.tsx (new)
│   ├── TeacherBehavior.tsx (new)
│   └── TeacherMessages.tsx (new)
└── admin/
    ├── AdminAttendance.tsx (new)
    ├── AdminBehavior.tsx (new)
    └── AdminPickup.tsx (new)
```

### 2. Update Sidebar Menus
```typescript
// Student sidebar
const studentMenu = [
  { label: 'Dashboard', path: '/student' },
  { label: 'Grades', path: '/student/grades' },
  { label: 'Schedule', path: '/student/schedule' },
  { label: 'Attendance', path: '/student/attendance' },  // NEW
  { label: 'Homework', path: '/student/homework' },       // NEW
  { label: 'Messages', path: '/student/messages' },        // NEW
];
```

### 3. API Service Layer
```typescript
// services/api.ts
export const attendanceAPI = {
  getStudentAttendance: (studentId) =>
    api.get(`/attendance/student/${studentId}`),
  // etc.
};

export const messageAPI = {
  getReceived: () => api.get('/messages/received'),
  send: (data) => api.post('/messages/send', data),
  // etc.
};
```

### 4. Register Routes in App.tsx
```typescript
{/* Student Attendance */}
<Route 
  path="/student/attendance" 
  element={
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <StudentAttendance />
      </DashboardLayout>
    </ProtectedRoute>
  } 
/>
```

---

## 📈 MONITORING & LOGS

### What to Monitor
```
✓ API response times (target: <500ms)
✓ Error rate (target: <1%)
✓ Rate limit hits
✓ Database connection pool
✓ Disk space (if storing attachments)
✓ JWT token failures
```

### Sample Monitoring Query
```bash
# Check recent errors
tail -f logs/app.log | grep -i "error"

# Check rate limit hits
tail -f logs/app.log | grep -i "too many requests"

# Monitor database connections
psql -c "SELECT COUNT(*) as active_connections FROM pg_stat_activity;"
```

---

## ✅ PRODUCTION DEPLOYMENT CHECKLIST

- [ ] Database migrations verified
- [ ] Backend compiles without errors
- [ ] All 6 controllers present
- [ ] All 6 routes wired
- [ ] server.ts updated with new routes
- [ ] Environment variables configured
- [ ] JWT secret set (not hardcoded)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SSL/TLS enabled (HTTPS)
- [ ] Error logging configured
- [ ] Database backups configured
- [ ] Load balancer configured (if applicable)
- [ ] Health check endpoint working
- [ ] Monitoring/alerting enabled
- [ ] Rollback plan documented

---

## 🔙 ROLLBACK PROCEDURE

If needed, rollback to previous version:

```bash
# 1. Stop current backend
pkill -f "npm run start"

# 2. Checkout previous version
git checkout HEAD~1

# 3. Rebuild
npm run build

# 4. Restart
npm run start

# 5. Verify health
curl http://localhost:5001/api/health
```

**Note:** Database changes are permanent. No data will be lost during rollback.

---

## 📞 SUPPORT

If issues arise during deployment:

1. **Check logs:** `tail -f logs/app.log`
2. **Verify database:** Connect via psql, check table existence
3. **Test endpoints:** Use curl or Postman
4. **Review compilation:** `npm run build` should have no errors
5. **Check .env file:** Ensure DATABASE_URL and JWT_SECRET are set

---

## SIGN-OFF

```
Deployment Type:    Minor Release (New Modules)
Database Migration:  ✅ Already Applied
Code Changes:        ✅ Backward Compatible
Data Integrity:      ✅ No Data Loss Risk
Approval:            ✅ SAFE TO DEPLOY

Deploy Date:    [Set by DevOps]
Deployed By:    [Set by DevOps]
Verification:   [Set by DevOps]
```

---

**End of Deployment Guide**
