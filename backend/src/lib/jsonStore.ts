import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import logger from '../utils/logger';

const resolveDataDir = (): string => {
  const customDir = process.env.PERSISTENCE_DIR;
  if (customDir && customDir.trim().length > 0) {
    return path.resolve(customDir);
  }

  // Keep persistence outside backend watch paths to avoid dev restarts on each write.
  return path.join(os.homedir(), '.okcomputer-cms-data');
};

const resolveLegacyDataDir = (): string => path.resolve(process.cwd(), 'data');

const ensureDataDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const loadJsonStore = <T>(fileName: string, fallback: T): T => {
  const dataDir = resolveDataDir();
  ensureDataDir(dataDir);

  const filePath = path.join(dataDir, fileName);
  const legacyFilePath = path.join(resolveLegacyDataDir(), fileName);

  if (!fs.existsSync(filePath)) {
    // One-time migration path for previously stored files in backend/data.
    if (fs.existsSync(legacyFilePath)) {
      try {
        const legacyRaw = fs.readFileSync(legacyFilePath, 'utf-8');
        const parsed = JSON.parse(legacyRaw) as T;
        saveJsonStore(fileName, parsed);
        return parsed;
      } catch (error) {
        logger.error({ error, legacyFilePath }, 'Failed to migrate legacy JSON store; using fallback');
      }
    }

    return fallback;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    logger.error({ error, filePath }, 'Failed to load JSON store; using fallback');
    return fallback;
  }
};

export const saveJsonStore = <T>(fileName: string, data: T): void => {
  const dataDir = resolveDataDir();
  ensureDataDir(dataDir);

  const filePath = path.join(dataDir, fileName);
  // Random suffix avoids races between concurrent writers on the same file.
  const tmpPath = `${filePath}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  const payload = JSON.stringify(data, null, 2);

  // Atomic write pattern:
  //   1. open + write the full payload to a sibling tmp file
  //   2. fsync the fd so the bytes are durably on disk
  //   3. rename(tmp, target) — POSIX atomic on the same filesystem
  // A crash before step 3 leaves the original target untouched; the orphan
  // tmp file is harmless (cleaned next run, see comment below).
  let fd: number | null = null;
  try {
    fd = fs.openSync(tmpPath, 'w');
    fs.writeFileSync(fd, payload, 'utf-8');
    try { fs.fsyncSync(fd); } catch { /* fsync may not be supported on all FS */ }
    fs.closeSync(fd);
    fd = null;
    fs.renameSync(tmpPath, filePath);
  } catch (error) {
    logger.error({ error, filePath }, 'Failed to save JSON store');
    if (fd !== null) {
      try { fs.closeSync(fd); } catch { /* swallow */ }
    }
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch { /* swallow */ }
    }
  }
};
