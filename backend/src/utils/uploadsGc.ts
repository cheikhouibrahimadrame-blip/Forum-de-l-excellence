import fs from 'fs';
import path from 'path';
import { loadJsonStore } from '../lib/jsonStore';
import logger from './logger';

// ─────────────────────────────────────────────────────────────────────
// Orphan upload GC (P1-5)
//
// Files are written to `uploads/<subdir>/...` and their public URLs are
// persisted into the JSON stores (branding, pages, homepage, reports).
// When the admin removes an item from the editor, the JSON entry goes
// away but the file on disk stays — the directory grows forever.
//
// This utility:
//   1. enumerates every file under the upload root
//   2. reads every JSON store + scans for `/uploads/...` substrings
//   3. deletes files that aren't referenced anywhere
//   4. honours a "grace period": brand-new uploads (uploaded but not yet
//      persisted into a JSON store by the admin's save) are kept.
//
// Designed to be safe to run repeatedly (idempotent) and concurrently
// with normal traffic — no global locks required.
// ─────────────────────────────────────────────────────────────────────

export interface GcOptions {
  /** Absolute path to the uploads root. Defaults to `<cwd>/uploads`. */
  uploadRoot?: string;
  /**
   * Files modified within `graceMs` ms are never deleted, even if not
   * referenced. Protects in-flight uploads. Defaults to 24h.
   */
  graceMs?: number;
  /**
   * If true, log what would be deleted but don't actually unlink anything.
   */
  dryRun?: boolean;
  /**
   * JSON store filenames whose contents must be searched for upload
   * references. The default list mirrors every CMS store the app uses.
   */
  jsonStoreNames?: string[];
}

const DEFAULT_JSON_STORES = [
  'branding-settings.json',
  'homepage-content.json',
  'pages-content.json',
  'reports.json'
];

/** Walk a directory recursively and yield absolute file paths. */
const walkFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const stack: string[] = [dir];
  while (stack.length) {
    const current = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (error) {
      logger.warn({ error, dir: current }, 'GC: failed to read directory');
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
};

/**
 * Pull every `/uploads/<...>` path from the union of all JSON stores.
 * The match runs on the stringified store, so we capture URLs regardless
 * of where the admin happened to put them in the schema.
 */
const collectReferencedPaths = (storeNames: string[]): Set<string> => {
  const referenced = new Set<string>();
  // Same regex captures the path portion of:
  //   "/uploads/campus-life/123-foo.png"
  //   "https://api.example.sn/uploads/campus-life/123-foo.png"
  // Stops at quote, whitespace, ?, #.
  const URL_RE = /\/uploads\/[A-Za-z0-9._\-/]+/g;

  for (const name of storeNames) {
    let raw: unknown;
    try {
      raw = loadJsonStore<unknown>(name, null);
    } catch (error) {
      logger.warn({ error, name }, 'GC: failed to load JSON store');
      continue;
    }
    if (!raw) continue;
    const serialized = JSON.stringify(raw);
    const matches = serialized.match(URL_RE);
    if (!matches) continue;
    for (const match of matches) {
      // Normalise to a path relative to /uploads/ so we can compare against
      // the on-disk relative path (independent of host / protocol).
      referenced.add(match);
    }
  }

  return referenced;
};

export interface GcResult {
  scannedFiles: number;
  referencedFiles: number;
  graceFiles: number;
  deletedFiles: string[];
  failedDeletions: string[];
  tmpFilesRemoved: string[];
}

/**
 * Enumerate orphan files and (unless dryRun) delete them.
 */
export const cleanOrphanUploads = (opts: GcOptions = {}): GcResult => {
  const uploadRoot = path.resolve(opts.uploadRoot || path.join(process.cwd(), 'uploads'));
  const graceMs = typeof opts.graceMs === 'number' ? opts.graceMs : 24 * 60 * 60 * 1000;
  const dryRun = !!opts.dryRun;
  const storeNames = opts.jsonStoreNames || DEFAULT_JSON_STORES;

  const result: GcResult = {
    scannedFiles: 0,
    referencedFiles: 0,
    graceFiles: 0,
    deletedFiles: [],
    failedDeletions: [],
    tmpFilesRemoved: []
  };

  if (!fs.existsSync(uploadRoot)) {
    return result;
  }

  const referenced = collectReferencedPaths(storeNames);
  const allFiles = walkFiles(uploadRoot);
  result.scannedFiles = allFiles.length;
  const cutoff = Date.now() - graceMs;

  for (const fullPath of allFiles) {
    // Always remove leftover atomic-write tmp files (written by jsonStore on
    // crash). They live next to the JSON files, not under uploads, so we
    // ONLY clean the .tmp pattern within the uploads tree as a side benefit.
    if (fullPath.endsWith('.tmp')) {
      try {
        fs.unlinkSync(fullPath);
        result.tmpFilesRemoved.push(fullPath);
      } catch { /* swallow */ }
      continue;
    }

    // Build the public-style key — `/uploads/<rel-path>` — to match
    // whatever was persisted in the JSON stores.
    const rel = path.relative(uploadRoot, fullPath).split(path.sep).join('/');
    const publicKey = `/uploads/${rel}`;

    if (referenced.has(publicKey)) {
      result.referencedFiles += 1;
      continue;
    }

    // Honour grace period for in-flight uploads.
    let mtimeMs = 0;
    try {
      mtimeMs = fs.statSync(fullPath).mtimeMs;
    } catch (error) {
      logger.warn({ error, fullPath }, 'GC: stat failed');
      continue;
    }
    if (mtimeMs > cutoff) {
      result.graceFiles += 1;
      continue;
    }

    if (dryRun) {
      result.deletedFiles.push(fullPath);
      continue;
    }

    try {
      fs.unlinkSync(fullPath);
      result.deletedFiles.push(fullPath);
    } catch (error) {
      result.failedDeletions.push(fullPath);
      logger.warn({ error, fullPath }, 'GC: delete failed');
    }
  }

  logger.info(
    {
      uploadRoot,
      scanned: result.scannedFiles,
      referenced: result.referencedFiles,
      grace: result.graceFiles,
      deleted: result.deletedFiles.length,
      failed: result.failedDeletions.length,
      dryRun
    },
    'Upload GC complete'
  );

  return result;
};
