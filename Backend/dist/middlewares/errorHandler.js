"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const appError_1 = require("../utils/appError");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
const zod_1 = require("zod");
const globalErrorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    logger_1.logger.error(`Error processing ${req.method} ${req.originalUrl}:`, err);
    if (err instanceof appError_1.AppError) {
        return (0, apiResponse_1.errorResponse)(res, err.statusCode, err.message, err.errors);
    }
    if (err instanceof zod_1.ZodError) {
        const formattedErrors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
        }));
        return (0, apiResponse_1.errorResponse)(res, 400, 'Validation Error', formattedErrors);
    }
    // Handle Prisma Known Request Errors safely
    if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
        if (err.code === 'P2002') {
            return (0, apiResponse_1.errorResponse)(res, 409, 'Unique constraint violation. Entity already exists.');
        }
        if (err.code === 'P2025') {
            return (0, apiResponse_1.errorResponse)(res, 404, 'Requested entity record not found.');
        }
        return (0, apiResponse_1.errorResponse)(res, 400, 'Database operation failed', err.meta || err.message);
    }
    const message = env_1.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Unknown error occurred';
    const errorPayload = env_1.env.NODE_ENV === 'production' ? undefined : { stack: err.stack };
    return (0, apiResponse_1.errorResponse)(res, 500, message, errorPayload);
};
exports.globalErrorHandler = globalErrorHandler;
