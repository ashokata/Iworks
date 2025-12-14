/**
 * Create Demo Tenant Script
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if tenant exists
    let tenant = await prisma.tenant.findUnique({
      where: { id: 'demo-hvac-tenant' },
    });

    if (tenant) {
      console.log('ℹ️ Tenant already exists:');
    } else {
      // Create a new tenant
      tenant = await prisma.tenant.create({
        data: {
          id: 'demo-hvac-tenant',
          name: 'Demo HVAC Services',
          slug: 'demo-hvac',
          status: 'ACTIVE',
          timezone: 'America/New_York',
          locale: 'en-US',
          currency: 'USD',
        },
      });
      console.log('✅ Tenant created:');
    }

    console.log(JSON.stringify({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    }, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

