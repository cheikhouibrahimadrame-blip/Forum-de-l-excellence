import express from 'express';
import { 
  login, 
  refreshToken, 
  logout, 
  getMe, 
  loginValidation, 
  changePassword, 
  changePasswordValidation,
  forceLogout
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import type { RateLimiters } from '../middleware/rateLimiter';

export const createAuthRouter = (rateLimiters: Pick<RateLimiters, 'loginRateLimiter' | 'passwordChangeRateLimiter'>) => {
  const router = express.Router();

// SECURITY: Rate limit login attempts (5 per minute per IP)
  router.post('/login', rateLimiters.loginRateLimiter, loginValidation, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
// SECURITY: Rate limit password change attempts (3 per 15 minutes)
  router.post('/change-password', authenticate, rateLimiters.passwordChangeRateLimiter, changePasswordValidation, changePassword);
// Force logout endpoint (admin or user can invalidate all tokens)
router.post('/force-logout', authenticate, forceLogout);
  return router;
};

export default createAuthRouter;