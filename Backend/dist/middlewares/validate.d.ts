import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
export declare const validateRequest: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
