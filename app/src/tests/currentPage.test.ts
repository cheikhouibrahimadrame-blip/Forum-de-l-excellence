// @vitest-environment node
//
// Batch C / P2-7 — Topbar title longest-prefix matcher
//
// Ensures `/admin/users/42` keeps showing "Utilisateurs" instead of
// the dashboard fallback, and that `/admin/users` does NOT bleed into
// `/admin/users-archive` (full-segment boundary).
//
// Pure logic, no DOM — node env skips the jsdom init.

import { describe, it, expect } from 'vitest';
import { pickCurrentPageName } from '../lib/currentPage';

const NAV = [
  { name: 'Tableau de bord', href: '/admin' },
  { name: 'Utilisateurs', href: '/admin/users' },
  { name: 'Classes', href: '/admin/classes' },
  { name: 'Paramètres', href: '/admin/settings' },
];

describe('pickCurrentPageName (P2-7)', () => {
  it('returns the exact match when the path matches an item', () => {
    expect(pickCurrentPageName(NAV, '/admin/users', 'fallback')).toBe('Utilisateurs');
    expect(pickCurrentPageName(NAV, '/admin/classes', 'fallback')).toBe('Classes');
  });

  it('returns the longest segment-prefix for sub-routes', () => {
    expect(pickCurrentPageName(NAV, '/admin/users/42', 'fallback')).toBe('Utilisateurs');
    expect(pickCurrentPageName(NAV, '/admin/settings/general/theme', 'fallback')).toBe('Paramètres');
  });

  it('does NOT match across path segments (no /admin/users-archive bleed)', () => {
    // /admin/users is in NAV; /admin/users-archive must NOT pick it up.
    expect(pickCurrentPageName(NAV, '/admin/users-archive', 'fallback')).toBe('Tableau de bord');
  });

  it('falls back to the dashboard label for the bare /admin route only via exact match', () => {
    expect(pickCurrentPageName(NAV, '/admin', 'fallback')).toBe('Tableau de bord');
  });

  it('returns the fallback when nothing matches', () => {
    expect(pickCurrentPageName(NAV, '/teacher/grades', 'fallback')).toBe('fallback');
    expect(pickCurrentPageName(NAV, '/', 'fallback')).toBe('fallback');
    expect(pickCurrentPageName([], '/admin/users', 'fallback')).toBe('fallback');
  });

  it('is order-independent (returns the longest match regardless of array order)', () => {
    const reordered = [...NAV].reverse();
    expect(pickCurrentPageName(reordered, '/admin/users/42', 'fallback')).toBe('Utilisateurs');
  });
});
