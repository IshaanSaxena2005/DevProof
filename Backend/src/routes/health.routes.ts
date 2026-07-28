import { Router, Request, Response } from 'express';
import { successResponse } from '../utils/apiResponse';
import { prisma } from '../config/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'unavailable';
  }

  return successResponse(res, 200, 'DevProof API Service is healthy', {
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

export default router;
