/**
 * Test Helper Functions
 * Utility functions to make testing easier
 */

import { PrismaClient } from '@prisma/client';

/**
 * Create a test Prisma client
 * Use this in integration tests that need database access
 */
export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/fieldsmartpro_test'
      }
    }
  });
}

/**
 * Clean up database after tests
 * Deletes all data from test database
 */
export async function cleanupDatabase(prisma: PrismaClient): Promise<void> {
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Error truncating ${tablename}:`, error);
      }
    }
  }
}

/**
 * Generate a test tenant ID
 */
export function generateTestTenantId(): string {
  return `test-tenant-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Wait for a condition to be true
 * Useful for async operations in tests
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Mock AWS Bedrock response
 */
export function mockBedrockResponse(content: string) {
  return {
    body: new TextEncoder().encode(JSON.stringify({
      content: [{ text: content }],
      stop_reason: 'end_turn',
    })),
  };
}
