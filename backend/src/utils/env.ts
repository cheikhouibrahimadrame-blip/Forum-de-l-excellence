import logger from './logger';

const MIN_SECRET_LENGTH = 32;

type JwtSecrets = {
  JWT_SECRET?: string;
  JWT_SECRET_PREVIOUS?: string;
  JWT_REFRESH_SECRET?: string;
  JWT_REFRESH_SECRET_PREVIOUS?: string;
};

export const validateJwtSecrets = (secrets: JwtSecrets): { ok: boolean; errors: string[] } => {
  const errors: string[] = [];
  const access = secrets.JWT_SECRET || '';
  const refresh = secrets.JWT_REFRESH_SECRET || '';
  const accessPrev = secrets.JWT_SECRET_PREVIOUS || '';
  const refreshPrev = secrets.JWT_REFRESH_SECRET_PREVIOUS || '';

  if (!access) {
    errors.push('JWT_SECRET is required.');
  }
  if (!refresh) {
    errors.push('JWT_REFRESH_SECRET is required.');
  }
  if (access && access.length < MIN_SECRET_LENGTH) {
    errors.push(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  }
  if (refresh && refresh.length < MIN_SECRET_LENGTH) {
    errors.push(`JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  }
  if (access && refresh && access === refresh) {
    errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different.');
  }
  if (accessPrev && accessPrev.length < MIN_SECRET_LENGTH) {
    errors.push(`JWT_SECRET_PREVIOUS must be at least ${MIN_SECRET_LENGTH} characters.`);
  }
  if (refreshPrev && refreshPrev.length < MIN_SECRET_LENGTH) {
    errors.push(`JWT_REFRESH_SECRET_PREVIOUS must be at least ${MIN_SECRET_LENGTH} characters.`);
  }
  if (accessPrev && accessPrev === access) {
    errors.push('JWT_SECRET_PREVIOUS must differ from JWT_SECRET.');
  }
  if (refreshPrev && refreshPrev === refresh) {
    errors.push('JWT_REFRESH_SECRET_PREVIOUS must differ from JWT_REFRESH_SECRET.');
  }

  return { ok: errors.length === 0, errors };
};

export const validateJwtEnv = (env: JwtSecrets = process.env as unknown as JwtSecrets): { ok: boolean; errors: string[] } => {
  return validateJwtSecrets(env);
};

export const validateEnvOrCrash = (secrets: JwtSecrets = process.env as unknown as JwtSecrets): void => {
  const result = validateJwtSecrets(secrets);
  if (result.ok) {
    return;
  }

  logger.fatal({ errors: result.errors }, 'Invalid JWT secret configuration');
  result.errors.forEach((error) => logger.fatal(`- ${error}`));
  process.exit(1);
};

export const getJwtSecretStatus = (secrets: JwtSecrets) => ({
  accessSecretSet: !!secrets.JWT_SECRET,
  accessPreviousSet: !!secrets.JWT_SECRET_PREVIOUS,
  refreshSecretSet: !!secrets.JWT_REFRESH_SECRET,
  refreshPreviousSet: !!secrets.JWT_REFRESH_SECRET_PREVIOUS
});

export const getRotationInstructions = () => [
  'Set JWT_SECRET_PREVIOUS to the current JWT_SECRET value.',
  'Set JWT_SECRET to a new 32+ character value.',
  'Set JWT_REFRESH_SECRET_PREVIOUS to the current JWT_REFRESH_SECRET value.',
  'Set JWT_REFRESH_SECRET to a new 32+ character value.',
  'Deploy all instances with the updated secrets.'
];
