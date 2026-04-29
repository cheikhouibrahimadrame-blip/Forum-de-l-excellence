import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import logger from '../utils/logger';
import prisma from '../lib/prisma';

const router = Router();

const SETTINGS_FILE = 'settings.json';

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

// Helper: read settings from Prisma-backed models, falling back to defaults
const readAllSettings = async () => {
  const [security, general, notifications, appearance, database, email] = await Promise.all([
    prisma.securitySettings.findFirst(),
    prisma.generalSettings.findFirst(),
    prisma.notificationSettings.findFirst(),
    prisma.appearanceSettings.findFirst(),
    prisma.databaseSettings.findFirst(),
    prisma.emailSettings.findFirst()
  ]);

  return {
    security: security ?? defaultSettingsStore.security,
    general: general ?? defaultSettingsStore.general,
    notifications: notifications ?? defaultSettingsStore.notifications,
    appearance: appearance ?? defaultSettingsStore.appearance,
    database: database ?? defaultSettingsStore.database,
    email: email ?? defaultSettingsStore.email
  };
};

// ── Public read (safe appearance-only payload) ───────────────────────────
router.get('/appearance', async (_req: Request, res: Response) => {
  try {
    const s = await readAllSettings();
    res.json({
      success: true,
      data: {
        theme: s.appearance?.theme ?? 'light',
        primaryColor: s.appearance?.primaryColor,
        accentColor: s.appearance?.accentColor,
        fontSize: s.appearance?.fontSize,
        schoolName: s.general?.name,
        schoolPhone: s.general?.phone,
        schoolEmail: s.general?.email
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to retrieve public appearance settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des paramètres' });
  }
});

// ── All write routes require ADMIN ──────────────────────────────────────
router.use(authenticate, authorize(['ADMIN']));

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
    const {
      sessionTimeout, passwordMinLength, requireUppercase,
      requireNumbers, requireSpecialChars, enableTwoFactor, maxLoginAttempts
    } = req.body;

    logger.info({ category: 'security' }, 'Admin saving security settings');

    const existing = await prisma.securitySettings.findFirst();
    if (existing) {
      const updated = await prisma.securitySettings.update({
        where: { id: existing.id },
        data: { sessionTimeout, passwordMinLength, requireUppercase, requireNumbers, requireSpecialChars, enableTwoFactor, maxLoginAttempts }
      });
      res.json({ success: true, message: 'Paramètres de sécurité sauvegardés avec succès', data: updated });
      return;
    }

    const created = await prisma.securitySettings.create({
      data: { sessionTimeout, passwordMinLength, requireUppercase, requireNumbers, requireSpecialChars, enableTwoFactor, maxLoginAttempts }
    });
    res.json({ success: true, message: 'Paramètres de sécurité sauvegardés avec succès', data: created });
  } catch (error) {
    logger.error({ error }, 'Failed to save security settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres de sécurité' });
  }
});

router.post('/general', async (req: Request, res: Response) => {
  try {
    const { name, address, phone, email, website, principal, year } = req.body;

    logger.info({ category: 'general' }, 'Admin saving general settings');
    const existing = await prisma.generalSettings.findFirst();
    if (existing) {
      const updated = await prisma.generalSettings.update({ where: { id: existing.id }, data: { name, address, phone, email, website, principal, year } });
      res.json({ success: true, message: 'Informations générales sauvegardées avec succès', data: updated });
      return;
    }
    const created = await prisma.generalSettings.create({ data: { name, address, phone, email, website, principal, year } });
    res.json({ success: true, message: 'Informations générales sauvegardées avec succès', data: created });
  } catch (error) {
    logger.error({ error }, 'Failed to save general settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des informations générales' });
  }
});

router.post('/notifications', async (req: Request, res: Response) => {
  try {
    const {
      emailNotifications, browserNotifications, gradeUpdates,
      attendanceAlerts, appointmentReminders, systemUpdates, newsletter
    } = req.body;

    logger.info({ category: 'notifications' }, 'Admin saving notification settings');
    const existing = await prisma.notificationSettings.findFirst();
    const payload = { emailNotifications, browserNotifications, gradeUpdates, attendanceAlerts, appointmentReminders, systemUpdates, newsletter };
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
    const { theme, primaryColor, accentColor, fontSize } = req.body;

    logger.info({ category: 'appearance' }, 'Admin saving appearance settings');
    const existing = await prisma.appearanceSettings.findFirst();
    const payload = { theme, primaryColor, accentColor, fontSize };
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
    const { autoBackup, backupFrequency, retentionDays, encryptionEnabled } = req.body;

    logger.info({ category: 'database' }, 'Admin saving database settings');
    const existing = await prisma.databaseSettings.findFirst();
    const payload = { autoBackup, backupFrequency, retentionDays, encryptionEnabled };
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
    const { smtpServer, smtpPort, senderEmail, senderName, useSSL, enableAutoNotifications } = req.body;

    logger.info({ category: 'email' }, 'Admin saving email settings');
    const existing = await prisma.emailSettings.findFirst();
    const payload = { smtpServer, smtpPort, senderEmail, senderName, useSSL, enableAutoNotifications };
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
