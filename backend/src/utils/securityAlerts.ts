import logger from './logger';

type SecuritySeverity = 'low' | 'medium' | 'high';

type SecurityAlert = {
  event: string;
  severity: SecuritySeverity;
  message?: string;
  details?: Record<string, unknown>;
};

export const emitSecurityAlert = (alert: SecurityAlert): void => {
  const payload = {
    timestamp: new Date().toISOString(),
    ...alert
  };

  logger.error({ payload: payload }, 'SECURITY_ALERT');
};
