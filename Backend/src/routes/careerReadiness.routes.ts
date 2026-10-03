import { Router } from 'express';
import { CareerReadinessController } from '../controllers/careerReadiness.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/readiness', CareerReadinessController.getReadiness);

export default router;
