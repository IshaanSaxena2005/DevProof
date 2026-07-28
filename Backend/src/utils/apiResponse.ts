import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
  meta?: Record<string, any>;
}

export const successResponse = <T>(
  res: Response,
  statusCode = 200,
  message: string,
  data?: T,
  meta?: Record<string, any>
): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta })
  };
  return res.status(statusCode).json(payload);
};

export const errorResponse = (
  res: Response,
  statusCode = 500,
  message: string,
  error?: any
): Response => {
  const payload: ApiResponse = {
    success: false,
    message,
    ...(error !== undefined && { error })
  };
  return res.status(statusCode).json(payload);
};
