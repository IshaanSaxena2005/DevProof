import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Same session-cookie guard as every other dashboard route. Unlike the rest
// of the API this one also depends on GROQ_API_KEY being set — see
// ai.service.ts for how that's surfaced (a 503, not a startup crash).
router.use(protect);

// GET /api/v1/ai/insights — AI-generated summary of the caller's own
// analyzed repositories. No params: userId comes from the auth cookie.
router.get('/insights', AiController.getInsights);

export default router;
