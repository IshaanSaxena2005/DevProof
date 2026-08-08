import { Router } from 'express';
import { GitHubWebhookController } from '../controllers/githubWebhook.controller';

const router = Router();

router.get('/github/status', GitHubWebhookController.status);
router.post('/github', GitHubWebhookController.receive);

export default router;
