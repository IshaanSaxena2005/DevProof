import { Request, Response, NextFunction } from 'express';
export declare const globalErrorHandler: (err: any, req: Request, res: Response, next: NextFunction) => Response;
