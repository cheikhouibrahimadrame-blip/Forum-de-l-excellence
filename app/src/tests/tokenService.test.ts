// Batch C / P2-11 — Access token persistence
//
// Without persistence the token lived only in module closure and was
// lost on every tab reload, forcing /api/auth/refresh + a "logged out"
// flash on every navigation. These tests pin the persistence contract
// so a future refactor can't silently regress it.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const STORAGE_KEY = 'fe.accessToken';

describe('tokenService (P2-11)', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    // Drop the cached module so the next dynamic import re-runs the
    // initialiser (which reads sessionStorage and seeds the closure).
    vi.resetModules();
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it('returns empty string when nothing is stored', async () => {
    const mod = await import('../lib/tokenService');
    expect(mod.getAccessToken()).toBe('');
  });

  it('persists a set token to sessionStorage and returns it', async () => {
    const mod = await import('../lib/tokenService');
    mod.setAccessToken('abc.def.ghi');
    expect(mod.getAccessToken()).toBe('abc.def.ghi');
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe('abc.def.ghi');
  });

  it('clears the token from sessionStorage on logout', async () => {
    const mod = await import('../lib/tokenService');
    mod.setAccessToken('abc.def.ghi');
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe('abc.def.ghi');

    mod.clearAccessToken();
    expect(mod.getAccessToken()).toBe('');
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('hydrates from sessionStorage on first import (survives tab reload)', async () => {
    // Simulate a previous tab having stored a token, then re-import as
    // if the page had been reloaded.
    window.sessionStorage.setItem(STORAGE_KEY, 'persisted.token');

    const mod = await import('../lib/tokenService');
    expect(mod.getAccessToken()).toBe('persisted.token');
  });

  it('treats setAccessToken("") as a clear', async () => {
    const mod = await import('../lib/tokenService');
    mod.setAccessToken('abc');
    mod.setAccessToken('');
    expect(mod.getAccessToken()).toBe('');
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
