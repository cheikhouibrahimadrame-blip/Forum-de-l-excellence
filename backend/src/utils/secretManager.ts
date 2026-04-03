import jwt from 'jsonwebtoken';
import { getJwtSecrets } from './secretProvider';
import logger from './logger';

/**
 * Get current secrets for token creation
 */
export const getCurrentSecrets = () => {
  const secrets = getJwtSecrets();
  return {
    accessToken: secrets.JWT_SECRET,
    refreshToken: secrets.JWT_REFRESH_SECRET
  };
};

/**
 * Get all available secrets (for validation with fallback)
 */
export const getValidationSecrets = () => {
  const secrets = getJwtSecrets();
  return {
    accessToken: {
      current: secrets.JWT_SECRET,
      previous: secrets.JWT_SECRET_PREVIOUS || null
    },
    refreshToken: {
      current: secrets.JWT_REFRESH_SECRET,
      previous: secrets.JWT_REFRESH_SECRET_PREVIOUS || null
    }
  };
};

/**
 * Verify JWT token with dual-secret validation (current + fallback)
 * Tries current secret first, falls back to previous if verification fails
 */
export const verifyTokenWithFallback = (
  token: string,
  tokenType: 'access' | 'refresh'
): { decoded: any; usedFallback: boolean } => {
  const secrets = getValidationSecrets();
  const secretSet = tokenType === 'access' ? secrets.accessToken : secrets.refreshToken;
  
  // Try current secret
  try {
    const decoded = jwt.verify(token, secretSet.current);
    return { decoded, usedFallback: false };
  } catch (err) {
    // If current secret fails, try previous secret
    if (secretSet.previous) {
      try {
        const decoded = jwt.verify(token, secretSet.previous);
        logger.info({ tokenType }, 'Using fallback secret for token verification');
        return { decoded, usedFallback: true };
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }
    throw err;
  }
};
