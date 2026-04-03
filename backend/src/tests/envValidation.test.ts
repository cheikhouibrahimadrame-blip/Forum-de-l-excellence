import { describe, it, expect } from 'vitest';
import { validateJwtEnv } from '../utils/env';

const makeEnv = (values: Record<string, string | undefined>): Record<string, string | undefined> => ({
  JWT_SECRET: values.JWT_SECRET,
  JWT_SECRET_PREVIOUS: values.JWT_SECRET_PREVIOUS,
  JWT_REFRESH_SECRET: values.JWT_REFRESH_SECRET,
  JWT_REFRESH_SECRET_PREVIOUS: values.JWT_REFRESH_SECRET_PREVIOUS,
});

const validAccess = 'a'.repeat(32);
const validRefresh = 'b'.repeat(32);

describe('validateJwtEnv', () => {
  it('fails when no secrets are provided', () => {
    const result = validateJwtEnv(makeEnv({}));
    expect(result.ok).toBe(false);
  });

  it('fails when secrets are too short', () => {
    const result = validateJwtEnv(makeEnv({
      JWT_SECRET: 'short',
      JWT_REFRESH_SECRET: 'short',
    }));
    expect(result.ok).toBe(false);
  });

  it('fails when access and refresh secrets are identical', () => {
    const result = validateJwtEnv(makeEnv({
      JWT_SECRET: validAccess,
      JWT_REFRESH_SECRET: validAccess,
    }));
    expect(result.ok).toBe(false);
  });

  it('fails when current equals previous secret', () => {
    const result = validateJwtEnv(makeEnv({
      JWT_SECRET: validAccess,
      JWT_SECRET_PREVIOUS: validAccess,
      JWT_REFRESH_SECRET: validRefresh,
      JWT_REFRESH_SECRET_PREVIOUS: validRefresh,
    }));
    expect(result.ok).toBe(false);
  });

  it('passes with valid distinct secrets', () => {
    const result = validateJwtEnv(makeEnv({
      JWT_SECRET: validAccess,
      JWT_SECRET_PREVIOUS: 'c'.repeat(32),
      JWT_REFRESH_SECRET: validRefresh,
      JWT_REFRESH_SECRET_PREVIOUS: 'd'.repeat(32),
    }));
    expect(result.ok).toBe(true);
  });
});
