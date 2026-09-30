import { z } from 'zod';
import { SUPPORTED_PLATFORMS } from '../services/codingProfile.service';

/**
 * Request schemas for the coding-profile routes.
 *
 * Shaped as { body, query, params } to match `validateRequest`, which parses
 * all three off the request.
 */

const platformField = z.enum(SUPPORTED_PLATFORMS, {
  errorMap: () => ({ message: `Platform must be one of: ${SUPPORTED_PLATFORMS.join(', ')}` })
});

/**
 * A platform username, not a URL or a profile path.
 *
 * Kept deliberately narrow: this value is interpolated into an outbound request
 * to a third-party site, so anything that could carry a path, query or protocol
 * is rejected here rather than escaped later.
 */
const handleField = z
  .string({ required_error: 'Username is required' })
  .trim()
  .min(1, 'Username is required')
  .max(64, 'Username must be 64 characters or fewer')
  .regex(
    /^[A-Za-z0-9._-]+$/,
    'Username may only contain letters, numbers, dots, underscores and hyphens'
  );

export const connectCodingProfileSchema = z.object({
  body: z.object({
    platform: platformField,
    handle: handleField
  })
});

export const codingProfilePlatformSchema = z.object({
  params: z.object({
    platform: platformField
  })
});
