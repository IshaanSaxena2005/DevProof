import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import repositoryRoutes from './repository.routes';
import analysisRoutes from './analysis.routes';
import developer360Routes from './developer360.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/repositories', repositoryRoutes);
router.use('/analysis', analysisRoutes);
router.use('/developer360', developer360Routes);

export default router;
