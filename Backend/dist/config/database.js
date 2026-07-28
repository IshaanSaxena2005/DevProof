"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const env_1 = require("./env");
exports.prisma = global.prisma ||
    new client_1.PrismaClient({
        log: env_1.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
    });
if (env_1.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
const connectDatabase = async () => {
    try {
        await exports.prisma.$connect();
        console.log('✅ PostgreSQL Database connected via Prisma.');
        return true;
    }
    catch (error) {
        console.warn('⚠️ PostgreSQL Database connection deferred or unavailable:', error.message);
        return false;
    }
};
exports.connectDatabase = connectDatabase;
