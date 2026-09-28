import { z } from 'zod';

/**
 * Request schemas for the certification routes.
 *
 * Shaped as { body, query, params } to match `validateRequest`, which parses
 * all three off the request.
 */

/** Optional free-text field: blank is stored as null rather than an empty string. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional()
    .transform((value) => (value ? value : undefined));

const certificationBody = z.object({
  name: z
    .string({ required_error: 'Certification name is required' })
    .trim()
    .min(1, 'Certification name is required')
    .max(160, 'Certification name must be 160 characters or fewer'),
  issuer: z
    .string({ required_error: 'Issuer is required' })
    .trim()
    .min(1, 'Issuer is required')
    .max(120, 'Issuer must be 120 characters or fewer'),
  credentialId: optionalText(120, 'Credential ID'),
  credentialUrl: z
    .string()
    .trim()
    .url('Credential URL must be a valid URL')
    .max(500, 'Credential URL must be 500 characters or fewer')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  // Accepts an ISO date string and hands the controller a real Date. Rejecting a
  // future issue date would be wrong — some credentials are post-dated — but an
  // unparseable one is a client bug worth surfacing.
  issueDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal('').transform(() => undefined))
    .transform((value, ctx) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Issue date must be a valid date' });
        return z.NEVER;
      }
      return parsed;
    })
});

export const addCertificationSchema = z.object({ body: certificationBody });

export const updateCertificationSchema = z.object({
  body: certificationBody,
  params: z.object({
    id: z.string({ required_error: 'Certification id is required' }).uuid('Certification id must be a valid identifier')
  })
});

export const certificationIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'Certification id is required' }).uuid('Certification id must be a valid identifier')
  })
});
