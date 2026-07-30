import { Router } from 'express';
import { RepositoryController } from '../controllers/repository.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/connect', RepositoryController.connectRepository);
router.get('/', RepositoryController.getUserRepositories);
router.get('/:id', RepositoryController.getRepositoryById);
router.delete('/:id', RepositoryController.deleteRepository);

export default router;
