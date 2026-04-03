# Dual JWT Secret Validation & Automatic Rollover Implementation

## Overview
This document describes the dual JWT secret validation system with automatic rollover mechanism implemented for enhanced security in the College Management System.

## Architecture

### 1. Secret Manager (`backend/src/utils/secretManager.ts`)
Central utility for managing JWT secrets with dual-secret support.

**Key Features:**
- **Current + Previous Secrets**: Maintains both current and previous secrets for access and refresh tokens
- **Fallback Validation**: Automatically falls back to previous secret if current secret fails
- **Automatic Rotation**: Scheduled mechanism to rotate secrets at configurable intervals (default: 30 days)
- **Audit Trail**: Records all secret rotations with timestamps and rotation counts

**Environment Variables:**
```
JWT_SECRET                              # Current access token secret
JWT_SECRET_PREVIOUS                     # Previous access token secret (optional)
JWT_REFRESH_SECRET                      # Current refresh token secret
JWT_REFRESH_SECRET_PREVIOUS             # Previous refresh token secret (optional)
JWT_SECRET_ROTATION_INTERVAL            # Rotation interval in milliseconds (default: 2592000000 = 30 days)
JWT_AUTO_ROTATION                       # Enable auto rotation (default: false, set to "true" to enable)
```

### 2. Token Verification Flow

#### Access Tokens (Auth Middleware)
```
1. Extract token from Authorization header
2. Attempt verification with current secret
3. If fails and previous secret exists:
   - Attempt verification with previous secret
   - Log fallback usage for monitoring
4. Extract userId and validate token version
5. Verify user is active and token hasn't been invalidated
```

#### Refresh Tokens (Auth & Logout Controllers)
```
1. Extract token from HTTP-only cookie
2. Attempt verification with current refresh secret
3. If fails and previous refresh secret exists:
   - Attempt verification with previous secret
   - Log fallback usage
4. Verify refresh token exists and hasn't been revoked in database
5. Generate new access token with current secret
```

### 3. Secret Rotation Mechanism

#### Automatic Rotation
- **Timing**: Checked every hour, rotates when interval elapsed
- **Process**:
  1. Move current secret → previous secret
  2. Generate new cryptographically secure secret (32 bytes hex)
  3. Increment rotation counter
  4. Store audit record in database
  5. Log rotation event

#### Manual Rotation (Admin Only)
- **Endpoint**: `POST /api/admin/security/rotate-secrets`
- **Permission**: Requires ADMIN role
- **Result**: Immediate secret rotation with audit trail

#### Benefits
- **Zero-Downtime**: Old tokens continue working during transition period
- **Security**: Reduces exposure window if secret is compromised
- **Flexibility**: Admins can force immediate rotation if needed

### 4. Database Schema

#### SecretRotationAudit Model
```typescript
model SecretRotationAudit {
  id                    String   @id @default(uuid())
  rotationCount         Int                           // Sequence number of rotation
  previousAccessSecret  String   @db.Text            // Old access secret (hashed in logs)
  currentAccessSecret   String   @db.Text            // New access secret
  previousRefreshSecret String   @db.Text            // Old refresh secret
  currentRefreshSecret  String   @db.Text            // New refresh secret
  rotatedAt             DateTime @default(now())     // When rotation occurred
  reason                String   @default("automatic_rotation")
  rotatedBy             String?                      // Admin ID if manual
  createdAt             DateTime @default(now())
  
  @@index([rotatedAt])
  @@index([reason])
}
```

### 5. API Endpoints

#### Manual Secret Rotation
```http
POST /api/admin/security/rotate-secrets
Authorization: Bearer {admin_access_token}

Response:
{
  "success": true,
  "message": "Secrets JWT rotatés avec succès",
  "rotation": {
    "lastRotation": "2026-02-16T10:30:00Z",
    "rotationCount": 5,
    "nextRotation": "2026-03-18T10:30:00Z",
    "shouldRotate": false,
    "autoRotationEnabled": true
  }
}
```

#### Get Rotation Status
```http
GET /api/admin/security/secret-status
Authorization: Bearer {admin_access_token}

Response:
{
  "success": true,
  "rotation": {
    "lastRotation": "2026-02-16T10:30:00Z",
    "rotationCount": 5,
    "nextRotation": "2026-03-18T10:30:00Z",
    "shouldRotate": false,
    "autoRotationEnabled": true
  },
  "secrets": {
    "accessTokenSecretSet": true,
    "accessTokenSecretPreviousSet": true,
    "refreshTokenSecretSet": true,
    "refreshTokenSecretPreviousSet": true,
    "lastRotation": "2026-02-16T10:30:00Z",
    "rotationCount": 5
  }
}
```

#### Get Rotation History
```http
GET /api/admin/security/secret-history?limit=50
Authorization: Bearer {admin_access_token}

Response:
{
  "success": true,
  "history": [
    {
      "rotationCount": 5,
      "rotatedAt": "2026-02-16T10:30:00Z",
      "reason": "automatic_rotation",
      "rotatedBy": null,
      "createdAt": "2026-02-16T10:30:00Z"
    },
    // ... more records
  ],
  "totalRecords": 5
}
```

#### Configure Auto Rotation
```http
POST /api/admin/security/configure-auto-rotation
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "enabled": true,
  "intervalDays": 30
}

Response:
{
  "success": true,
  "message": "Automatic rotation activée",
  "rotation": {
    "lastRotation": "2026-02-16T10:30:00Z",
    "rotationCount": 5,
    "nextRotation": "2026-03-18T10:30:00Z",
    "shouldRotate": false,
    "autoRotationEnabled": true
  }
}
```

### 6. Integration Points

#### Server Initialization
```typescript
// server.ts
import { initializeAutoRotation } from './utils/secretManager';

app.listen(PORT, () => {
  // ... logging
  initializeAutoRotation(); // Starts auto rotation scheduler
});
```

#### Token Creation
```typescript
// authController.ts
const { accessToken, refreshToken } = getCurrentSecrets();

const token = jwt.sign(payload, accessToken, { expiresIn: '15m' });
```

#### Token Verification
```typescript
// auth.ts middleware & authController.ts
const { decoded, usedFallback } = verifyTokenWithFallback(token, 'access');

if (usedFallback) {
  console.log('Using fallback secret - token issued with previous secret');
}
```

### 7. Security Guarantees

1. **Backward Compatibility**: Tokens issued with old secret continue working until next rotation
2. **Forward Security**: New tokens issued immediately with new secret
3. **Audit Trail**: All rotations recorded for forensic analysis
4. **No Downtime**: Requests continue seamlessly during rotation transitions
5. **Admin Control**: Manual rotation available for emergency scenarios
6. **Automated Compliance**: Regular rotation enforced if auto-rotation enabled

### 8. Monitoring & Debugging

#### Fallback Usage Logs
```
[AUTH_MIDDLEWARE] Using fallback secret for token of user: user-123
[TOKEN_VERIFY] Using fallback secret for refresh token
[LOGOUT] Used fallback secret to decode refresh token
```

#### Rotation Logs
```
[SECRET_MANAGER] Auto rotation initialized. Interval: 2592000000ms
[SECRET_ROTATION] Secrets rotated. Rotation #5
[SECRET_MANAGER] Automatic rotation completed
```

#### Error Logs
```
[SECRET_ROTATION_ERROR] Error during rotation
[SECRET_MANAGER] Rotation failed: {error}
```

### 9. Configuration Examples

#### Scenario 1: Aggressive Rotation (High Security)
```env
JWT_SECRET=generate-new-secret-here
JWT_REFRESH_SECRET=generate-new-secret-here
JWT_AUTO_ROTATION=true
JWT_SECRET_ROTATION_INTERVAL=604800000  # 7 days
```

#### Scenario 2: Standard Rotation
```env
JWT_AUTO_ROTATION=true
JWT_SECRET_ROTATION_INTERVAL=2592000000  # 30 days (default)
```

#### Scenario 3: Manual Control Only
```env
JWT_AUTO_ROTATION=false
# Admins manually call POST /api/admin/security/rotate-secrets when needed
```

### 10. Migration Path

1. **Initial Deployment**: 
   - Deploy code with secretManager
   - Set `JWT_AUTO_ROTATION=false` initially
   - Run migration to create SecretRotationAudit table

2. **Testing Phase** (optional):
   - Manually call rotation endpoints
   - Monitor logs for fallback usage
   - Verify token validation works smoothly

3. **Production Activation**:
   - Enable auto-rotation: `JWT_AUTO_ROTATION=true`
   - Set rotation interval based on security policy
   - System automatically rotates at specified interval

### 11. Troubleshooting

**Q: Tokens stop working after rotation**
A: Check if previous secret is being stored. Verify fallback validation is active.

**Q: Too many "fallback secret" logs**
A: Indicates clients are using old tokens beyond expected grace period. Consider reducing rotation interval.

**Q: Rotation endpoint returns 403**
A: Verify requesting user has ADMIN role. Check authentication token is valid.

**Q: Auto-rotation not happening**
A: Verify `JWT_AUTO_ROTATION=true`. Check server logs for initialization message. Ensure interval is elapsed.

---

**Version**: 1.0  
**Last Updated**: 2026-02-16  
**Implemented By**: Security Enhancement Initiative
