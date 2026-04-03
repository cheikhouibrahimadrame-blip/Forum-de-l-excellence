import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logAudit } from '../utils/audit';
import { getRotationInstructions } from '../utils/env';
import { getSecretStatus } from '../utils/secretProvider';
import logger from '../utils/logger';


/**
 * Manual JWT rotation must be performed via shared config or secret manager.
 */
export const manualRotateSecrets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Verify admin role
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Accès refusé - Seuls les administrateurs peuvent effectuer cette opération'
      });
      return;
    }

    await logAudit(prisma, {
      userId: req.user.id,
      action: 'SECRET_ROTATION_REQUESTED',
      entity: 'SECURITY',
      entityId: 'jwt_secrets'
    });

    res.json({
      success: false,
      message: 'Rotation must be performed via shared secrets configuration.',
      instructions: getRotationInstructions()
    });
  } catch (error) {
    logger.error({ error }, 'Secret rotation error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la rotation des secrets'
    });
  }
};

/**
 * Get JWT secret rotation status
 */
export const getSecretRotationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
      return;
    }

    res.json({
      success: true,
      secrets: getSecretStatus(),
      instructions: getRotationInstructions()
    });
  } catch (error) {
    logger.error({ error }, 'Secret status error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * Get complete secret rotation audit history
 */
export const getSecretRotationHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
      return;
    }

    res.json({
      success: true,
      history: [],
      totalRecords: 0
    });
  } catch (error) {
    logger.error({ error }, 'Rotation history error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * Enable/disable automatic secret rotation
 */
export const configureAutoRotation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Accès refusé'
      });
      return;
    }

    await logAudit(prisma, {
      userId: req.user.id,
      action: 'AUTO_ROTATION_REQUESTED',
      entity: 'SECURITY',
      entityId: 'auto_rotation_not_supported'
    });

    res.json({
      success: false,
      message: 'Automatic rotation is not supported in-process. Use shared secrets management.',
      instructions: getRotationInstructions()
    });
  } catch (error) {
    logger.error({ error }, 'Auto rotation config error:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};
