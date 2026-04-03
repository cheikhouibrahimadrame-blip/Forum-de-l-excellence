import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';

// ---------------------------------------------------------------
// Mock Prisma — vi.hoisted() runs BEFORE vi.mock hoisting
// ---------------------------------------------------------------
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  userSession: {
    create: vi.fn().mockResolvedValue({ id: 'session-id-1' }),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}));

vi.mock('../lib/prisma', () => ({ default: mockPrisma }));

// ---------------------------------------------------------------
// Mock secretManager / secretProvider so JWT signing works
// ---------------------------------------------------------------
const TEST_ACCESS_SECRET = 'test-access-secret-key-1234';
const TEST_REFRESH_SECRET = 'test-refresh-secret-key-5678';

vi.mock('../utils/secretManager', () => ({
  getCurrentSecrets: () => ({
    accessToken: TEST_ACCESS_SECRET,
    refreshToken: TEST_REFRESH_SECRET,
  }),
  verifyTokenWithFallback: vi.fn(),
}));

vi.mock('../utils/secretProvider', () => ({
  initializeSecretProvider: vi.fn(),
  getJwtSecrets: () => ({
    accessToken: TEST_ACCESS_SECRET,
    refreshToken: TEST_REFRESH_SECRET,
  }),
}));

// ---------------------------------------------------------------
// Mock audit + security alert utilities (they need prisma internally)
// ---------------------------------------------------------------
vi.mock('../utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/securityAlerts', () => ({
  emitSecurityAlert: vi.fn(),
}));

// ---------------------------------------------------------------
// Import AFTER mocks are registered
// ---------------------------------------------------------------
import {
  login,
  loginValidation,
  logout,
  getMe,
  refreshToken as refreshTokenHandler,
} from '../controllers/authController';
import { verifyTokenWithFallback } from '../utils/secretManager';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.post('/api/auth/login', loginValidation, login);
  app.post('/api/auth/refresh', refreshTokenHandler);
  app.post('/api/auth/logout', logout);

  // Simulate authenticated getMe by injecting req.user
  app.get('/api/auth/me', (req: any, _res, next) => {
    req.user = { id: 'user-1' };
    next();
  }, getMe);

  return app;
}

const VALID_USER = {
  id: 'user-1',
  email: 'admin@school.sn',
  password: '', // will be set in beforeEach
  role: 'ADMIN',
  firstName: 'Test',
  lastName: 'Admin',
  isActive: true,
  mustChangePassword: false,
  tokenVersion: 1,
  student: null,
  parent: null,
  teacher: null,
  admin: { id: 'admin-1', userId: 'user-1', employeeId: 'EMP001', department: 'IT', permissions: null, hireDate: new Date() },
};

// ---------------------------------------------------------------
// Tests
// ---------------------------------------------------------------
describe('Auth Routes', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    vi.clearAllMocks();
    VALID_USER.password = await bcrypt.hash('Password1', 10);
    app = createApp();
  });

  // ------- LOGIN -------
  describe('POST /api/auth/login', () => {
    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Password1' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@school.sn', password: 'short' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@school.sn', password: 'Password1' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(VALID_USER);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@school.sn', password: 'WrongPass1' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when account is inactive', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...VALID_USER,
        isActive: false,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@school.sn', password: 'Password1' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with accessToken on valid login', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(VALID_USER);
      mockPrisma.userSession.updateMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.refreshToken.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.refreshToken.create.mockResolvedValueOnce({ id: 'rt-1' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@school.sn', password: 'Password1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@school.sn');
      // Password should NOT be in the response
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('sets refreshToken as httpOnly cookie on valid login', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(VALID_USER);
      mockPrisma.userSession.updateMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.refreshToken.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.refreshToken.create.mockResolvedValueOnce({ id: 'rt-1' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@school.sn', password: 'Password1' });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('refreshToken='))
        : cookies;
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
    });
  });

  // ------- LOGOUT -------
  describe('POST /api/auth/logout', () => {
    it('returns 200 and clears cookie even without refresh token', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('clears refreshToken cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      // The cookie should be cleared (set to empty / expired)
      const refreshCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('refreshToken='))
        : cookies;
      expect(refreshCookie).toBeDefined();
    });
  });

  // ------- GET /me -------
  describe('GET /api/auth/me', () => {
    it('returns 404 when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns user data without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(VALID_USER);

      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('admin@school.sn');
      expect(res.body.data.user.password).toBeUndefined();
    });
  });

  // ------- REFRESH -------
  describe('POST /api/auth/refresh', () => {
    it('returns 401 when no refresh cookie is present', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when refresh token is invalid', async () => {
      (verifyTokenWithFallback as any).mockImplementationOnce(() => {
        throw new Error('invalid');
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=bad-token');
      expect(res.status).toBe(401);
    });
  });
});
