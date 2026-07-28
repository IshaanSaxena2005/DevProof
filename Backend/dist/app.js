"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const appError_1 = require("./utils/appError");
const app = (0, express_1.default)();
// Security Headers
app.use((0, helmet_1.default)());
// Cross-Origin Resource Sharing
app.use((0, cors_1.default)({
    origin: [env_1.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);
// Request Parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// HTTP Request Logging
if (env_1.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// Health Check Shortcut Root Endpoint
app.get('/health', (req, res) => {
    res.redirect('/api/v1/health');
});
// API Routes Mounting
app.use('/api/v1', routes_1.default);
// 404 Unhandled Routes Handler
app.use('*', (req, res, next) => {
    next(appError_1.AppError.notFound(`Cannot find endpoint ${req.originalUrl} on this server`));
});
// Global Centralized Error Handling Middleware
app.use(errorHandler_1.globalErrorHandler);
exports.default = app;
