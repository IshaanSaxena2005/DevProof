export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly errors?: any;
    constructor(message: string, statusCode?: number, errors?: any, isOperational?: boolean);
    static badRequest(message: string, errors?: any): AppError;
    static unauthorized(message?: string): AppError;
    static forbidden(message?: string): AppError;
    static notFound(message?: string): AppError;
    static conflict(message: string): AppError;
    static internal(message?: string): AppError;
}
