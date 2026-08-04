import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.get('/me', protect, AuthController.getMe);
router.get('/github', AuthController.githubOAuth);
router.get('/github/callback', AuthController.githubCallback);
router.post('/github/disconnect', protect, AuthController.disconnectGitHub);
router.post('/github/sync', protect, AuthController.syncGitHub);
router.post('/logout', AuthController.logout);

export default router;
