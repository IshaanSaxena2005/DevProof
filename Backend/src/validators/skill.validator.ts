import { z } from 'zod';
import { SkillCategory } from '@prisma/client';

/**
 * Request schemas for the skill routes.
 *
 * Shaped as { body, query, params } to match `validateRequest`, which parses
 * all three off the request.
 */

export const addSkillSchema = z.object({
  body: z.object({
    // Trimmed before length checks so "   " cannot pass as a name, and because
    // the stored value is the uniqueness key for (userId, name).
    name: z
      .string({ required_error: 'Skill name is required' })
      .trim()
      .min(1, 'Skill name is required')
      .max(60, 'Skill name must be 60 characters or fewer'),
    category: z
      .nativeEnum(SkillCategory, {
        errorMap: () => ({ message: `Category must be one of: ${Object.values(SkillCategory).join(', ')}` })
      })
      .optional()
  })
});

export const skillIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Skill id is required' }).uuid('Skill id must be a valid identifier')
  })
});
