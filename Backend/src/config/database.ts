import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export const connectDatabase = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL Database connected via Prisma.');
    return true;
  } catch (error) {
    console.warn('⚠️ PostgreSQL Database connection deferred or unavailable:', (error as Error).message);
    return false;
  }
};
