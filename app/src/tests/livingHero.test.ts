// @vitest-environment node
//
// P2-8 — Hero asset optimisation
//
// Locks down the deriveOptimisedSiblings allowlist. The function only
// emits AVIF/WebP siblings for posters we actually pre-generate via
// `npm run optimize:hero`. Any other URL must return null, otherwise
// the rendered <picture> would point at non-existent files and break
// the static-fallback path for prefers-reduced-motion users.

import { describe, it, expect } from 'vitest';
import { deriveOptimisedSiblings } from '../components/public/living';

describe('deriveOptimisedSiblings (P2-8)', () => {
  it('emits AVIF + WebP siblings for /campus-hero.png', () => {
    expect(deriveOptimisedSiblings('/campus-hero.png')).toEqual({
      avif: '/campus-hero.avif',
      webp: '/campus-hero.webp',
    });
  });

  it('returns null for posters with no pre-generated siblings', () => {
    // These URLs appear in pagesDefaults.ts but the optimizer hasn't
    // been pointed at them yet — emitting siblings would 404.
    expect(deriveOptimisedSiblings('/programs-hero.jpg')).toBeNull();
    expect(deriveOptimisedSiblings('/admissions-hero.jpg')).toBeNull();
    expect(deriveOptimisedSiblings('/campus-hero.jpg')).toBeNull();
  });

  it('returns null for unknown PNGs (allowlist, not extension match)', () => {
    expect(deriveOptimisedSiblings('/unknown-hero.png')).toBeNull();
    expect(deriveOptimisedSiblings('/logo.png')).toBeNull();
  });

  it('returns null for non-image URLs', () => {
    expect(deriveOptimisedSiblings('/excz.mp4')).toBeNull();
    expect(deriveOptimisedSiblings('')).toBeNull();
    expect(deriveOptimisedSiblings('/')).toBeNull();
  });
});
