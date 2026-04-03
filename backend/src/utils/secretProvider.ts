import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { validateJwtSecrets } from './env';
import { emitSecurityAlert } from './securityAlerts';
import logger from './logger';

type JwtSecrets = {
  JWT_SECRET?: string;
  JWT_SECRET_PREVIOUS?: string;
  JWT_REFRESH_SECRET?: string;
  JWT_REFRESH_SECRET_PREVIOUS?: string;
};

type ProviderState = {
  source: 'env' | 'aws';
  lastRefresh: Date | null;
  secrets: JwtSecrets | null;
};

const state: ProviderState = {
  source: 'env',
  lastRefresh: null,
  secrets: null
};

const getPollIntervalMs = () => {
  const raw = process.env.JWT_SECRET_POLL_INTERVAL_MS || '300000';
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300000;
};

const loadFromEnv = (): JwtSecrets => ({
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_SECRET_PREVIOUS: process.env.JWT_SECRET_PREVIOUS,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_SECRET_PREVIOUS: process.env.JWT_REFRESH_SECRET_PREVIOUS
});

const loadFromAws = async (): Promise<JwtSecrets> => {
  const secretId = process.env.AWS_SECRET_ID || '';
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

  if (!secretId) {
    throw new Error('AWS_SECRET_ID is required when SECRET_MANAGER=aws.');
  }

  const client = new SecretsManagerClient({ region });
  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await client.send(command);
  const secretString = response.SecretString || '';

  if (!secretString) {
    throw new Error('AWS secret value is empty.');
  }

  let parsed: JwtSecrets;
  try {
    parsed = JSON.parse(secretString) as JwtSecrets;
  } catch (error) {
    throw new Error('AWS secret must be valid JSON.');
  }

  return parsed;
};

const refreshSecrets = async (source: 'env' | 'aws'): Promise<void> => {
  const secrets = source === 'aws' ? await loadFromAws() : loadFromEnv();
  const validation = validateJwtSecrets(secrets);
  if (!validation.ok) {
    throw new Error(`Invalid JWT secrets: ${validation.errors.join(' ')}`);
  }

  state.source = source;
  state.secrets = secrets;
  state.lastRefresh = new Date();
};

export const initializeSecretProvider = async (): Promise<void> => {
  const provider = (process.env.SECRET_MANAGER || 'env').toLowerCase();
  const source: 'env' | 'aws' = provider === 'aws' ? 'aws' : 'env';

  await refreshSecrets(source);

  if (source === 'aws') {
    const intervalMs = getPollIntervalMs();
    setInterval(() => {
      refreshSecrets('aws').catch((error) => {
        emitSecurityAlert({
          event: 'SECRET_REFRESH_FAILED',
          severity: 'high',
          details: { message: String(error) }
        });
        logger.error({ error: String(error) }, 'Secret refresh failed');
      });
    }, intervalMs);
  }
};

export const getJwtSecrets = (): Required<JwtSecrets> => {
  if (!state.secrets) {
    throw new Error('JWT secrets not initialized.');
  }

  return {
    JWT_SECRET: state.secrets.JWT_SECRET as string,
    JWT_SECRET_PREVIOUS: state.secrets.JWT_SECRET_PREVIOUS || '',
    JWT_REFRESH_SECRET: state.secrets.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_SECRET_PREVIOUS: state.secrets.JWT_REFRESH_SECRET_PREVIOUS || ''
  };
};

export const getSecretStatus = () => ({
  source: state.source,
  lastRefresh: state.lastRefresh,
  accessSecretSet: !!state.secrets?.JWT_SECRET,
  accessPreviousSet: !!state.secrets?.JWT_SECRET_PREVIOUS,
  refreshSecretSet: !!state.secrets?.JWT_REFRESH_SECRET,
  refreshPreviousSet: !!state.secrets?.JWT_REFRESH_SECRET_PREVIOUS
});
