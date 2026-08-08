import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import apiRouter from './routes';
import { globalErrorHandler } from './middlewares/errorHandler';
import { AppError } from './utils/appError';

const app: Application = express();

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// Request Parsing
app.use('/api/v1/webhooks/github', express.raw({ type: ['application/json', 'application/vnd.github+json'], limit: '2mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// HTTP Request Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health Check Shortcut Root Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.redirect('/api/v1/health');
});

// API Routes Mounting
app.use('/api/v1', apiRouter);

// 404 Unhandled Routes Handler
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  next(AppError.notFound(`Cannot find endpoint ${req.originalUrl} on this server`));
});

// Global Centralized Error Handling Middleware
app.use(globalErrorHandler);

export default app;
