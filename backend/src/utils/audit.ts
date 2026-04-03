import { PrismaClient } from '@prisma/client';
import logger from './logger';

interface AuditParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
}

export const logAudit = async (prisma: PrismaClient, params: AuditParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null
      }
    });
  } catch (error) {
    logger.error({ error }, 'Audit log error:');
  }
};
