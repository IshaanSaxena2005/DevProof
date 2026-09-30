import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { CodingProfileController } from '../controllers/codingProfile.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate';
import {
  codingProfilePlatformSchema,
  connectCodingProfileSchema
} from '../validators/codingProfile.validator';

const router = Router();

router.use(protect);

/**
 * Tighter limit for the two routes that call a third-party site.
 *
 * The global limiter (200 per 15 minutes) governs cheap local requests; these
 * reach out to LeetCode on every call, so an impatient user hammering "Sync"
 * would spend our shared reputation with that site rather than their own.
 * Keyed per authenticated user, not per IP, so one user cannot exhaust the
 * budget for everyone behind the same address.
 */
const externalFetchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as { user?: { id: string } }).user?.id ?? req.ip ?? 'anonymous',
  message: {
    success: false,
    message: 'Too many profile syncs. Please wait a few minutes before trying again.'
  }
});

router.get('/', CodingProfileController.getProfiles);

router.post(
  '/',
  externalFetchLimiter,
  validateRequest(connectCodingProfileSchema),
  CodingProfileController.connectProfile
);

router.post(
  '/:platform/sync',
  externalFetchLimiter,
  validateRequest(codingProfilePlatformSchema),
  CodingProfileController.syncProfile
);

router.delete(
  '/:platform',
  validateRequest(codingProfilePlatformSchema),
  CodingProfileController.disconnectProfile
);

export default router;
