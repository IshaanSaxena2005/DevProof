import app from './app';
import { env } from './config/env';
import { connectDatabase, prisma } from './config/database';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      logger.info(`==================================================`);
      logger.info(`🚀 DevProof Backend Server running on port ${env.PORT}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health Check: http://localhost:${env.PORT}/api/v1/health`);
      logger.info(`==================================================`);
    });

    // Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await prisma.$disconnect();
        logger.info('Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection at Promise:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer();
