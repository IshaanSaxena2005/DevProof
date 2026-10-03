import { Router } from 'express';
import multer from 'multer';
import { ResumeController } from '../controllers/resume.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

/**
 * Files are held in memory rather than written by multer.
 *
 * ResumeService validates the bytes before anything touches disk, so a rejected
 * upload never leaves a file behind. The 5MB cap is enforced here as well as in
 * the service: multer aborts the stream, so an oversized upload is cut off
 * rather than fully buffered first.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

router.get('/', ResumeController.getResume);
router.get('/download', ResumeController.downloadResume);
router.post('/', upload.single('resume'), ResumeController.uploadResume);
router.delete('/', ResumeController.deleteResume);

export default router;
