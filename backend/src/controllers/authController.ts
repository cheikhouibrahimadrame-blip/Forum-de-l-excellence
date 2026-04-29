import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { emitSecurityAlert } from '../utils/securityAlerts';
import { getCurrentSecrets, verifyTokenWithFallback } from '../utils/secretManager';
import logger from '../utils/logger';

const ACCESS_TOKEN_TTL = process.env.JWT_EXPIRES_IN || '60m';
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const REFRESH_COOKIE_NAME = 'refreshToken';
const DEVICE_COOKIE_NAME = 'deviceId';
const DEVICE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const parseTtlToMs = (ttl: string, fallbackMs: number) => {
  const match = String(ttl || '').trim().match(/^(\d+)([smhd])$/i);
  if (!match) return fallbackMs;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(value) || value <= 0) return fallbackMs;

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return value * (multipliers[unit] || 1);
};

const REFRESH_TOKEN_MAX_AGE_MS = parseTtlToMs(REFRESH_TOKEN_TTL, 7 * 24 * 60 * 60 * 1000);

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mot de passe requis (minimum 8 caractères)')
];

const passwordPolicy = body('password')
  .isLength({ min: 8 })
  .withMessage('Mot de passe requis (minimum 8 caractères)')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre');

export const changePasswordValidation = [
  passwordPolicy,
  body('currentPassword')
    .isLength({ min: 8 })
    .withMessage('Mot de passe actuel requis (minimum 8 caractères)')
];

export const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide')
];

export const resetPasswordValidation = [
  body('token').isString().isLength({ min: 32 }).withMessage('Token invalide'),
  passwordPolicy
];

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const hashDeviceId = (deviceId: string) => {
  return crypto.createHash('sha256').update(deviceId).digest('hex');
};

const createAccessToken = (user: any, sessionId: string) => {
  const { accessToken: secret } = getCurrentSecrets();
  return jwt.sign(
    { 
      id: user.id, 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      tokenVersion: user.tokenVersion || 1,
      sessionId
    },
    secret,
    { expiresIn: ACCESS_TOKEN_TTL } as SignOptions
  );
};

const createRefreshToken = (userId: string, sessionId: string) => {
  const { refreshToken: secret } = getCurrentSecrets();
  return jwt.sign(
    { userId, sessionId },
    secret,
    { expiresIn: REFRESH_TOKEN_TTL } as SignOptions
  );
};

const getClientInfo = (req: Request) => {
  const ipAddress = req.ip || req.socket.remoteAddress || null;
  const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;
  return { ipAddress, userAgent };
};

const setDeviceCookie = (res: Response, deviceId: string) => {
  res.cookie(DEVICE_COOKIE_NAME, deviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: DEVICE_COOKIE_MAX_AGE,
    path: '/'
  });
};

const getDeviceId = (req: Request): string | null => {
  const cookies = (req as any).cookies || {};
  const deviceId = cookies[DEVICE_COOKIE_NAME];
  return typeof deviceId === 'string' && deviceId.length > 0 ? deviceId : null;
};

const createUserSession = async (userId: string, req: Request, res: Response) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  let deviceId = getDeviceId(req);
  if (!deviceId) {
    deviceId = crypto.randomBytes(32).toString('hex');
    setDeviceCookie(res, deviceId);
  }
  const deviceIdHash = hashDeviceId(deviceId);
  return prisma.userSession.create({
    data: {
      userId,
      ipAddress,
      userAgent,
      deviceIdHash,
      lastSeenAt: new Date()
    }
  });
};

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: '/' // Allow cookie to be sent to all routes
  });
};

const generateTokens = async (user: any, req: Request, res: Response, sessionId?: string) => {
  const activeSessionId = sessionId || (await createUserSession(user.id, req, res)).id;
  const accessToken = createAccessToken(user, activeSessionId);
  const refreshToken = createRefreshToken(user.id, activeSessionId);
  const refreshHash = hashToken(refreshToken);

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      sessionId: activeSessionId,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS)
    }
  });

  return { accessToken, refreshToken, sessionId: activeSessionId };
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { email, password } = req.body;

    // Validate email and password exist
    if (!email || !password) {
      res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
      return;
    }

    // Check allowed domains
    const allowedDomains = (process.env.INSTITUTION_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean);
    if (allowedDomains.length > 0) {
      const emailParts = email.split('@');
      const domain = emailParts.length === 2 ? emailParts[1] : '';
      if (!domain || !allowedDomains.includes(domain)) {
        res.status(401).json({
          success: false,
          error: 'Identifiants incorrects'
        });
        return;
      }
    }

    // Find user - SAFE: will return null if not found
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        parent: true,
        teacher: true,
        admin: true
      }
    });

    // CRITICAL: Check if user exists BEFORE accessing properties
    if (!user) {
      // Use generic message to prevent user enumeration
      res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
      return;
    }

    // SAFE: user.password exists because user is not null
    let isValidPassword = false;
    try {
      // bcrypt.compare can throw errors on invalid hashes
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      logger.error({ error: bcryptError }, 'Bcrypt compare error');
      // Treat bcrypt errors as invalid password
      isValidPassword = false;
    }
    
    if (!isValidPassword) {
      // Use same generic message
      res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
      return;
    }

    await prisma.userSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    const { accessToken, refreshToken } = await generateTokens(user, req, res);
    setRefreshCookie(res, refreshToken);

    const { password: _, ...userWithoutPassword } = user;

    await logAudit(prisma, {
      userId: user.id,
      action: 'LOGIN',
      entity: 'AUTH'
    });

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: userWithoutPassword,
        accessToken,
        mustChangePassword: (user as any).mustChangePassword ?? false
      }
    });
  } catch (error) {
    logger.error({ error }, 'Login error');
    // CRITICAL: Always return a response, never crash
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Une erreur est survenue. Veuillez réessayer.'
      });
    }
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { currentPassword, password } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
      return;
    }

    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(currentPassword, user.password);
    } catch (bcryptError) {
      logger.error({ error: bcryptError }, 'Bcrypt error in changePassword');
      isValidPassword = false;
    }
    
    if (!isValidPassword) {
      res.status(401).json({ success: false, error: 'Mot de passe actuel incorrect' });
      return;
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (hashError) {
      logger.error({ error: hashError }, 'Bcrypt hash error');
      res.status(500).json({ success: false, error: 'Erreur lors du changement de mot de passe' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        tokenVersion: { increment: 1 }
      } as any,
      include: {
        student: true,
        parent: true,
        teacher: true,
        admin: true
      }
    });

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.userSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    // Generate new tokens
    const { accessToken, refreshToken } = await generateTokens(updatedUser, req, res);

    setRefreshCookie(res, refreshToken);

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({ 
      success: true, 
      message: 'Mot de passe mis à jour avec succès',
      data: {
        user: userWithoutPassword,
        accessToken
      }
    });
  } catch (error) {
    logger.error({ error }, 'Change password error');
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }
};

export const forceLogout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.body.userId || req.user?.id;
    
    if (!userId) {
      res.status(400).json({ success: false, error: 'userId requis' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
      return;
    }

    // Increment tokenVersion to invalidate all existing tokens
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } } as any
    });

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    await logAudit(prisma, {
      userId: req.user?.id || userId,
      action: 'FORCE_LOGOUT',
      entity: 'USER',
      entityId: userId
    });

    res.json({ 
      success: true, 
      message: 'Utilisateur déconnecté de tous les appareils et tokens invalides' 
    });
  } catch (error) {
    logger.error({ error }, 'Force logout error');
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const cookies = (req as any).cookies || {};
    const refreshToken = cookies[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Token de rafraîchissement requis'
      });
      return;
    }
    let decoded: any;
    try {
      const result = verifyTokenWithFallback(refreshToken, 'refresh');
      decoded = result.decoded;
      if (result.usedFallback) {
        await logAudit(prisma, {
          userId: decoded.userId,
          action: 'TOKEN_FALLBACK_SECRET_USED',
          entity: 'AUTH',
          entityId: 'refresh_token'
        });
      }
    } catch (verifyError) {
      res.status(401).json({
        success: false,
        error: 'Token de rafraîchissement invalide'
      });
      return;
    }

    const sessionId = decoded?.sessionId as string | undefined;
    if (!sessionId) {
      await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { tokenVersion: { increment: 1 } }
      } as any);
      emitSecurityAlert({
        event: 'SESSION_MISSING_ON_REFRESH',
        severity: 'medium',
        details: { userId: decoded.userId }
      });
      res.status(401).json({
        success: false,
        error: 'Session invalide'
      });
      return;
    }

    const session = await prisma.userSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== decoded.userId || session.revokedAt) {
      await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });
      await prisma.userSession.updateMany({
        where: { userId: decoded.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { tokenVersion: { increment: 1 } }
      } as any);
      emitSecurityAlert({
        event: 'SESSION_INVALID_ON_REFRESH',
        severity: 'high',
        details: { userId: decoded.userId, sessionId }
      });
      res.status(401).json({
        success: false,
        error: 'Session invalide'
      });
      return;
    }

    const deviceId = getDeviceId(req);
    if (!deviceId) {
      await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });
      await prisma.userSession.updateMany({
        where: { userId: decoded.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { tokenVersion: { increment: 1 } }
      } as any);
      emitSecurityAlert({
        event: 'DEVICE_COOKIE_MISSING',
        severity: 'high',
        details: { userId: decoded.userId, sessionId }
      });
      res.status(401).json({
        success: false,
        error: 'Session invalide'
      });
      return;
    }

    const deviceIdHash = hashDeviceId(deviceId);
    if (session.deviceIdHash && session.deviceIdHash !== deviceIdHash) {
      await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });
      await prisma.userSession.updateMany({
        where: { userId: decoded.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { tokenVersion: { increment: 1 } }
      } as any);
      emitSecurityAlert({
        event: 'DEVICE_MISMATCH',
        severity: 'high',
        details: { userId: decoded.userId, sessionId }
      });
      res.status(401).json({
        success: false,
        error: 'Session invalide'
      });
      return;
    }

    if (!session.deviceIdHash) {
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { deviceIdHash }
      });
    }

    const { ipAddress, userAgent } = getClientInfo(req);
    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        lastSeenAt: new Date(),
        ipAddress,
        userAgent
      }
    });

    const refreshHash = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        userId_tokenHash: {
          userId: decoded.userId,
          tokenHash: refreshHash
        }
      }
    });

    if (!storedToken) {
      // Can happen with concurrent refresh requests (multi-tab race) after token rotation.
      // Do not revoke all sessions here; return a clean 401 and let client re-auth if needed.
      emitSecurityAlert({
        event: 'REFRESH_TOKEN_NOT_FOUND',
        severity: 'medium',
        details: { userId: decoded.userId, sessionId }
      });
      res.status(401).json({
        success: false,
        error: 'Token de rafraîchissement invalide ou déjà utilisé'
      });
      return;
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      res.status(401).json({
        success: false,
        error: 'Token de rafraîchissement expiré'
      });
      return;
    }

    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true, tokenVersion: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé ou inactif'
      });
      return;
    }

    const newAccessToken = createAccessToken(user, sessionId);
    const newRefreshToken = createRefreshToken(user.id, sessionId);
    const newRefreshHash = hashToken(newRefreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        sessionId,
        tokenHash: newRefreshHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS)
      }
    });

    setRefreshCookie(res, newRefreshToken);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    logger.error({ error }, 'Refresh token error');
    res.status(401).json({
      success: false,
      error: 'Token de rafraîchissement invalide'
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const cookies = (req as any).cookies || {};
    const refreshToken = cookies[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      let decoded: any = null;
      try {
        const result = verifyTokenWithFallback(refreshToken, 'refresh');
        decoded = result.decoded;
        if (result.usedFallback) {
          logger.info('Logout: used fallback secret to decode refresh token');
        }
      } catch (verifyError) {
        decoded = null;
      }

      const refreshHash = hashToken(refreshToken);
      await prisma.refreshToken.deleteMany({
        where: {
          userId: decoded?.userId,
          tokenHash: refreshHash
        }
      });

      if (decoded?.sessionId) {
        await prisma.userSession.updateMany({
          where: { id: decoded.sessionId, revokedAt: null },
          data: { revokedAt: new Date() }
        });
      }

      if (decoded?.userId) {
        await logAudit(prisma, {
          userId: decoded.userId,
          action: 'LOGOUT',
          entity: 'AUTH'
        });
      }
    }

    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    logger.error({ error }, 'Logout error');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email } = req.body as { email: string };
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const genericMessage = 'Si l\'email existe, un lien de réinitialisation vous a été envoyé.';

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isActive: true }
    });

    if (!user || !user.isActive) {
      res.json({ success: true, message: genericMessage });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt
      }
    });

    await logAudit(prisma, {
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entity: 'AUTH'
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    logger.info({ userId: user.id, resetLink }, 'Password reset link generated');

    res.json({
      success: true,
      message: genericMessage,
      ...(process.env.NODE_ENV !== 'production' ? { data: { resetLink } } : {})
    });
  } catch (error) {
    logger.error({ error }, 'Forgot password error');
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { token, password } = req.body as { token: string; password: string };
    const tokenHash = hashToken(String(token));

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true }
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: 'Lien de réinitialisation invalide ou expiré' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          password: hashedPassword,
          mustChangePassword: false,
          tokenVersion: { increment: 1 }
        } as any
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() }
      }),
      prisma.refreshToken.deleteMany({ where: { userId: resetRecord.userId } }),
      prisma.userSession.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    await logAudit(prisma, {
      userId: resetRecord.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entity: 'AUTH'
    });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    logger.error({ error }, 'Reset password error');
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        student: true,
        parent: {
          include: {
            parentStudents: {
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        isActive: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        teacher: true,
        admin: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
      return;
    }

    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        mustChangePassword: (user as any).mustChangePassword ?? false
      }
    });
  } catch (error) {
    logger.error({ error }, 'Get me error');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};