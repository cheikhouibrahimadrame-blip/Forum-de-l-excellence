import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// In-memory storage for settings (will persist to DB once migration is applied)
let settingsStore = {
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

// ── Public read (needed by frontend for theming before login) ───────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: settingsStore });
  } catch (error) {
    logger.error({ error }, 'Failed to retrieve settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des paramètres' });
  }
});

// ── All write routes require ADMIN ──────────────────────────────────────
router.use(authenticate, authorize(['ADMIN']));

router.post('/security', async (req: Request, res: Response) => {
  try {
    const {
      sessionTimeout, passwordMinLength, requireUppercase,
      requireNumbers, requireSpecialChars, enableTwoFactor, maxLoginAttempts
    } = req.body;

    logger.info({ category: 'security' }, 'Admin saving security settings');

    settingsStore.security = {
      sessionTimeout, passwordMinLength, requireUppercase,
      requireNumbers, requireSpecialChars, enableTwoFactor, maxLoginAttempts
    };

    res.json({ success: true, message: 'Paramètres de sécurité sauvegardés avec succès', data: settingsStore.security });
  } catch (error) {
    logger.error({ error }, 'Failed to save security settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres de sécurité' });
  }
});

router.post('/general', async (req: Request, res: Response) => {
  try {
    const { name, address, phone, email, website, principal, year } = req.body;

    logger.info({ category: 'general' }, 'Admin saving general settings');

    settingsStore.general = { name, address, phone, email, website, principal, year };

    res.json({ success: true, message: 'Informations générales sauvegardées avec succès', data: settingsStore.general });
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

    settingsStore.notifications = {
      emailNotifications, browserNotifications, gradeUpdates,
      attendanceAlerts, appointmentReminders, systemUpdates, newsletter
    };

    res.json({ success: true, message: 'Paramètres de notification sauvegardés avec succès', data: settingsStore.notifications });
  } catch (error) {
    logger.error({ error }, 'Failed to save notification settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres de notification' });
  }
});

router.post('/appearance', async (req: Request, res: Response) => {
  try {
    const { theme, primaryColor, accentColor, fontSize } = req.body;

    logger.info({ category: 'appearance' }, 'Admin saving appearance settings');

    settingsStore.appearance = { theme, primaryColor, accentColor, fontSize };

    res.json({ success: true, message: 'Paramètres d\'apparence sauvegardés avec succès', data: settingsStore.appearance });
  } catch (error) {
    logger.error({ error }, 'Failed to save appearance settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres d\'apparence' });
  }
});

router.post('/database', async (req: Request, res: Response) => {
  try {
    const { autoBackup, backupFrequency, retentionDays, encryptionEnabled } = req.body;

    logger.info({ category: 'database' }, 'Admin saving database settings');

    settingsStore.database = { autoBackup, backupFrequency, retentionDays, encryptionEnabled };

    res.json({ success: true, message: 'Paramètres de base de données sauvegardés avec succès', data: settingsStore.database });
  } catch (error) {
    logger.error({ error }, 'Failed to save database settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres de base de données' });
  }
});

router.post('/email', async (req: Request, res: Response) => {
  try {
    const { smtpServer, smtpPort, senderEmail, senderName, useSSL, enableAutoNotifications } = req.body;

    logger.info({ category: 'email' }, 'Admin saving email settings');

    settingsStore.email = { smtpServer, smtpPort, senderEmail, senderName, useSSL, enableAutoNotifications };

    res.json({ success: true, message: 'Paramètres email sauvegardés avec succès', data: settingsStore.email });
  } catch (error) {
    logger.error({ error }, 'Failed to save email settings');
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des paramètres email' });
  }
});

export default router;
