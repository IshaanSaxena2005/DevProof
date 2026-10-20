import { Router } from 'express';
import { RepositoryController } from '../controllers/repository.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate';
import { updateDescriptionSchema } from '../schemas/repository.schema';

const router = Router();

router.use(protect);

router.post('/connect', RepositoryController.connectRepository);
router.post('/sync', RepositoryController.syncRepositories);
router.get('/', RepositoryController.getUserRepositories);
router.get('/github', RepositoryController.listGitHubRepos);
router.get('/:id', RepositoryController.getRepositoryById);
router.patch('/:id/description', validateRequest(updateDescriptionSchema), RepositoryController.updateRepositoryDescription);
router.delete('/:id', RepositoryController.deleteRepository);

export default router;
