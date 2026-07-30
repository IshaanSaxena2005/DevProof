import { Router } from 'express';
import { Developer360Controller } from '../controllers/developer360.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.get('/overview', Developer360Controller.getOverview);

export default router;
