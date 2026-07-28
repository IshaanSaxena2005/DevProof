"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const startServer = async () => {
    try {
        // Attempt database connection
        await (0, database_1.connectDatabase)();
        const server = app_1.default.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`==================================================`);
            logger_1.logger.info(`🚀 DevProof Backend Server running on port ${env_1.env.PORT}`);
            logger_1.logger.info(`🌍 Environment: ${env_1.env.NODE_ENV}`);
            logger_1.logger.info(`🔗 Health Check: http://localhost:${env_1.env.PORT}/api/v1/health`);
            logger_1.logger.info(`==================================================`);
        });
        // Graceful Shutdown Handlers
        const shutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                logger_1.logger.info('HTTP server closed.');
                await database_1.prisma.$disconnect();
                logger_1.logger.info('Database connection closed.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled Rejection at Promise:', reason);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception thrown:', error);
    process.exit(1);
});
startServer();
