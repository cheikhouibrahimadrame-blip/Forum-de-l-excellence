// @vitest-environment node
//
// Batch C / P2-2 — Safe post-login redirect helper
//
// Locks down the open-redirect surface used by `LoginPage`. If any of
// these cases regress, an attacker could send a victim to
// `/login` with `state.from = '//evil'` and bounce them to a
// phishing page on success.
//
// Pure logic, no DOM — runs in the node env to skip the ~25s jsdom
// init for this file.

import { describe, it, expect } from 'vitest';
import { safeFromPath, isSafeFromPath } from '../lib/safeRedirect';

describe('safeFromPath (P2-2)', () => {
  const fallback = '/admin';

  describe('rejects unsafe input → returns fallback', () => {
    it('rejects non-strings', () => {
      expect(safeFromPath(undefined, fallback)).toBe(fallback);
      expect(safeFromPath(null, fallback)).toBe(fallback);
      expect(safeFromPath(42, fallback)).toBe(fallback);
      expect(safeFromPath({ from: '/admin' }, fallback)).toBe(fallback);
    });

    it('rejects paths that do not start with /', () => {
      expect(safeFromPath('admin/users', fallback)).toBe(fallback);
      expect(safeFromPath('http://evil.com', fallback)).toBe(fallback);
      expect(safeFromPath('javascript:alert(1)', fallback)).toBe(fallback);
    });

    it('rejects protocol-relative URLs (//evil.com)', () => {
      expect(safeFromPath('//evil.com', fallback)).toBe(fallback);
      expect(safeFromPath('//evil.com/admin', fallback)).toBe(fallback);
    });

    it('rejects backslash-escaped open-redirect tricks (/\\evil.com)', () => {
      expect(safeFromPath('/\\evil.com', fallback)).toBe(fallback);
      expect(safeFromPath('/\\\\evil.com', fallback)).toBe(fallback);
    });

    it('rejects auth pages to avoid login loops', () => {
      expect(safeFromPath('/login', fallback)).toBe(fallback);
      expect(safeFromPath('/login?next=/admin', fallback)).toBe(fallback);
      expect(safeFromPath('/change-password', fallback)).toBe(fallback);
      expect(safeFromPath('/forgot-password', fallback)).toBe(fallback);
      expect(safeFromPath('/reset-password/abc-123', fallback)).toBe(fallback);
    });

    it('rejects empty string', () => {
      expect(safeFromPath('', fallback)).toBe(fallback);
    });
  });

  describe('accepts safe paths → returns the path', () => {
    it('accepts a plain dashboard path', () => {
      expect(safeFromPath('/admin', fallback)).toBe('/admin');
    });

    it('accepts a deep sub-route', () => {
      expect(safeFromPath('/admin/users/42', fallback)).toBe('/admin/users/42');
    });

    it('accepts a path with a query string', () => {
      expect(safeFromPath('/admin/users?role=TEACHER', fallback)).toBe('/admin/users?role=TEACHER');
    });

    it('accepts a path with a hash fragment', () => {
      expect(safeFromPath('/admin#section', fallback)).toBe('/admin#section');
    });

    it('does not confuse /loginx with /login', () => {
      // /login itself is rejected, but /login-help (hypothetical) must not be
      // because we anchor on a full segment boundary.
      expect(safeFromPath('/login-help', fallback)).toBe('/login-help');
    });
  });

  it('isSafeFromPath narrows the type to string', () => {
    const v: unknown = '/admin';
    if (isSafeFromPath(v)) {
      // TypeScript-level check: this assignment must compile.
      const s: string = v;
      expect(s).toBe('/admin');
    } else {
      throw new Error('expected isSafeFromPath to narrow to string');
    }
  });
});
