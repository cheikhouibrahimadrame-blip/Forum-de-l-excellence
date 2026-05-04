import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// jsonStore writes to disk → redirect to a temp dir per test so the
// "branding source of truth" assertions don't pollute the user's $HOME.
let tmpDir: string;
let originalPersistenceDir: string | undefined;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'branding-ssot-test-'));
  originalPersistenceDir = process.env.PERSISTENCE_DIR;
  process.env.PERSISTENCE_DIR = tmpDir;
  vi.resetModules();
});

afterEach(async () => {
  if (originalPersistenceDir === undefined) {
    delete process.env.PERSISTENCE_DIR;
  } else {
    process.env.PERSISTENCE_DIR = originalPersistenceDir;
  }
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* swallow */ }
});

// Mock prisma — only the settings endpoints actually touch it.
const mockPrisma = vi.hoisted(() => ({
  generalSettings: {
    findFirst: vi.fn().mockResolvedValue(null),
    update: vi.fn(),
    create: vi.fn().mockResolvedValue({})
  },
  appearanceSettings: {
    findFirst: vi.fn().mockResolvedValue(null),
    update: vi.fn(),
    create: vi.fn()
  },
  securitySettings: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn(), create: vi.fn() },
  notificationSettings: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn(), create: vi.fn() },
  databaseSettings: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn(), create: vi.fn() },
  emailSettings: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn(), create: vi.fn() }
}));

vi.mock('../lib/prisma', () => ({ default: mockPrisma }));
vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin-1', role: 'ADMIN' };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next()
}));

// We import the router lazily inside each test so the new tmp PERSISTENCE_DIR
// is picked up by the controllerinstance (branding state is a module-level
// singleton).
const buildApp = async () => {
  const { default: settingsRouter } = await import('../routes/settings');
  const app = express();
  app.use(express.json());
  app.use('/api/settings', settingsRouter);
  return app;
};

const validGeneralBody = {
  name: 'Updated School',
  address: '1 New Street',
  phone: '+221 700000000',
  email: 'new@school.sn',
  website: 'www.new.sn',
  principal: 'M. Updated',
  year: '2026-2027'
};

describe('P1-2 — branding is the canonical source for general identity', () => {
  beforeEach(() => {
    mockPrisma.generalSettings.findFirst.mockResolvedValue(null);
    mockPrisma.generalSettings.update.mockResolvedValue({});
    mockPrisma.generalSettings.create.mockResolvedValue({});
    mockPrisma.appearanceSettings.findFirst.mockResolvedValue(null);
  });

  it('POST /general writes through to branding (next GET /branding reflects it)', async () => {
    const app = await buildApp();

    // Save through the legacy "Informations générales" endpoint.
    const post = await request(app).post('/api/settings/general').send(validGeneralBody);
    expect(post.status).toBe(200);

    // Read branding back — the brand block should mirror what we just saved.
    const branding = await request(app).get('/api/settings/branding');
    expect(branding.status).toBe(200);
    expect(branding.body.data?.brand).toMatchObject({
      name: 'Updated School',
      address: '1 New Street',
      phone: '+221 700000000',
      email: 'new@school.sn',
      website: 'www.new.sn',
      principal: 'M. Updated',
      year: '2026-2027'
    });
  });

  it('POST /branding propagates to GET /general (no desync)', async () => {
    const app = await buildApp();

    const brandingPayload = {
      brand: {
        name: 'From Branding Page',
        address: 'Branded Address',
        phone: '+221 711111111',
        email: 'branded@school.sn',
        website: 'www.branded.sn',
        principal: 'Direction Branded',
        year: '2027-2028'
      }
    };
    const brandPost = await request(app).post('/api/settings/branding').send(brandingPayload);
    expect(brandPost.status).toBe(200);

    const all = await request(app).get('/api/settings');
    expect(all.status).toBe(200);
    expect(all.body.data?.general).toMatchObject({
      name: 'From Branding Page',
      address: 'Branded Address',
      phone: '+221 711111111',
      email: 'branded@school.sn',
      website: 'www.branded.sn',
      principal: 'Direction Branded',
      year: '2027-2028'
    });
  });

  it('public /appearance exposes school info from branding', async () => {
    const app = await buildApp();

    await request(app).post('/api/settings/general').send(validGeneralBody);

    const pub = await request(app).get('/api/settings/appearance');
    expect(pub.status).toBe(200);
    expect(pub.body.data).toMatchObject({
      schoolName: 'Updated School',
      schoolPhone: '+221 700000000',
      schoolEmail: 'new@school.sn'
    });
  });
});
