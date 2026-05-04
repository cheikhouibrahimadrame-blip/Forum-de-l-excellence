import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// jsonStore reads PERSISTENCE_DIR at call time so we can redirect the
// store to a fresh tmp dir per test without touching the user's $HOME.
let tmpDir: string;
let originalPersistenceDir: string | undefined;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonstore-test-'));
  originalPersistenceDir = process.env.PERSISTENCE_DIR;
  process.env.PERSISTENCE_DIR = tmpDir;
});

afterEach(async () => {
  if (originalPersistenceDir === undefined) {
    delete process.env.PERSISTENCE_DIR;
  } else {
    process.env.PERSISTENCE_DIR = originalPersistenceDir;
  }
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* swallow */ }
});

import { loadJsonStore, saveJsonStore } from '../lib/jsonStore';

describe('jsonStore — P2-12 atomic write', () => {
  it('writes via a tmp + rename pattern (no tmp leftover on success)', () => {
    saveJsonStore('foo.json', { hello: 'world', n: 42 });
    const entries = fs.readdirSync(tmpDir);
    // Exactly one file: the destination. No `.tmp` siblings remain.
    expect(entries).toContain('foo.json');
    expect(entries.filter((e) => e.endsWith('.tmp'))).toHaveLength(0);
  });

  it('round-trips through load/save without losing fields', () => {
    const payload = { name: 'Forum', items: [1, 2, 3], deep: { a: 'b' } };
    saveJsonStore('round.json', payload);
    const loaded = loadJsonStore('round.json', null);
    expect(loaded).toEqual(payload);
  });

  it('does not corrupt the destination if a save fails part-way', () => {
    saveJsonStore('safe.json', { v: 1 });
    expect(loadJsonStore('safe.json', null)).toEqual({ v: 1 });

    // Make the *destination* a directory so rename fails — emulates a
    // partial-write disaster. The bytes from the new attempt must NEVER
    // leak into a corrupt destination file.
    fs.unlinkSync(path.join(tmpDir, 'safe.json'));
    fs.mkdirSync(path.join(tmpDir, 'safe.json'));

    saveJsonStore('safe.json', { v: 2 });
    // The directory is still there (rename can't replace a non-empty dir),
    // and load returns the fallback because JSON.parse fails on a dir.
    expect(loadJsonStore('safe.json', { fallback: true })).toEqual({ fallback: true });

    // Crucially: no half-written `.tmp` left lying around.
    const tmps = fs.readdirSync(tmpDir).filter((e) => e.endsWith('.tmp'));
    expect(tmps).toHaveLength(0);
  });

  it('overwrites existing content atomically', () => {
    saveJsonStore('mut.json', { v: 1 });
    saveJsonStore('mut.json', { v: 2 });
    saveJsonStore('mut.json', { v: 3 });
    expect(loadJsonStore('mut.json', null)).toEqual({ v: 3 });

    // No tmp siblings left after a series of writes.
    const tmps = fs.readdirSync(tmpDir).filter((e) => e.endsWith('.tmp'));
    expect(tmps).toHaveLength(0);
  });
});
