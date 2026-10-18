import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate';import {
  registerSchema,
  loginSchema,
  patchMeSchema
} from '../validators/auth.validator';

import { errorResponse } from '../utils/apiResponse';

/**
 * Credential guessing is the one endpoint where a per-IP budget must be far
 * tighter than the global 200/15min: ten attempts per 15 minutes is generous
 * for a human who mistyped a password and useless as an attack ramp, and
 * bcrypt's cost makes each attempt expensive for the attacker too.
 *
 * Scoped to POST /auth/login only — the OAuth init/callback and logout routes
 * must never be throttled, or a user could get locked out of signing out.
 * `req.ip` honours `trust proxy` when it is configured, so behind a reverse
 * proxy each client still gets its own budget rather than sharing the proxy's.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Same envelope as every other error, so the frontend's ApiError reads the
  // message the same way it reads a 401.
  handler: (_req, res) =>
    errorResponse(res, 429, 'Too many login attempts. Please try again after 15 minutes.')
});

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validateRequest(loginSchema), AuthController.login);
router.get('/me', protect, AuthController.getMe);
router.get('/github', AuthController.githubOAuth);
router.get('/github/callback', AuthController.githubCallback);
router.post('/github/disconnect', protect, AuthController.disconnectGitHub);
router.post('/github/sync', protect, AuthController.syncGitHub);

router.patch('/me', protect, validateRequest(patchMeSchema), AuthController.patchMe);
router.post('/export', protect, AuthController.exportData);
router.delete('/account', protect, AuthController.deleteAccount);

router.post('/logout', AuthController.logout);

export default router;
