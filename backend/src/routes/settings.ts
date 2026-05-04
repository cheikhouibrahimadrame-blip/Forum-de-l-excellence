import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import logger from '../utils/logger';
import prisma from '../lib/prisma';
import {
  getBrandingContent,
  updateBrandingContent,
  getBrandingState,
  patchBrandingBrand
} from '../controllers/brandingController';

const router = Router();

// ── P1-1: validation helpers ─────────────────────────────────────────────
// Every settings endpoint used to persist whatever the client sent. An admin
// (or attacker authenticated as admin) could store passwordMinLength: 1,
// maxLoginAttempts: -5, theme: '<script>...', etc. The helpers below clamp
// numbers, allowlist enums, and reject obviously-bad input before it reaches
// Prisma.

const ALLOWED_THEMES = new Set(['light', 'dark', 'auto']);
const ALLOWED_FONT_SIZES = new Set(['small', 'medium', 'large']);
const ALLOWED_BACKUP_FREQUENCIES = new Set(['hourly', 'daily', 'weekly', 'monthly']);
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

const clampInt = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < min || n > max) return null;
  return n;
};

const sendValidationError = (res: Response, field: string, msg?: string) => {
  res.status(400).json({
    success: false,
    error: msg || `Champ invalide: ${field}`
  });
};

const defaultSettingsStore = {
  security: {
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    enableTwoFactor: false,
    maxLoginAttempts: 5
  },
  general: {
    name: 'Forum de L\'excellence',
    address: 'Medinatoul Salam, Mbour, Sénégal',
    phone: '+221 775368254',
    email: 'gsforumexcellence@gmail.com',
    website: 'www.forumexcellence.sn',
    principal: 'M. et Mme Fall',
    year: '2025-2026'
  },
  notifications: {
    emailNotifications: true,
    browserNotifications: true,
    gradeUpdates: true,
    attendanceAlerts: true,
    appointmentReminders: true,
    systemUpdates: true,
    newsletter: false
  },
  appearance: {
    theme: 'light',
    primaryColor: '#003366',
    accentColor: '#C39D5B',
    fontSize: 'medium'
  },
  database: {
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    encryptionEnabled: true
  },
  email: {
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    senderEmail: 'noreply@forumexcellence.sn',
    senderName: 'Forum de L\'excellence',
    useSSL: true,
    enableAutoNotifications: true
  }
};

// P1-2: branding.brand is the canonical store for the school's identity
// fields. We project it into the `general` shape the admin UI expects.
const generalFromBranding = () => {
  const b = getBrandingState().brand;
  return {
    name: b.name,
    address: b.address,
    phone: b.phone,
    email: b.email,
    website: b.website,
    principal: b.principal,
    year: b.year
  };
};

// Helper: read settings from Prisma-backed models, falling back to defaults.
// `general` is sourced from branding (P1-2) so the "Informations générales"
// and "Identité du site" tabs can never desynchronize.
const readAllSettings = async () => {
  const [security, notifications, appearance, database, email] = await Promise.all([
    prisma.securitySettings.findFirst(),
    prisma.notificationSettings.findFirst(),
    prisma.appearanceSettings.findFirst(),
    prisma.databaseSettings.findFirst(),
    prisma.emailSettings.findFirst()
  ]);

  return {
    security: security ?? defaultSettingsStore.security,
    general: generalFromBranding(),
    notifications: notifications ?? defaultSettingsStore.notifications,
    appearance: appearance ?? defaultSettingsStore.appearance,
    database: database ?? defaultSettingsStore.database,
    email: email ?? defaultSettingsStore.email
  };
};

// ── Public read (safe appearance-only payload) ───────────────────────────
router.get('/appearance', async (_req: Request, res: Response) => {
  try {
    const appearance = await prisma.appearanceSettings.findFirst();
    const brand = getBrandingState().brand; // P1-2: school info from branding
    res.json({
      success: true,
      data: {
        theme: appearance?.theme ?? defaultSettingsStore.appearance.theme,
        primaryColor: appearance?.primaryColor ?? defaultSettingsStore.appearance.primaryColor,
        accentColor: appearance?.accentColor ?? defaultSettingsStore.appearance.accentColor,
        fontSize: appearance?.fontSize ?? defaultSettingsStore.appearance.fontSize,
        schoolName: brand.name,
        schoolPhone: brand.phone,
        schoolEmail: brand.email
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to retrieve public appearance settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des paramètres' });
  }
});

// ── Public read for site-wide branding ──────────────────────────────────
router.get('/branding', getBrandingContent);

// ── All write routes require ADMIN ──────────────────────────────────────
router.use(authenticate, authorize(['ADMIN']));

// Admin-only update for site-wide branding
router.post('/branding', updateBrandingContent);

// Protected full settings payload for admin screens.
router.get('/', async (_req: Request, res: Response) => {
  try {
    const all = await readAllSettings();
    res.json({ success: true, data: all });
  } catch (error) {
    logger.error({ error }, 'Failed to retrieve full settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des paramètres' });
  }
});

router.post('/security', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};

    // P1-1: validate every field against safe ranges before persisting.
    const sessionTimeout = clampInt(body.sessionTimeout, 5, 1440); // 5 min – 24h
    if (sessionTimeout === null) return sendValidationError(res, 'sessionTimeout', 'sessionTimeout doit être un entier entre 5 et 1440');

    const passwordMinLength = clampInt(body.passwordMinLength, 8, 64);
    if (passwordMinLength === null) return sendValidationError(res, 'passwordMinLength', 'passwordMinLength doit être un entier entre 8 et 64');

    const maxLoginAttempts = clampInt(body.maxLoginAttempts, 1, 20);
    if (maxLoginAttempts === null) return sendValidationError(res, 'maxLoginAttempts', 'maxLoginAttempts doit être un entier entre 1 et 20');

    if (!isBool(body.requireUppercase)) return sendValidationError(res, 'requireUppercase');
    if (!isBool(body.requireNumbers)) return sendValidationError(res, 'requireNumbers');
    if (!isBool(body.requireSpecialChars)) return sendValidationError(res, 'requireSpecialChars');
    if (!isBool(body.enableTwoFactor)) return sendValidationError(res, 'enableTwoFactor');

    const data = {
      sessionTimeout,
      passwordMinLength,
      maxLoginAttempts,
      requireUppercase: body.requireUppercase,
      requireNumbers: body.requireNumbers,
      requireSpecialChars: body.requireSpecialChars,
      enableTwoFactor: body.enableTwoFactor
    };

    logger.info({ category: 'security' }, 'Admin saving security settings');

    const existing = await prisma.securitySettings.findFirst();
    if (existing) {
      const updated = await prisma.securitySettings.update({ where: { id: existing.id }, data });
      res.json({ success: true, message: 'Paramètres de sécurité sauvegardés avec succès', data: updated });
      return;
    }

    const created = await prisma.securitySettings.create({ data });
    res.json({ success: true, message: 'Paramètres de sécurité sauvegardés avec succès', data: created });
  } catch (error) {
    logger.error({ error }, 'Failed to save security settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres de sécurité' });
  }
});

router.post('/general', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};

    // P1-1: each field must be a string within reasonable bounds.
    const checkStr = (key: string, max: number, required = false): string | null | undefined => {
      const v = body[key];
      if (v === undefined || v === null || v === '') {
        return required ? null : undefined;
      }
      if (!isStr(v)) return null;
      const trimmed = v.trim();
      if (trimmed.length > max) return null;
      return trimmed;
    };

    // GeneralSettings columns are all NOT NULL in Prisma, so every field is required.
    const name = checkStr('name', 200, true);
    if (name === null || name === undefined) return sendValidationError(res, 'name', 'Nom de l\'école requis (≤ 200 caractères)');
    const address = checkStr('address', 500, true);
    if (address === null || address === undefined) return sendValidationError(res, 'address', 'Adresse requise');
    const phone = checkStr('phone', 20, true);
    if (phone === null || phone === undefined) return sendValidationError(res, 'phone', 'Téléphone requis');
    const email = checkStr('email', 200, true);
    if (email === null || email === undefined) return sendValidationError(res, 'email', 'Email requis');
    if (!EMAIL_RE.test(email)) return sendValidationError(res, 'email', 'Email invalide');
    const website = checkStr('website', 200, true);
    if (website === null || website === undefined) return sendValidationError(res, 'website', 'Site web requis');
    const principal = checkStr('principal', 200, true);
    if (principal === null || principal === undefined) return sendValidationError(res, 'principal', 'Directeur requis');
    const year = checkStr('year', 10, true);
    if (year === null || year === undefined) return sendValidationError(res, 'year', 'Année requise');

    const data = { name, address, phone, email, website, principal, year };

    logger.info({ category: 'general' }, 'Admin saving general settings');

    // P1-2: write through to the branding JSON store first (canonical source).
    patchBrandingBrand(data);

    // Keep the Prisma `generalSettings` row synced as a write-through cache —
    // any downstream reader (reports, exports, …) sees the same values.
    const existing = await prisma.generalSettings.findFirst();
    if (existing) {
      await prisma.generalSettings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.generalSettings.create({ data });
    }

    res.json({
      success: true,
      message: 'Informations générales sauvegardées avec succès',
      data
    });
  } catch (error) {
    logger.error({ error }, 'Failed to save general settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des informations générales' });
  }
});

router.post('/notifications', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};

    // P1-1: every notification toggle must be a strict boolean.
    const flags: Array<keyof typeof body> = [
      'emailNotifications', 'browserNotifications', 'gradeUpdates',
      'attendanceAlerts', 'appointmentReminders', 'systemUpdates', 'newsletter'
    ];
    for (const f of flags) {
      if (!isBool(body[f])) return sendValidationError(res, String(f));
    }

    const payload = {
      emailNotifications: body.emailNotifications,
      browserNotifications: body.browserNotifications,
      gradeUpdates: body.gradeUpdates,
      attendanceAlerts: body.attendanceAlerts,
      appointmentReminders: body.appointmentReminders,
      systemUpdates: body.systemUpdates,
      newsletter: body.newsletter
    };

    logger.info({ category: 'notifications' }, 'Admin saving notification settings');
    const existing = await prisma.notificationSettings.findFirst();
    if (existing) {
      const updated = await prisma.notificationSettings.update({ where: { id: existing.id }, data: payload });
      res.json({ success: true, message: 'Paramètres de notification sauvegardés avec succès', data: updated });
      return;
    }
    const created = await prisma.notificationSettings.create({ data: payload });
    res.json({ success: true, message: 'Paramètres de notification sauvegardés avec succès', data: created });
  } catch (error) {
    logger.error({ error }, 'Failed to save notification settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres de notification' });
  }
});

router.post('/appearance', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};

    // P1-1: enums + hex colors only.
    if (!isStr(body.theme) || !ALLOWED_THEMES.has(body.theme)) {
      return sendValidationError(res, 'theme', `theme doit être ${[...ALLOWED_THEMES].join('|')}`);
    }
    if (!isStr(body.fontSize) || !ALLOWED_FONT_SIZES.has(body.fontSize)) {
      return sendValidationError(res, 'fontSize', `fontSize doit être ${[...ALLOWED_FONT_SIZES].join('|')}`);
    }
    if (!isStr(body.primaryColor) || !HEX_COLOR_RE.test(body.primaryColor)) {
      return sendValidationError(res, 'primaryColor', 'primaryColor doit être un code hexadécimal #RRGGBB');
    }
    if (!isStr(body.accentColor) || !HEX_COLOR_RE.test(body.accentColor)) {
      return sendValidationError(res, 'accentColor', 'accentColor doit être un code hexadécimal #RRGGBB');
    }

    const payload = {
      theme: body.theme,
      primaryColor: body.primaryColor,
      accentColor: body.accentColor,
      fontSize: body.fontSize
    };

    logger.info({ category: 'appearance' }, 'Admin saving appearance settings');
    const existing = await prisma.appearanceSettings.findFirst();
    if (existing) {
      const updated = await prisma.appearanceSettings.update({ where: { id: existing.id }, data: payload });
      res.json({ success: true, message: 'Paramètres d\'apparence sauvegardés avec succès', data: updated });
      return;
    }
    const created = await prisma.appearanceSettings.create({ data: payload });
    res.json({ success: true, message: 'Paramètres d\'apparence sauvegardés avec succès', data: created });
  } catch (error) {
    logger.error({ error }, 'Failed to save appearance settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres d\'apparence' });
  }
});

router.post('/database', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};

    // P1-1: enum + bounded ints + booleans.
    if (!isBool(body.autoBackup)) return sendValidationError(res, 'autoBackup');
    if (!isBool(body.encryptionEnabled)) return sendValidationError(res, 'encryptionEnabled');
    if (!isStr(body.backupFrequency) || !ALLOWED_BACKUP_FREQUENCIES.has(body.backupFrequency)) {
      return sendValidationError(res, 'backupFrequency', `backupFrequency doit être ${[...ALLOWED_BACKUP_FREQUENCIES].join('|')}`);
    }
    const retentionDays = clampInt(body.retentionDays, 1, 3650); // up to 10 years
    if (retentionDays === null) return sendValidationError(res, 'retentionDays', 'retentionDays doit être un entier entre 1 et 3650');

    const payload = {
      autoBackup: body.autoBackup,
      backupFrequency: body.backupFrequency,
      retentionDays,
      encryptionEnabled: body.encryptionEnabled
    };

    logger.info({ category: 'database' }, 'Admin saving database settings');
    const existing = await prisma.databaseSettings.findFirst();
    if (existing) {
      const updated = await prisma.databaseSettings.update({ where: { id: existing.id }, data: payload });
      res.json({ success: true, message: 'Paramètres de base de données sauvegardés avec succès', data: updated });
      return;
    }
    const created = await prisma.databaseSettings.create({ data: payload });
    res.json({ success: true, message: 'Paramètres de base de données sauvegardés avec succès', data: created });
  } catch (error) {
    logger.error({ error }, 'Failed to save database settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres de base de données' });
  }
});

router.post('/email', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};

    // P1-1: SMTP host/port/email validated; booleans strict.
    if (!isStr(body.smtpServer) || body.smtpServer.trim().length === 0 || body.smtpServer.length > 255) {
      return sendValidationError(res, 'smtpServer', 'smtpServer doit être une chaîne non vide (≤ 255 caractères)');
    }
    const smtpPort = clampInt(body.smtpPort, 1, 65535);
    if (smtpPort === null) return sendValidationError(res, 'smtpPort', 'smtpPort doit être un entier entre 1 et 65535');

    if (!isStr(body.senderEmail) || !EMAIL_RE.test(body.senderEmail)) {
      return sendValidationError(res, 'senderEmail', 'senderEmail invalide');
    }
    if (!isStr(body.senderName) || body.senderName.trim().length === 0 || body.senderName.length > 200) {
      return sendValidationError(res, 'senderName');
    }
    if (!isBool(body.useSSL)) return sendValidationError(res, 'useSSL');
    if (!isBool(body.enableAutoNotifications)) return sendValidationError(res, 'enableAutoNotifications');

    const payload = {
      smtpServer: body.smtpServer.trim(),
      smtpPort,
      senderEmail: body.senderEmail.trim(),
      senderName: body.senderName.trim(),
      useSSL: body.useSSL,
      enableAutoNotifications: body.enableAutoNotifications
    };

    logger.info({ category: 'email' }, 'Admin saving email settings');
    const existing = await prisma.emailSettings.findFirst();
    if (existing) {
      const updated = await prisma.emailSettings.update({ where: { id: existing.id }, data: payload });
      res.json({ success: true, message: 'Paramètres email sauvegardés avec succès', data: updated });
      return;
    }
    const created = await prisma.emailSettings.create({ data: payload });
    res.json({ success: true, message: 'Paramètres email sauvegardés avec succès', data: created });
  } catch (error) {
    logger.error({ error }, 'Failed to save email settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres email' });
  }
});

export default router;
