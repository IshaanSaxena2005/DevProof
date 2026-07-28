"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, statusCode = 200, message, data, meta) => {
    const payload = {
        success: true,
        message,
        ...(data !== undefined && { data }),
        ...(meta !== undefined && { meta })
    };
    return res.status(statusCode).json(payload);
};
exports.successResponse = successResponse;
const errorResponse = (res, statusCode = 500, message, error) => {
    const payload = {
        success: false,
        message,
        ...(error !== undefined && { error })
    };
    return res.status(statusCode).json(payload);
};
exports.errorResponse = errorResponse;
