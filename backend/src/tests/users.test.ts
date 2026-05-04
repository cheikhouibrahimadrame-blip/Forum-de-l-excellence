import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ---------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  refreshToken: { deleteMany: vi.fn() },
  $transaction: vi.fn()
}));

vi.mock('../lib/prisma', () => ({ default: mockPrisma }));
vi.mock('../utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined)
}));

// ---------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------
import {
  createUser,
  createUserValidation,
  resetPassword,
  getUsers,
  updateUser,
  updateUserValidation
} from '../controllers/userController';

// ---------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------
const ADMIN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TARGET_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const buildApp = (user: { id: string; role: string }) => {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.user = user;
    next();
  });
  app.get('/api/users', getUsers as any);
  app.post('/api/users', createUserValidation, createUser as any);
  app.put('/api/users/:userId', updateUserValidation, updateUser as any);
  app.post('/api/users/:userId/reset-password', resetPassword as any);
  return app;
};

// ---------------------------------------------------------------
// P0-3: newPassword policy is actually applied
// ---------------------------------------------------------------
describe('POST /api/users/:userId/reset-password — P0-3 password policy', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects a 1-character password with 400', async () => {
    const app = buildApp({ id: ADMIN_ID, role: 'ADMIN' });
    const res = await request(app)
      .post(`/api/users/${TARGET_ID}/reset-password`)
      .send({ newPassword: 'a' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects a password missing uppercase / digit', async () => {
    const app = buildApp({ id: ADMIN_ID, role: 'ADMIN' });
    const res = await request(app)
      .post(`/api/users/${TARGET_ID}/reset-password`)
      .send({ newPassword: 'alllowercase' });

    expect(res.status).toBe(400);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('accepts a strong password and triggers an update', async () => {
    mockPrisma.user.update.mockResolvedValueOnce({});
    mockPrisma.refreshToken.deleteMany.mockResolvedValueOnce({ count: 0 });

    const app = buildApp({ id: ADMIN_ID, role: 'ADMIN' });
    const res = await request(app)
      .post(`/api/users/${TARGET_ID}/reset-password`)
      .send({ newPassword: 'StrongPass1' });

    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledOnce();
  }, 30000);
});

// ---------------------------------------------------------------
// P1-10: TEACHER role is restricted to listing students only
// ---------------------------------------------------------------
describe('GET /api/users — P1-10 TEACHER restriction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockPrisma.user.findMany.mockResolvedValueOnce([]);
    mockPrisma.user.count.mockResolvedValueOnce(0);
  });

  it('forces where.role=STUDENT when caller is TEACHER, even if ?role=ADMIN is passed', async () => {
    const app = buildApp({ id: 'teacher-1', role: 'TEACHER' });
    await request(app).get('/api/users?role=ADMIN');

    const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0] || {};
    expect(callArgs.where?.role).toBe('STUDENT');
  });

  it('respects the ?role= query when caller is ADMIN', async () => {
    const app = buildApp({ id: ADMIN_ID, role: 'ADMIN' });
    await request(app).get('/api/users?role=TEACHER');

    const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0] || {};
    expect(callArgs.where?.role).toBe('TEACHER');
  });
});

// ---------------------------------------------------------------
// P1-9: createUser creates the matching role profile
// ---------------------------------------------------------------
describe('POST /api/users — P1-9 role profile creation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue(null);
  });

  const txCalls: Record<string, any[]> = {
    teacher: [],
    student: [],
    parent: [],
    admin: []
  };

  const setupTransactionMock = () => {
    txCalls.teacher = [];
    txCalls.student = [];
    txCalls.parent = [];
    txCalls.admin = [];

    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'newuser-1',
            email: 'new@school.sn',
            role: 'STUDENT',
            firstName: 'A',
            lastName: 'B',
            phone: null,
            isActive: true,
            mustChangePassword: true,
            createdAt: new Date()
          })
        },
        teacher: { create: vi.fn().mockImplementation(async (args: any) => { txCalls.teacher.push(args); return {}; }) },
        student: { create: vi.fn().mockImplementation(async (args: any) => { txCalls.student.push(args); return {}; }) },
        parent:  { create: vi.fn().mockImplementation(async (args: any) => { txCalls.parent.push(args); return {}; }) },
        admin:   { create: vi.fn().mockImplementation(async (args: any) => { txCalls.admin.push(args); return {}; }) }
      };
      return fn(tx);
    });
  };

  it('creates a Student profile when role=STUDENT', async () => {
    setupTransactionMock();
    const app = buildApp({ id: ADMIN_ID, role: 'ADMIN' });
    const res = await request(app).post('/api/users').send({
      email: 'newstudent@school.sn',
      password: 'StrongPass1',
      firstName: 'Aïssa',
      lastName: 'Diop',
      role: 'STUDENT'
    });
    expect(res.status).toBe(201);
    expect(txCalls.student).toHaveLength(1);
    expect(txCalls.teacher).toHaveLength(0);
  }, 30000);

  it('creates a Parent profile when role=PARENT', async () => {
    setupTransactionMock();
    const app = buildApp({ id: ADMIN_ID, role: 'ADMIN' });
    const res = await request(app).post('/api/users').send({
      email: 'parent@school.sn',
      password: 'StrongPass1',
      firstName: 'Mamadou',
      lastName: 'Sarr',
      role: 'PARENT'
    });
    expect(res.status).toBe(201);
    expect(txCalls.parent).toHaveLength(1);
  }, 30000);

  it('creates an Admin profile when role=ADMIN', async () => {
    setupTransactionMock();
    const app = buildApp({ id: ADMIN_ID, role: 'ADMIN' });
    const res = await request(app).post('/api/users').send({
      email: 'admin2@school.sn',
      password: 'StrongPass1',
      firstName: 'Awa',
      lastName: 'Ba',
      role: 'ADMIN'
    });
    expect(res.status).toBe(201);
    expect(txCalls.admin).toHaveLength(1);
  }, 30000);

  it('still creates a Teacher profile when role=TEACHER', async () => {
    setupTransactionMock();
    const app = buildApp({ id: ADMIN_ID, role: 'ADMIN' });
    const res = await request(app).post('/api/users').send({
      email: 'teacher@school.sn',
      password: 'StrongPass1',
      firstName: 'Abdou',
      lastName: 'Ba',
      role: 'TEACHER'
    });
    expect(res.status).toBe(201);
    expect(txCalls.teacher).toHaveLength(1);
  }, 30000);
});
