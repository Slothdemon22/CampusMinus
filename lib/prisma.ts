import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASEURL,
});

const adapterFactory = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaClient: PrismaClient | null = null;

export async function getPrismaClient(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (prismaClient) {
    return prismaClient;
  }

  // Create PrismaClient with adapter factory
  // In Prisma 7, we can pass the factory directly
  try {
    prismaClient = new PrismaClient({
      adapter: adapterFactory,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaClient;
    }

    return prismaClient;
  } catch (error) {
    console.error('Error creating Prisma client:', error);
    throw error;
  }
}

