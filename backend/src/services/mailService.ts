import logger from '../utils/logger';
import prisma from '../lib/prisma';

/**
 * P0-1: SMTP-backed mail service.
 *
 * Resolution order for SMTP configuration:
 *   1. EmailSettings row in Prisma (admin-edited via /admin/settings)
 *   2. SMTP_* environment variables (legacy / ops-managed)
 *
 * `nodemailer` is loaded via dynamic import. If it isn't installed (e.g. a
 * fresh checkout that hasn't run `npm install` yet), the service stays
 * "available" and uses a no-op transport that logs to stdout — the app keeps
 * running and the password-reset endpoint stops leaking the token in logs.
 *
 * Templates are intentionally minimal (text + simple HTML). All copy is in
 * French because the school audience is francophone.
 */

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  fromName: string;
};

type Transporter = {
  sendMail: (opts: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<unknown>;
};

let cachedTransporter: Transporter | null = null;
let cachedTransporterKey: string | null = null;

const loadConfig = async (): Promise<SmtpConfig | null> => {
  // Admin-edited row wins.
  let dbRow: any = null;
  try {
    dbRow = await prisma.emailSettings.findFirst();
  } catch (error) {
    logger.warn({ error }, 'mailService: could not read EmailSettings, falling back to env');
  }

  const host = dbRow?.smtpServer || process.env.SMTP_HOST;
  const portRaw = dbRow?.smtpPort ?? process.env.SMTP_PORT;
  const port = Number(portRaw);
  const user = dbRow ? undefined : process.env.SMTP_USER; // EmailSettings doesn't store creds
  const pass = dbRow ? undefined : process.env.SMTP_PASS;
  const from = dbRow?.senderEmail || process.env.SMTP_FROM || user;
  const fromName = dbRow?.senderName || process.env.SMTP_FROM_NAME || 'Forum de L\'excellence';
  const useSSL = dbRow ? Boolean(dbRow.useSSL) : (process.env.SMTP_SECURE === 'true');

  if (!host || !Number.isFinite(port) || !from) {
    return null;
  }

  return { host, port, secure: useSSL, user, pass, from, fromName };
};

const buildTransporter = async (cfg: SmtpConfig): Promise<Transporter | null> => {
  try {
    // Dynamic import keeps the build green even if nodemailer is not installed yet.
    // The string is wrapped in a runtime expression so TypeScript doesn't try to
    // resolve the module at type-check time on a fresh checkout.
    const moduleName = 'nodemailer';
    const nm: any = await import(moduleName).catch(() => null);
    if (!nm) {
      logger.warn(
        'mailService: nodemailer is not installed. Run `npm install nodemailer` ' +
        'in backend/ to enable real email delivery.'
      );
      return null;
    }
    return nm.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined
    });
  } catch (error) {
    logger.error({ error }, 'mailService: failed to build SMTP transport');
    return null;
  }
};

const getTransporter = async (): Promise<{ transporter: Transporter | null; cfg: SmtpConfig | null }> => {
  const cfg = await loadConfig();
  if (!cfg) return { transporter: null, cfg: null };

  const key = `${cfg.host}|${cfg.port}|${cfg.secure}|${cfg.user ?? ''}|${cfg.from}`;
  if (cachedTransporter && cachedTransporterKey === key) {
    return { transporter: cachedTransporter, cfg };
  }

  const transporter = await buildTransporter(cfg);
  cachedTransporter = transporter;
  cachedTransporterKey = transporter ? key : null;
  return { transporter, cfg };
};

/**
 * Force the next call to rebuild the transporter. Call this from the admin
 * endpoint that updates EmailSettings so a configuration change takes effect
 * without a server restart.
 */
export const invalidateMailerCache = (): void => {
  cachedTransporter = null;
  cachedTransporterKey = null;
};

export const sendPasswordResetEmail = async (
  toEmail: string,
  resetLink: string
): Promise<{ delivered: boolean; reason?: string }> => {
  const { transporter, cfg } = await getTransporter();

  const subject = 'Réinitialisation de votre mot de passe';
  const text = [
    'Bonjour,',
    '',
    'Vous avez demandé la réinitialisation de votre mot de passe sur',
    'Forum de L\'excellence.',
    '',
    'Cliquez sur le lien ci-dessous (valable 1 heure) :',
    resetLink,
    '',
    'Si vous n\'êtes pas à l\'origine de cette demande, ignorez ce message.'
  ].join('\n');

  const html = `
    <p>Bonjour,</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe sur
       <strong>Forum de L'excellence</strong>.</p>
    <p>Cliquez sur le lien ci-dessous (valable 1 heure) :</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
  `.trim();

  if (!transporter || !cfg) {
    // Important: do NOT log the resetLink. The whole point of P0-1 is to stop
    // leaking reset tokens in logs.
    logger.warn({ to: toEmail }, 'mailService: SMTP not configured — password reset email not sent');
    return { delivered: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.from}>`,
      to: toEmail,
      subject,
      text,
      html
    });
    logger.info({ to: toEmail }, 'mailService: password reset email sent');
    return { delivered: true };
  } catch (error) {
    logger.error({ error, to: toEmail }, 'mailService: failed to send password reset email');
    return { delivered: false, reason: 'SMTP_SEND_FAILED' };
  }
};
