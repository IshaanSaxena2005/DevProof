import { z } from 'zod';

/**
 * Request schema for POST /resume/match, shaped as { body, … } for
 * `validateRequest`.
 *
 * The job description is transient input: it is validated, compared against
 * the caller's own stored resume, and discarded — never written anywhere.
 * The length bounds keep the comparison honest: an empty paste yields no
 * requirements to match (a fabricated score would be worse than none), and
 * an enormous paste is rejected before any work is done.
 */
export const matchJobSchema = z.object({
  body: z.object({
    jobDescription: z
      .string({ required_error: 'A job description is required' })
      .trim()
      .min(40, 'Paste at least 40 characters of the job description so there is something to compare against')
      .max(20000, 'Job description must be 20,000 characters or fewer')
  })
});
