import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton instance connected to SQLite
 */
const prisma = new PrismaClient();

export default prisma;
