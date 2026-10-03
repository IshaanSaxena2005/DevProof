import { z } from 'zod';

/**
 * Request schemas for the hackathon routes.
 *
 * Shaped as { body, query, params } to match `validateRequest`, which parses
 * all three off the request.
 */

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalUrl = z
  .string()
  .trim()
  .url('Project URL must be a valid URL')
  .max(500, 'Project URL must be 500 characters or fewer')
  .optional()
  .or(z.literal('').transform(() => undefined));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal('').transform(() => undefined))
  .transform((value, ctx) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Date must be a valid date' });
      return z.NEVER;
    }
    return parsed;
  });

const hackathonBody = z.object({
  name: z
    .string({ required_error: 'Hackathon name is required' })
    .trim()
    .min(1, 'Hackathon name is required')
    .max(160, 'Hackathon name must be 160 characters or fewer'),
  organizer: z
    .string({ required_error: 'Organizer is required' })
    .trim()
    .min(1, 'Organizer is required')
    .max(120, 'Organizer must be 120 characters or fewer'),
  role: optionalText(80, 'Role'),
  projectName: optionalText(160, 'Project name'),
  projectUrl: optionalUrl,
  result: optionalText(80, 'Result'),
  // A plausible ceiling: this is a hackathon team, not an organisation.
  teamSize: z.number().int().min(1, 'Team size must be at least 1').max(50, 'Team size must be 50 or fewer').optional(),
  heldAt: optionalDate,
  // Capped because each entry can create a skill row.
  technologies: z
    .array(z.string().trim().min(1).max(60))
    .max(20, 'A hackathon can list at most 20 technologies')
    .optional()
});

export const addHackathonSchema = z.object({ body: hackathonBody });

export const updateHackathonSchema = z.object({
  body: hackathonBody,
  params: z.object({
    id: z.string({ required_error: 'Hackathon id is required' }).uuid('Hackathon id must be a valid identifier')
  })
});

export const hackathonIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Hackathon id is required' }).uuid('Hackathon id must be a valid identifier')
  })
});
