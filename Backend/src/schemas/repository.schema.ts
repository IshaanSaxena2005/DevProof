import { z } from 'zod';

export const updateDescriptionSchema = z.object({
  body: z.object({
    description: z
      .string()
      .max(2000, 'Description must be 2000 characters or less')
      .optional()
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid repository ID')
  })
});
