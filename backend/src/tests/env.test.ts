import { describe, it, expect } from 'vitest';
import { validateJwtSecrets, validateJwtEnv, getJwtSecretStatus } from '../utils/env';

describe('validateJwtSecrets', () => {
    const validAccess = 'a'.repeat(32);
    const validRefresh = 'b'.repeat(32);
    const validAccessPrev = 'c'.repeat(32);
    const validRefreshPrev = 'd'.repeat(32);

    it('should fail when no secrets are provided', () => {
        const result = validateJwtSecrets({});
        expect(result.ok).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail when secrets are too short', () => {
        const result = validateJwtSecrets({
            JWT_SECRET: 'short',
            JWT_REFRESH_SECRET: 'short',
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.stringContaining('at least 32 characters'),
            ])
        );
    });

    it('should fail when access and refresh secrets are the same', () => {
        const result = validateJwtSecrets({
            JWT_SECRET: validAccess,
            JWT_REFRESH_SECRET: validAccess,
        });
        expect(result.ok).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.stringContaining('must be different'),
            ])
        );
    });

    it('should fail when previous secret equals current', () => {
        const result = validateJwtSecrets({
            JWT_SECRET: validAccess,
            JWT_SECRET_PREVIOUS: validAccess,
            JWT_REFRESH_SECRET: validRefresh,
            JWT_REFRESH_SECRET_PREVIOUS: validRefresh,
        });
        expect(result.ok).toBe(false);
    });

    it('should pass with valid distinct secrets', () => {
        const result = validateJwtSecrets({
            JWT_SECRET: validAccess,
            JWT_SECRET_PREVIOUS: validAccessPrev,
            JWT_REFRESH_SECRET: validRefresh,
            JWT_REFRESH_SECRET_PREVIOUS: validRefreshPrev,
        });
        expect(result.ok).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
});

describe('getJwtSecretStatus', () => {
    it('should report which secrets are set', () => {
        const status = getJwtSecretStatus({
            JWT_SECRET: 'something',
            JWT_REFRESH_SECRET: 'other',
        });
        expect(status.accessSecretSet).toBe(true);
        expect(status.refreshSecretSet).toBe(true);
        expect(status.accessPreviousSet).toBe(false);
        expect(status.refreshPreviousSet).toBe(false);
    });
});
