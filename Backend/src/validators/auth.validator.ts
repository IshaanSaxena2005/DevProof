import { z } from 'zod';

/**
 * Request schemas for the auth routes.
 *
 * Shaped as { body, query, params } to match `validateRequest`, which parses
 * all three off the request. ZodErrors raised here are turned into a 400 with
 * field-level detail by the global error handler.
 */

/** Trim, reject non-emails, then normalize case so lookups are consistent. */
const emailField = z
  .string({ required_error: 'Email is required' })
  .trim()
  .min(1, 'Email is required')
  .email('Must be a valid email address')
  .toLowerCase();

export const registerSchema = z.object({
  body: z.object({
    email: emailField,
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      // bcryptjs silently truncates beyond 72 bytes; cap well below that so a
      // long password never means "only the first 72 bytes are checked".
      .max(72, 'Password must be at most 72 characters long'),
    name: z.string().trim().min(1, 'Name cannot be empty').max(100).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: emailField,
    // Deliberately only checks presence. Length rules belong on registration —
    // applying them here would reject valid pre-existing credentials.
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required')
  })
});
