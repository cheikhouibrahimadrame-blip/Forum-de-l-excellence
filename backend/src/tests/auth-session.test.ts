import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';

// ---------------------------------------------------------------
// Mock Prisma — we only care about the args passed to the
// scoped revoke / delete calls, so we surface them via mocks.
// ---------------------------------------------------------------
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  refreshToken: {
    create: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 })
  },
  userSession: {
    create: vi.fn().mockResolvedValue({ id: 'new-session-id' }),
    updateMany: vi.fn().mockResolvedValue({ count: 0 })
  },
  auditLog: {
    create: vi.fn()
  }
}));

vi.mock('../lib/prisma', () => ({ default: mockPrisma }));

const TEST_ACCESS_SECRET = 'test-access-secret-key-1234';
const TEST_REFRESH_SECRET = 'test-refresh-secret-key-5678';

vi.mock('../utils/secretManager', () => ({
  getCurrentSecrets: () => ({ accessToken: TEST_ACCESS_SECRET, refreshToken: TEST_REFRESH_SECRET }),
  verifyTokenWithFallback: vi.fn()
}));

vi.mock('../utils/secretProvider', () => ({
  initializeSecretProvider: vi.fn(),
  getJwtSecrets: () => ({ accessToken: TEST_ACCESS_SECRET, refreshToken: TEST_REFRESH_SECRET })
}));

vi.mock('../utils/audit', () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../utils/securityAlerts', () => ({ emitSecurityAlert: vi.fn() }));

import { login, loginValidation } from '../controllers/authController';
import bcrypt from 'bcryptjs';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.post('/api/auth/login', loginValidation, login);
  return app;
};

const VALID_USER_BASE = {
  id: 'user-1',
  email: 'admin@school.sn',
  password: '', // set in beforeEach
  role: 'ADMIN',
  firstName: 'Test',
  lastName: 'Admin',
  isActive: true,
  mustChangePassword: false,
  tokenVersion: 1,
  student: null,
  parent: null,
  teacher: null,
  admin: { id: 'admin-1', userId: 'user-1' }
};

// ---------------------------------------------------------------
// P1-11: login() scopes its revoke / delete to the current device.
// ---------------------------------------------------------------
describe('POST /api/auth/login — P1-11 device-scoped revocation', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.refreshToken.create.mockResolvedValue({});
    mockPrisma.userSession.create.mockResolvedValue({ id: 'new-session-id' });
    mockPrisma.userSession.updateMany.mockResolvedValue({ count: 0 });
    const hashed = await bcrypt.hash('CorrectPass1!', 10);
    mockPrisma.user.findUnique.mockResolvedValue({ ...VALID_USER_BASE, password: hashed });
  });

  it('without a deviceId cookie, only revokes legacy sessions (deviceIdHash=null)', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@school.sn', password: 'CorrectPass1!' });

    expect(res.status).toBe(200);
    const updateManyArgs = mockPrisma.userSession.updateMany.mock.calls[0]?.[0];
    expect(updateManyArgs?.where?.userId).toBe('user-1');
    expect(updateManyArgs?.where?.revokedAt).toBeNull();
    // Critical: the scope is ONLY null-deviceId sessions, so other devices
    // (which would have non-null deviceIdHash) stay alive.
    expect(updateManyArgs?.where?.deviceIdHash).toBeNull();
  }, 30000);

  it('with a deviceId cookie, scopes revocation to that device hash', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/login')
      .set('Cookie', 'deviceId=my-laptop-fingerprint')
      .send({ email: 'admin@school.sn', password: 'CorrectPass1!' });

    expect(res.status).toBe(200);
    const updateManyArgs = mockPrisma.userSession.updateMany.mock.calls[0]?.[0];
    // Should be a hashed string, never the raw cookie value.
    expect(updateManyArgs?.where?.deviceIdHash).toBeTruthy();
    expect(updateManyArgs?.where?.deviceIdHash).not.toBe('my-laptop-fingerprint');
    expect(typeof updateManyArgs?.where?.deviceIdHash).toBe('string');
  }, 30000);

  it('refreshToken.deleteMany is scoped to the new sessionId, not all userId', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@school.sn', password: 'CorrectPass1!' });

    expect(res.status).toBe(200);
    const deleteManyArgs = mockPrisma.refreshToken.deleteMany.mock.calls[0]?.[0];
    expect(deleteManyArgs?.where?.userId).toBe('user-1');
    // P1-11: must include sessionId so other-device tokens survive.
    expect(deleteManyArgs?.where?.sessionId).toBe('new-session-id');
  }, 30000);
});
