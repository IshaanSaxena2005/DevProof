import { Router } from 'express';
import { AnalysisController } from '../controllers/analysis.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/trigger', AnalysisController.triggerAnalysis);
router.get('/:id', AnalysisController.getAnalysisById);
router.get('/repo/:repositoryId', AnalysisController.getLatestRepoAnalysis);

export default router;
