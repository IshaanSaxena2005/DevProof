import { Response } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: any;
    meta?: Record<string, any>;
}
export declare const successResponse: <T>(res: Response, statusCode: number | undefined, message: string, data?: T, meta?: Record<string, any>) => Response;
export declare const errorResponse: (res: Response, statusCode: number | undefined, message: string, error?: any) => Response;
