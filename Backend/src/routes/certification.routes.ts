import { Router } from 'express';
import { CertificationController } from '../controllers/certification.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate';
import {
  addCertificationSchema,
  certificationIdSchema,
  updateCertificationSchema
} from '../validators/certification.validator';

const router = Router();

router.use(protect);

router.get('/', CertificationController.getCertifications);
router.post('/', validateRequest(addCertificationSchema), CertificationController.addCertification);
router.patch('/:id', validateRequest(updateCertificationSchema), CertificationController.updateCertification);
router.delete('/:id', validateRequest(certificationIdSchema), CertificationController.deleteCertification);

export default router;
