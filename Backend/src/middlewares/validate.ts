import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

/**
 * Validates `{ body, query, params }` against a Zod schema.
 *
 * The parsed body is written back onto the request so downstream handlers see
 * normalized values (trimmed strings, lower-cased emails) rather than the raw
 * input. Only `body` is reassigned — `query` and `params` are getters on some
 * Express versions and assigning to them can throw.
 *
 * ZodErrors are passed to the global error handler, which formats them as a
 * 400 with per-field messages.
 */
export const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      if (parsed && typeof parsed === 'object' && 'body' in parsed && parsed.body !== undefined) {
        req.body = parsed.body;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
