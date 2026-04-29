import fs from 'fs';
import os from 'os';
import path from 'path';
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

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    logger.error({ error, filePath }, 'Failed to save JSON store');
  }
};
