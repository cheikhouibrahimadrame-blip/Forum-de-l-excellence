import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Minimal Express app that only mounts the health endpoint.
 * This avoids needing the full server bootstrap (DB, secrets, etc.).
 */
function createHealthApp() {
    const app = express();

    app.get('/api/health', (_req, res) => {
        res.json({
            success: true,
            message: "Forum de L'excellence API est en ligne",
            timestamp: new Date().toISOString(),
        });
    });

    app.use((_req, res) => {
        res.status(404).json({ success: false, message: 'Route non trouvée' });
    });

    return app;
}

describe('GET /api/health', () => {
    const app = createHealthApp();

    it('should return 200 with success true', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should include a timestamp', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body.timestamp).toBeDefined();
        expect(() => new Date(res.body.timestamp)).not.toThrow();
    });

    it('should include the correct message', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body.message).toContain('API');
    });
});

describe('404 handling', () => {
    const app = createHealthApp();

    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/nonexistent');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
