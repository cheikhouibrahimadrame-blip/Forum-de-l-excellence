import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

let tmpRoot: string;
let originalPersistenceDir: string | undefined;
let uploadRoot: string;

beforeEach(async () => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-test-'));
  originalPersistenceDir = process.env.PERSISTENCE_DIR;
  // jsonStore writes here; saveJsonStore is what populates the references.
  process.env.PERSISTENCE_DIR = tmpRoot;
  uploadRoot = path.join(tmpRoot, 'uploads', 'campus-life');
  fs.mkdirSync(uploadRoot, { recursive: true });
});

afterEach(async () => {
  if (originalPersistenceDir === undefined) {
    delete process.env.PERSISTENCE_DIR;
  } else {
    process.env.PERSISTENCE_DIR = originalPersistenceDir;
  }
  try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* swallow */ }
});

import { saveJsonStore } from '../lib/jsonStore';
import { cleanOrphanUploads } from '../utils/uploadsGc';

const writeFile = (name: string, ageMs = 0) => {
  const full = path.join(uploadRoot, name);
  fs.writeFileSync(full, 'test');
  if (ageMs > 0) {
    const past = new Date(Date.now() - ageMs);
    fs.utimesSync(full, past, past);
  }
  return full;
};

describe('uploadsGc — P1-5 orphan cleanup', () => {
  it('keeps files referenced from any JSON store', () => {
    const referenced = writeFile('referenced.png', 7 * 24 * 3600 * 1000); // 7 days old
    const orphan = writeFile('orphan.png', 7 * 24 * 3600 * 1000);

    saveJsonStore('branding-settings.json', {
      brand: { logoUrl: '/uploads/campus-life/referenced.png' }
    });

    const result = cleanOrphanUploads({
      uploadRoot: path.join(tmpRoot, 'uploads'),
      graceMs: 1000 // 1s so anything older than that is fair game
    });

    expect(fs.existsSync(referenced)).toBe(true);
    expect(fs.existsSync(orphan)).toBe(false);
    expect(result.deletedFiles).toContain(orphan);
    expect(result.referencedFiles).toBe(1);
  });

  it('honours the grace window for fresh uploads', () => {
    const fresh = writeFile('just-uploaded.png'); // mtime = now
    const stale = writeFile('stale.png', 48 * 3600 * 1000); // 48h old

    saveJsonStore('branding-settings.json', {});

    const result = cleanOrphanUploads({
      uploadRoot: path.join(tmpRoot, 'uploads'),
      graceMs: 24 * 3600 * 1000 // 24h grace
    });

    expect(fs.existsSync(fresh)).toBe(true);   // protected by grace
    expect(fs.existsSync(stale)).toBe(false);  // collected
    expect(result.graceFiles).toBe(1);
  });

  it('dry-run reports candidates but never unlinks anything', () => {
    const orphan = writeFile('dry.png', 7 * 24 * 3600 * 1000);

    saveJsonStore('branding-settings.json', {});

    const result = cleanOrphanUploads({
      uploadRoot: path.join(tmpRoot, 'uploads'),
      graceMs: 1000,
      dryRun: true
    });

    expect(fs.existsSync(orphan)).toBe(true); // still on disk
    expect(result.deletedFiles).toContain(orphan); // listed as candidate
  });

  it('matches references inside nested arrays / objects', () => {
    const a = writeFile('hero.png', 7 * 24 * 3600 * 1000);
    const b = writeFile('gallery.png', 7 * 24 * 3600 * 1000);
    const orphan = writeFile('forgotten.png', 7 * 24 * 3600 * 1000);

    saveJsonStore('homepage-content.json', {
      hero: { backgroundUrl: '/uploads/campus-life/hero.png' },
      gallery: [{ src: '/uploads/campus-life/gallery.png' }]
    });

    const result = cleanOrphanUploads({
      uploadRoot: path.join(tmpRoot, 'uploads'),
      graceMs: 1000
    });

    expect(fs.existsSync(a)).toBe(true);
    expect(fs.existsSync(b)).toBe(true);
    expect(fs.existsSync(orphan)).toBe(false);
    expect(result.referencedFiles).toBe(2);
  });

  it('matches absolute URLs containing /uploads/...', () => {
    const file = writeFile('absolute.png', 7 * 24 * 3600 * 1000);

    saveJsonStore('branding-settings.json', {
      // The URL persisted in production includes the host:
      brand: { heroBannerUrl: 'https://api.example.sn/uploads/campus-life/absolute.png' }
    });

    const result = cleanOrphanUploads({
      uploadRoot: path.join(tmpRoot, 'uploads'),
      graceMs: 1000
    });

    expect(fs.existsSync(file)).toBe(true);
    expect(result.deletedFiles).toHaveLength(0);
  });

  it('returns zero counts when the upload root does not exist', () => {
    const result = cleanOrphanUploads({
      uploadRoot: path.join(tmpRoot, 'does-not-exist')
    });
    expect(result.scannedFiles).toBe(0);
    expect(result.deletedFiles).toHaveLength(0);
  });
});
