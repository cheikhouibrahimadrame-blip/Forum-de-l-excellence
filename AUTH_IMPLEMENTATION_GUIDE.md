# Authentication System Implementation Guide

## Part 1: Frontend Integration

### 1.1 Token Service (already correct)

```typescript
// app/src/lib/tokenService.ts
let accessToken = '';

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string) => {
  accessToken = token;
  console.log('[TokenService] Access token set');
};
export const clearAccessToken = () => {
  accessToken = '';
  console.log('[TokenService] Access token cleared');
};
```

### 1.2 Axios Instance (UPDATED)

```typescript
// app/src/lib/api.ts - Key points:
// ✅ withCredentials: true
// ✅ Request interceptor adds Authorization header
// ✅ Response interceptor handles 401 with request queue
// ✅ Failed requests queued while refresh in progress
// ✅ Single refresh execution (inFlight flag)
// ✅ Automatic logout on refresh failure
```

### 1.3 Login Component Example

```typescript
// app/src/pages/LoginPage.tsx
import { api, AUTH_LOGOUT_EVENT } from '@/lib/api';
import { setAccessToken } from '@/lib/tokenService';

export const LoginPage = () => {
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.status === 200 && response.data.success) {
        // Store access token in memory
        setAccessToken(response.data.data.accessToken);
        
        // Refresh token automatically set as httpOnly cookie by browser
        console.log('✅ Login successful');
        navigate('/dashboard');
      } else {
        // Invalid credentials
        setError(response.data.error || 'Erreur de connexion');
      }
    } catch (error) {
      setError('Erreur serveur');
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(email, password);
    }}>
      {/* Form fields */}
    </form>
  );
};
```

### 1.4 Protected Route Example

```typescript
// app/src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { api, AUTH_LOGOUT_EVENT } from '@/lib/api';
import { clearAccessToken } from '@/lib/tokenService';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await api.get('/api/auth/me');
        
        if (response.status === 200 && response.data.success) {
          setIsAuthenticated(true);
        } else {
          // 401 = Invalid token
          clearAccessToken();
          navigate('/login');
        }
      } catch (error) {
        clearAccessToken();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    // Listen for logout events
    window.addEventListener(AUTH_LOGOUT_EVENT, () => {
      navigate('/login');
    });

    verifyAuth();
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (!isAuthenticated) return null;
  
  return children;
};
```

---

## Part 2: Backend Configuration

### 2.1 Environment Variables (.env for development)

```env
# Database
DATABASE_URL="postgresql://postgres:khaliloulah66@127.0.0.1:5432/forum_excellence"

# JWT (CHANGE THESE VALUES IN PRODUCTION!)
JWT_SECRET=dev-secret-minimum-32-characters-12345
JWT_REFRESH_SECRET=dev-refresh-secret-minimum-32-characters-54321

# Token expiry
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Allowed domains for login
INSTITUTION_DOMAINS=gmail.com

# Redis (optional for dev, required for production)
REDIS_URL=redis://localhost:6379
```

### 2.2 Production Environment (.env.production)

```env
# SECURITY: Use values from a secrets manager (AWS Secrets Manager, etc.)
NODE_ENV=production
PORT=5001

# Database with connection pooling
DATABASE_URL="postgresql://user:strong-password@secure-db-host:5432/forum_excellence?sslmode=require&max_connections=20"

# JWT Secrets - Generated with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=a7f3c8e1b2d9f4a6c5e7b1d3f8a2c4e6f9b1d3a5c7e9f1b3d5a7c9e1f3b5
JWT_SECRET_PREVIOUS=
JWT_REFRESH_SECRET=b8g4d9e2c3f5h7j9k1l3m5n7o9p1q3r5s7t9u1v3w5x7y9z1a3b5c7d9e1f3
JWT_REFRESH_SECRET_PREVIOUS=

# Token expiry
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# HTTPS required
FRONTEND_URL=https://yourdomain.com

# Allowed domains
INSTITUTION_DOMAINS=yourdomain.com,approved-domain.com

# Redis for distributed sessions
REDIS_URL=redis://redis-prod-host:6379/0

# Email alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@yourdomain.com
SMTP_PASS=your-app-password

# Monitoring
ALERT_PROVIDER=cloudwatch
AWS_REGION=us-east-1
```

### 2.3 Backend Server Configuration

```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS - Allow only frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,  // ✅ Allow cookies
  optionsSuccessStatus: 200
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser - reads refresh token cookie
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// ... other routes

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

---

## Part 3: Testing the Authentication Flow

### 3.1 Manual Testing with cURL

```bash
# 1. Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@gmail.com",
    "password": "Password123"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "accessToken": "eyJhbGc...",
#     "user": { ... }
#   }
# }

# 2. Access protected route (with token in header)
TOKEN="eyJhbGc..."
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -b cookies.txt

# 3. Test refresh with expired token
curl -X POST http://localhost:5001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Response:
# {
#   "success": true,
#   "data": {
#     "accessToken": "eyJhbGc..." (new token)
#   }
# }
```

### 3.2 Automated Testing Script

```typescript
// backend/test-auth-flow.ts
import axios from 'axios';

const API_URL = 'http://localhost:5001';
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  validateStatus: () => true
});

async function testAuthFlow() {
  console.log('🧪 Testing authentication flow...\n');

  // 1. Login
  console.log('1️⃣ Testing login...');
  const loginRes = await api.post('/api/auth/login', {
    email: 'khaliloullah6666@gmail.com',
    password: 'RBFMD5FABJJ'
  });

  if (loginRes.status !== 200) {
    console.error('❌ Login failed:', loginRes.data);
    return;
  }

  const { accessToken } = loginRes.data.data;
  console.log('✅ Login successful');
  console.log(`   Token: ${accessToken.substring(0, 20)}...`);

  // 2. Access protected route
  console.log('\n2️⃣ Testing /api/auth/me...');
  const meRes = await api.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (meRes.status !== 200) {
    console.error('❌ Auth failed:', meRes.data);
    return;
  }

  console.log('✅ /api/auth/me successful');
  console.log(`   User: ${meRes.data.data.user.email}`);

  // 3. Test with expired token
  console.log('\n3️⃣ Testing with invalid token...');
  const invalidRes = await api.get('/api/auth/me', {
    headers: { Authorization: 'Bearer invalid-token' }
  });

  if (invalidRes.status === 401) {
    console.log('✅ Invalid token correctly rejected (401)');
  } else {
    console.error('❌ Should have returned 401');
  }

  // 4. Test refresh
  console.log('\n4️⃣ Testing token refresh...');
  const refreshRes = await api.post('/api/auth/refresh');

  if (refreshRes.status !== 200) {
    console.error('❌ Refresh failed:', refreshRes.data);
    return;
  }

  console.log('✅ Token refresh successful');
  console.log(`   New token: ${refreshRes.data.data.accessToken.substring(0, 20)}...`);

  // 5. Logout
  console.log('\n5️⃣ Testing logout...');
  const logoutRes = await api.post('/api/auth/logout');

  if (logoutRes.status !== 200) {
    console.error('❌ Logout failed:', logoutRes.data);
    return;
  }

  console.log('✅ Logout successful');

  console.log('\n✅ All authentication tests passed!');
}

testAuthFlow().catch(console.error);
```

Run with:
```bash
ts-node backend/test-auth-flow.ts
```

### 3.3 Pickup Endpoint Testing

```bash
# Get valid student ID first
curl -X GET http://localhost:5001/api/users/students \
  -H "Authorization: Bearer $TOKEN"

# Test valid request
STUDENT_ID="550e8400-e29b-41d4-a716-446655440000"
curl -X POST http://localhost:5001/api/pickup/authorized/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "studentId": "'$STUDENT_ID'",
    "name": "Ahmed Fall",
    "relationship": "uncle",
    "phone": "+221771234567",
    "idNumber": "SN-1234567890"
  }'

# Expected response (200):
# {
#   "success": true,
#   "message": "Personne autorisée ajoutée avec succès",
#   "data": { ... }
# }

# Test invalid phone
curl -X POST http://localhost:5001/api/pickup/authorized/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "studentId": "'$STUDENT_ID'",
    "name": "Ahmed Fall",
    "relationship": "uncle",
    "phone": "invalid"
  }'

# Expected response (400):
# {
#   "success": false,
#   "message": "Erreur de validation",
#   "errors": [{ "field": "phone", "message": "...", "value": "invalid" }]
# }
```

---

## Part 4: Secret Rotation Process

### 4.1 Zero-Downtime Secret Rotation

```typescript
// Step-by-step process for production:

// 1. Generate new secrets
const newSecret = require('crypto').randomBytes(32).toString('hex');
console.log('New secret:', newSecret);

// 2. Set in your secrets manager (AWS, etc.)
// PREVIOUS_SECRET = current value
// SECRET = new value

// 3. Deploy all backend instances
// Old instances use fallback, new instances use new secret

// 4. Monitor for a stabilization period (1-2 hours)
// Watch for any 401 errors

// 5. Clear PREVIOUS_SECRET after all tokens naturally expired
// (7 days for refresh tokens)

// Code already handles this:
const fallbackSecret = process.env.JWT_SECRET_PREVIOUS || '';
try {
  decoded = jwt.verify(token, getSecret());
} catch (err) {
  if (fallbackSecret) {
    decoded = jwt.verify(token, fallbackSecret);  // ✅ Uses old secret
  }
}
```

### 4.2 Emergency Token Revocation

```bash
# If compromise suspected, immediately:

# 1. Access database and increment all users' tokenVersion
UPDATE users SET token_version = token_version + 1;

# 2. Delete all refresh tokens
DELETE FROM refresh_tokens;

# 3. Revoke all sessions
UPDATE user_sessions SET revoked_at = NOW() WHERE revoked_at IS NULL;

# 4. All users must log in again
# All existing tokens (even fresh) will be rejected

# 5. Rotate JWT secret
# Set JWT_SECRET_PREVIOUS = old value
# Set JWT_SECRET = new value
# Deploy all instances
```

---

## Part 5: Monitoring & Alerts

### 5.1 Key Metrics to Monitor

```typescript
// backend/src/utils/monitoring.ts
export const monitoringMetrics = {
  // Success metrics
  successfulLogins: 0,
  successfulRefreshes: 0,
  validatedSessions: 0,

  // Failure metrics
  failedLogins: 0,
  failedRefreshes: 0,
  invalidTokens: 0,
  tokenReuseDetected: 0,
  deviceMismatches: 0,

  // Alert conditions
  shouldAlert: () => ({
    failedLogins > 10 && 'BRUTE_FORCE_DETECTED',
    tokenReuseDetected > 0 && 'TOKEN_REUSE_DETECTED',
    deviceMismatches > 5 && 'POSSIBLE_ACCOUNT_COMPROMISE',
    invalidTokens > 100 && 'BULK_TOKEN_INVALIDATION'
  })
};
```

### 5.2 CloudWatch Integration

```typescript
// backend/src/utils/securityAlerts.ts
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

export const emitSecurityAlert = async (alert: {
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
}) => {
  const timestamp = new Date();

  // Log to CloudWatch
  await cloudwatch.send(new PutMetricDataCommand({
    Namespace: 'ForumExcellence/Security',
    MetricData: [{
      MetricName: alert.event,
      Value: 1,
      Timestamp: timestamp,
      Dimensions: [
        { Name: 'Severity', Value: alert.severity }
      ]
    }]
  }));

  // If high/critical severity, send to alerting system
  if (['high', 'critical'].includes(alert.severity)) {
    // sendToAlertingSystem(alert);
  }

  console.log(`[SECURITY_ALERT] ${alert.event} (${alert.severity})`);
};
```

---

## Quick Reference: Common Issues & Fixes

### Issue: 401 on every request

**Symptoms**: Login works but accessing /api/auth/me returns 401

**Causes**:
1. Cookie path wrong (`/api/auth` instead of `/`)
2. `withCredentials: false` in Axios
3. CORS `credentials: true` missing
4. Wrong `FRONTEND_URL` in backend

**Fixes**:
```bash
# 1. Backend .env
FRONTEND_URL=http://localhost:5173  # Exact frontend URL

# 2. backend/src/server.ts
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true  // ✅ MUST be true
}));

# 3. frontend Axios
const api = axios.create({
  withCredentials: true  # ✅ MUST be true
});
```

### Issue: 400 on POST /api/pickup/authorized/add

**Symptoms**: Even valid requests return validation errors

**Most common causes**:
- Phone number format not recognized
- Empty idNumber field (now optional)
- studentId is not a valid UUID

**Debug**:
```bash
# Set detailed error logging
DEBUG=* npm run dev

# Test valid payload
curl -X POST http://localhost:5001/api/pickup/authorized/add \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "studentId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Test Person",
    "relationship": "uncle",
    "phone": "+221771234567"
  }'
```

### Issue: Rapid logout after login

**Symptoms**: Login successful but logged out within seconds

**Causes**:
1. `tokenVersion` mismatch in auth middleware
2. Session validation failing
3. Device cookie missing

**Fix**:
```typescript
// Check middleware logs
console.log('Token version:', decoded.tokenVersion, 'DB version:', user.tokenVersion);
```

---

## Final Checklist Before Production

- ✅ Generate new JWT secrets (32+ random characters)
- ✅ Set FRONTEND_URL to HTTPS domain
- ✅ Configure Redis for distributed sessions
- ✅ Enable HSTS header in Helmet
- ✅ Set up CloudWatch monitoring
- ✅ Configure email alerts for security events
- ✅ Test token refresh manually
- ✅ Test token revocation
- ✅ Test with invalid tokens
- ✅ Load test refresh endpoint
- ✅ Verify CORS headers are correct
- ✅ Check rate limiting is active
