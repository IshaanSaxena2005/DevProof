"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    errors;
    constructor(message, statusCode = 500, errors, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
    static badRequest(message, errors) {
        return new AppError(message, 400, errors);
    }
    static unauthorized(message = 'Unauthorized access') {
        return new AppError(message, 401);
    }
    static forbidden(message = 'Access forbidden') {
        return new AppError(message, 403);
    }
    static notFound(message = 'Resource not found') {
        return new AppError(message, 404);
    }
    static conflict(message) {
        return new AppError(message, 409);
    }
    static internal(message = 'Internal server error') {
        return new AppError(message, 500, undefined, false);
    }
}
exports.AppError = AppError;
