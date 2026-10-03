import { Router } from 'express';
import { HackathonController } from '../controllers/hackathon.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate';
import {
  addHackathonSchema,
  hackathonIdSchema,
  updateHackathonSchema
} from '../validators/hackathon.validator';

const router = Router();

router.use(protect);

router.get('/', HackathonController.getHackathons);
router.post('/', validateRequest(addHackathonSchema), HackathonController.addHackathon);
router.patch('/:id', validateRequest(updateHackathonSchema), HackathonController.updateHackathon);
router.delete('/:id', validateRequest(hackathonIdSchema), HackathonController.deleteHackathon);

export default router;
