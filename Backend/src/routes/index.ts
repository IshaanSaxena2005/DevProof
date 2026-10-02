import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import repositoryRoutes from './repository.routes';
import analysisRoutes from './analysis.routes';
import developer360Routes from './developer360.routes';
import skillRoutes from './skill.routes';
import certificationRoutes from './certification.routes';
import codingProfileRoutes from './codingProfile.routes';
import courseRoutes from './course.routes';
import hackathonRoutes from './hackathon.routes';
import aiRoutes from './ai.routes';
import githubWebhookRoutes from './githubWebhook.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/repositories', repositoryRoutes);
router.use('/analysis', analysisRoutes);
router.use('/developer360', developer360Routes);
router.use('/skills', skillRoutes);
router.use('/certifications', certificationRoutes);
router.use('/coding-profiles', codingProfileRoutes);
router.use('/courses', courseRoutes);
router.use('/hackathons', hackathonRoutes);
router.use('/ai', aiRoutes);
router.use('/webhooks', githubWebhookRoutes);

export default router;
