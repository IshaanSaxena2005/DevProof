import { Router } from 'express';
import { SkillController } from '../controllers/skill.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate';
import { addSkillSchema, skillIdSchema } from '../validators/skill.validator';

const router = Router();

router.use(protect);

router.get('/', SkillController.getSkills);
router.post('/derive', SkillController.deriveSkills);
router.post('/', validateRequest(addSkillSchema), SkillController.addSkill);
router.delete('/:id', validateRequest(skillIdSchema), SkillController.deleteSkill);

export default router;
