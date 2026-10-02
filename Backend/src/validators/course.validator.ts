import { z } from 'zod';

/**
 * Request schemas for the course routes.
 *
 * Shaped as { body, query, params } to match `validateRequest`, which parses
 * all three off the request.
 */

const courseBody = z.object({
  title: z
    .string({ required_error: 'Course title is required' })
    .trim()
    .min(1, 'Course title is required')
    .max(200, 'Course title must be 200 characters or fewer'),
  platform: z
    .string({ required_error: 'Platform is required' })
    .trim()
    .min(1, 'Platform is required')
    .max(120, 'Platform must be 120 characters or fewer'),
  isCompleted: z.boolean().optional().default(false),
  certificateUrl: z
    .string()
    .trim()
    .url('Certificate URL must be a valid URL')
    .max(500, 'Certificate URL must be 500 characters or fewer')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  // Capped because each entry can create a skill row; an unbounded list would
  // let one request fan out arbitrarily.
  learnedSkills: z
    .array(z.string().trim().min(1).max(60))
    .max(20, 'A course can list at most 20 skills')
    .optional(),
  completedAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal('').transform(() => undefined))
    .transform((value, ctx) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Completion date must be a valid date' });
        return z.NEVER;
      }
      return parsed;
    })
});

export const addCourseSchema = z.object({ body: courseBody });

export const updateCourseSchema = z.object({
  body: courseBody,
  params: z.object({
    id: z.string({ required_error: 'Course id is required' }).uuid('Course id must be a valid identifier')
  })
});

export const courseIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Course id is required' }).uuid('Course id must be a valid identifier')
  })
});
