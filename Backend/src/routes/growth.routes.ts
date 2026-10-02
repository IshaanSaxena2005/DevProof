import { Router } from 'express';
import { GrowthController } from '../controllers/growth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/history', GrowthController.getHistory);

export default router;
