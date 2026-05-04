import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// ── Allowed extensions & MIME types (strict allowlist) ──────────────────
// P1-4: SVG removed. SVG is XML and can embed JavaScript through many vectors
// (<script>, <foreignObject>, on* event handlers, <use href="javascript:…">,
// <style>@import url(javascript:…), etc.). The previous heuristic only blocked
// literal `<script>` tags. Until we wire DOMPurify (server-side, SVG strict
// mode) we drop SVG from the allowlist; raster formats cover all admin needs.
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif',
  '.mp4', '.webm', '.mov', '.avi'
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
]);

// ── Upload directory ────────────────────────────────────────────────────
const uploadDir = path.join(process.cwd(), 'uploads', 'campus-life');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Storage config ──────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safeName}${ext}`);
  }
});

// ── File filter: check BOTH extension AND MIME type ─────────────────────
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    logger.warn({ filename: file.originalname, ext }, 'Upload rejected: disallowed extension');
    cb(new Error('Type de fichier non supporté'));
    return;
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    logger.warn({ filename: file.originalname, mime: file.mimetype }, 'Upload rejected: disallowed MIME type');
    cb(new Error('Type de fichier non supporté'));
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
    files: 20
  }
});

// ── Magic byte validation (post-upload) ─────────────────────────────────
async function validateMagicBytes(filePath: string, declaredMime: string): Promise<boolean> {
  try {
    // Dynamic import for ESM-only file-type package
    const { fileTypeFromFile } = await import('file-type');
    const detected = await fileTypeFromFile(filePath);

    if (!detected) {
      logger.warn({ filePath, declaredMime }, 'Magic bytes: unable to detect file type');
      return false;
    }

    // Verify the detected MIME matches an allowed type.
    if (!ALLOWED_MIME_TYPES.has(detected.mime)) {
      logger.warn({ filePath, declaredMime, detectedMime: detected.mime }, 'Magic bytes mismatch');
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error, filePath }, 'Magic byte validation failed');
    return false;
  }
}

// ── Route ───────────────────────────────────────────────────────────────
router.post(
  '/campus-life',
  authenticate,
  authorize(['ADMIN']),
  upload.array('files', 20),
  async (req, res) => {
    const files = (req.files as Express.Multer.File[]) || [];

    if (!files.length) {
      res.status(400).json({ success: false, error: 'Aucun fichier reçu' });
      return;
    }

    // Validate magic bytes for every uploaded file
    const validFiles: Express.Multer.File[] = [];
    for (const file of files) {
      const isValid = await validateMagicBytes(file.path, file.mimetype);
      if (!isValid) {
        // Delete the invalid file immediately
        try { fs.unlinkSync(file.path); } catch {}
        logger.warn({ filename: file.originalname }, 'File removed after magic byte validation failure');
      } else {
        validFiles.push(file);
      }
    }

    if (!validFiles.length) {
      res.status(400).json({ success: false, error: 'Aucun fichier valide reçu (type non reconnu)' });
      return;
    }

    // P1-3: Use a trusted public URL from env, not the Host header.
    // `req.get('host')` is attacker-controlled (Host injection) and any URL
    // built from it gets persisted into the JSON content stores forever.
    // Falls back to the request origin when BACKEND_PUBLIC_URL is unset (dev).
    const publicBase = (process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
    const data = validFiles.map(file => ({
      url: `${publicBase}/uploads/campus-life/${file.filename}`,
      type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      alt: file.originalname
    }));

    logger.info({ count: validFiles.length }, 'Files uploaded successfully');

    res.json({ success: true, data });
  }
);

export default router;
