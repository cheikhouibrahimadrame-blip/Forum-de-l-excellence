import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ---------------------------------------------------------------
// Mock Prisma — settings endpoints query *Settings.findFirst()
// ---------------------------------------------------------------
const mockPrisma = vi.hoisted(() => ({
  securitySettings: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  generalSettings: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  notificationSettings: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  appearanceSettings: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  databaseSettings: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  emailSettings: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() }
}));

vi.mock('../lib/prisma', () => ({ default: mockPrisma }));

// Bypass auth — settings router calls authenticate + authorize, but we
// register the inner handlers directly via supertest below.

// We can't easily import the settings router because it runs `router.use(authenticate, authorize)`
// at module load time. Instead, we re-invoke the handlers directly by re-importing
// the router and mounting it AFTER injecting a fake req.user.

vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin-1', role: 'ADMIN', email: 'a@b.sn' };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeRoles: () => (_req: any, _res: any, next: any) => next()
}));

vi.mock('../controllers/brandingController', () => ({
  getBrandingContent: (_req: any, res: any) => res.json({ success: true, data: {} }),
  updateBrandingContent: (_req: any, res: any) => res.json({ success: true })
}));

import settingsRouter from '../routes/settings';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/settings', settingsRouter);
  return app;
};

// ---------------------------------------------------------------
// P1-1: validation rejects bad input
// ---------------------------------------------------------------
describe('POST /api/settings/security — P1-1 validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.securitySettings.findFirst.mockResolvedValue(null);
  });

  it('rejects passwordMinLength below 8', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/settings/security').send({
      sessionTimeout: 30,
      passwordMinLength: 1,
      maxLoginAttempts: 5,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      enableTwoFactor: false
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockPrisma.securitySettings.create).not.toHaveBeenCalled();
  });

  it('rejects negative maxLoginAttempts', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/settings/security').send({
      sessionTimeout: 30,
      passwordMinLength: 8,
      maxLoginAttempts: -5,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      enableTwoFactor: false
    });
    expect(res.status).toBe(400);
  });

  it('rejects non-boolean enableTwoFactor', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/settings/security').send({
      sessionTimeout: 30,
      passwordMinLength: 8,
      maxLoginAttempts: 5,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      enableTwoFactor: 'yes' // string instead of boolean
    });
    expect(res.status).toBe(400);
  });

  it('accepts a fully-valid payload', async () => {
    mockPrisma.securitySettings.create.mockResolvedValueOnce({ id: 'sec-1' });
    const app = buildApp();
    const res = await request(app).post('/api/settings/security').send({
      sessionTimeout: 30,
      passwordMinLength: 12,
      maxLoginAttempts: 5,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      enableTwoFactor: false
    });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/settings/appearance — P1-1 validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.appearanceSettings.findFirst.mockResolvedValue(null);
  });

  it('rejects an unknown theme', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/settings/appearance').send({
      theme: 'evil',
      primaryColor: '#003366',
      accentColor: '#C39D5B',
      fontSize: 'medium'
    });
    expect(res.status).toBe(400);
  });

  it('rejects a non-hex primaryColor', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/settings/appearance').send({
      theme: 'light',
      primaryColor: 'red',
      accentColor: '#C39D5B',
      fontSize: 'medium'
    });
    expect(res.status).toBe(400);
  });

  it('accepts a valid payload', async () => {
    mockPrisma.appearanceSettings.create.mockResolvedValueOnce({ id: 'ap-1' });
    const app = buildApp();
    const res = await request(app).post('/api/settings/appearance').send({
      theme: 'dark',
      primaryColor: '#003366',
      accentColor: '#C39D5B',
      fontSize: 'medium'
    });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/settings/database — P1-1 validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.databaseSettings.findFirst.mockResolvedValue(null);
  });

  it('rejects a backupFrequency outside the allowlist', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/settings/database').send({
      autoBackup: true,
      backupFrequency: 'every-second',
      retentionDays: 30,
      encryptionEnabled: true
    });
    expect(res.status).toBe(400);
  });

  it('rejects retentionDays out of range', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/settings/database').send({
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 100000,
      encryptionEnabled: true
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/settings/email — P1-1 validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.emailSettings.findFirst.mockResolvedValue(null);
  });

  it('rejects an invalid senderEmail', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/settings/email').send({
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587,
      senderEmail: 'not-an-email',
      senderName: 'Forum',
      useSSL: false,
      enableAutoNotifications: true
    });
    expect(res.status).toBe(400);
  });

  it('rejects a port out of range', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/settings/email').send({
      smtpServer: 'smtp.gmail.com',
      smtpPort: 99999,
      senderEmail: 'noreply@school.sn',
      senderName: 'Forum',
      useSSL: false,
      enableAutoNotifications: true
    });
    expect(res.status).toBe(400);
  });
});
