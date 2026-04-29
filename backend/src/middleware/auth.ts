import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { verifyTokenWithFallback } from '../utils/secretManager';
import { emitSecurityAlert } from '../utils/securityAlerts';
import logger from '../utils/logger';
import crypto from 'crypto';

const ROLE_VALUES = ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] as const;
type RoleValue = (typeof ROLE_VALUES)[number];

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Non authentifié - Token manquant' 
      });
      return;
    }

    let decoded: any;
    try {
      const result = verifyTokenWithFallback(token, 'access');
      decoded = result.decoded;
      if (result.usedFallback) {
        logger.info({ userId: decoded.userId }, 'Auth middleware: using fallback secret');
      }
    } catch (verifyError) {
      res.status(401).json({
        success: false,
        error: 'Token invalide'
      });
      return;
    }
    const userId = decoded?.userId || decoded?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Token invalide'
      });
      return;
    }

    const sessionId = decoded?.sessionId as string | undefined;
    if (!sessionId) {
      res.status(401).json({
        success: false,
        error: 'Session invalide',
        code: 'SESSION_MISSING'
      });
      return;
    }

    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, revokedAt: true, deviceIdHash: true }
    });

    if (!session || session.userId !== userId || session.revokedAt) {
      emitSecurityAlert({
        event: 'SESSION_INVALID_ON_ACCESS',
        severity: 'high',
        details: { userId, sessionId }
      });
      res.status(401).json({
        success: false,
        error: 'Session invalide',
        code: 'SESSION_INVALID'
      });
      return;
    }

    const cookies = (req as any).cookies || {};
    const deviceId = typeof cookies.deviceId === 'string' ? cookies.deviceId : null;
    if (!deviceId) {
      emitSecurityAlert({
        event: 'DEVICE_COOKIE_MISSING_ON_ACCESS',
        severity: 'medium',
        details: { userId, sessionId }
      });
      res.status(401).json({
        success: false,
        error: 'Session invalide',
        code: 'DEVICE_MISSING'
      });
      return;
    }

    if (session.deviceIdHash) {
      const deviceHash = crypto.createHash('sha256').update(deviceId).digest('hex');
      if (deviceHash !== session.deviceIdHash) {
        emitSecurityAlert({
          event: 'DEVICE_MISMATCH_ON_ACCESS',
          severity: 'high',
          details: { userId, sessionId }
        });
        res.status(401).json({
          success: false,
          error: 'Session invalide',
          code: 'DEVICE_MISMATCH'
        });
        return;
      }
    } else {
      emitSecurityAlert({
        event: 'SESSION_DEVICE_UNBOUND',
        severity: 'low',
        details: { userId, sessionId }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isActive: true, tokenVersion: true }
    });

    if (!user) {
      logger.warn({ userId }, 'Auth: user not found');
      res.status(401).json({ 
        success: false, 
        error: 'Non authentifié - Utilisateur non trouvé' 
      });
      return;
    }

    // Validate tokenVersion to detect token invalidation
    const decodedTokenVersion = decoded?.tokenVersion || 1;
    if (decodedTokenVersion !== user.tokenVersion) {
      logger.warn({ userId }, 'Auth: token version mismatch — invalidated');
      res.status(401).json({ 
        success: false, 
        error: 'Token invalidé - Veuillez vous reconnecter',
        code: 'TOKEN_INVALIDATED'
      });
      return;
    }

    if (!user.isActive) {
      logger.warn({ userId }, 'Auth: inactive user');
      res.status(401).json({ 
        success: false, 
        error: 'Non authentifié - Utilisateur inactif' 
      });
      return;
    }

    const normalizedRole = (user.role || '').toUpperCase();
    if (!ROLE_VALUES.includes(normalizedRole as RoleValue)) {
      res.status(500).json({
        success: false,
        message: 'Data integrity error: Invalid role value'
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: normalizedRole
    };

    next();
  } catch (error) {
    logger.error({ error }, 'Authentication error');
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        success: false, 
        error: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }
    
    res.status(401).json({ 
      success: false, 
      error: 'Token invalide'
    });
  }
};

export const authorizeRoles = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        error: 'Non authentifié' 
      });
      return;
    }

    const normalizedRoles = roles.map(role => role.toUpperCase());
    const hasInvalidRole = normalizedRoles.some(role => !ROLE_VALUES.includes(role as RoleValue));
    if (hasInvalidRole) {
      res.status(500).json({
        success: false,
        message: 'Data integrity error: Invalid role configuration'
      });
      return;
    }
    const userRole = (req.user.role || '').toUpperCase();
    if (!normalizedRoles.includes(userRole)) {
      res.status(403).json({ 
        success: false, 
        error: 'Accès refusé - Permissions insuffisantes' 
      });
      return;
    }

    next();
  };
};

export const authorize = authorizeRoles;

export const checkResourceAccess = (resourceType: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        error: 'Non authentifié' 
      });
      return;
    }

    const userId = req.user.id;
    const resourceId = req.params.id;

    try {
      switch (resourceType) {
        case 'student_grades': {
          const role = (req.user.role || '').toUpperCase();
          if (role === 'STUDENT') {
            const student = await prisma.student.findUnique({
              where: { userId }
            });
            if (!student || student.id !== resourceId) {
              res.status(403).json({ 
                success: false, 
                error: 'Accès refusé' 
              });
              return;
            }
          }
          break;
        }

        case 'parent_child': {
          const role = (req.user.role || '').toUpperCase();
          if (role === 'PARENT') {
            const parent = await prisma.parent.findUnique({
              where: { userId },
              include: { parentStudents: true }
            });
            
            if (!parent || !parent.parentStudents.some(ps => ps.studentId === resourceId)) {
              res.status(403).json({ 
                success: false, 
                error: 'Accès refusé' 
              });
              return;
            }
          }
          break;
        }

        case 'teacher_course': {
          const role = (req.user.role || '').toUpperCase();
          if (role === 'TEACHER') {
            const teacher = await prisma.teacher.findUnique({
              where: { userId }
            });
            
            const course = await prisma.course.findUnique({
              where: { id: resourceId }
            });
            
            if (!teacher || !course || course.teacherId !== teacher.id) {
              res.status(403).json({ 
                success: false, 
                error: 'Accès refusé' 
              });
              return;
            }
          }
          break;
        }
      }

      next();
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la vérification des permissions' 
      });
    }
  };
};;