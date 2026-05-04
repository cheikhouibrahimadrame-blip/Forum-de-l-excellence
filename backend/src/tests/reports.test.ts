import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// jsonStore writes to disk; redirect it to a temp dir so tests don't pollute the repo.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reports-test-'));

vi.mock('../lib/jsonStore', async () => ({
  loadJsonStore: <T,>(_name: string, fallback: T): T => fallback,
  saveJsonStore: (_name: string, _data: any) => {
    // no-op for tests
  }
}));

// Stub auth + admin authorization so we can hit the routes directly.
vi.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'admin-1', role: 'ADMIN' };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  authorizeRoles: () => (_req: any, _res: any, next: any) => next()
}));

import reportsRouter from '../routes/reports';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/reports', reportsRouter);
  return app;
};

const validReport = {
  name: 'Bulletin trim. 1',
  type: 'academic',
  department: 'Pédagogie',
  generatedBy: 'Admin',
  recipients: 12,
  status: 'draft'
};

// ---------------------------------------------------------------
// P1-7: PUT body whitelist
// ---------------------------------------------------------------
describe('PUT /api/reports/:reportId — P1-7 body whitelist', () => {
  let app: ReturnType<typeof buildApp>;
  let createdId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp();
    // Seed one report so we have something to PUT.
    const res = await request(app).post('/api/reports').send(validReport);
    expect(res.status).toBe(201);
    createdId = res.body.data.id;
  });

  it('ignores attempts to overwrite the immutable id', async () => {
    const malicious = { id: 'attacker-controlled-id' };
    const res = await request(app).put(`/api/reports/${createdId}`).send(malicious);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('ignores attempts to overwrite createdDate', async () => {
    const original = (await request(app).get('/api/reports')).body.data.find((r: any) => r.id === createdId);
    const malicious = { createdDate: '1970-01-01T00:00:00.000Z' };
    const res = await request(app).put(`/api/reports/${createdId}`).send(malicious);
    expect(res.status).toBe(200);
    expect(res.body.data.createdDate).toBe(original.createdDate);
  });

  it('rejects an invalid type enum with 400', async () => {
    const res = await request(app)
      .put(`/api/reports/${createdId}`)
      .send({ type: 'malicious-type' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid status enum with 400', async () => {
    const res = await request(app)
      .put(`/api/reports/${createdId}`)
      .send({ status: 'totally-fake' });
    expect(res.status).toBe(400);
  });

  it('still accepts the legitimate name/recipients update', async () => {
    const res = await request(app)
      .put(`/api/reports/${createdId}`)
      .send({ name: 'Bulletin trim. 1 (rev)', recipients: 99 });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Bulletin trim. 1 (rev)');
    expect(res.body.data.recipients).toBe(99);
  });
});

// ---------------------------------------------------------------
// P1-7: POST input validation
// ---------------------------------------------------------------
describe('POST /api/reports — P1-7 input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an unknown type with 400', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/reports')
      .send({ ...validReport, type: 'unknown' });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown status with 400', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/reports')
      .send({ ...validReport, status: 'queued-for-doom' });
    expect(res.status).toBe(400);
  });

  it('accepts a fully-valid payload with 201', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/reports').send(validReport);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
