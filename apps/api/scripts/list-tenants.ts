import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📋 Listing all tenants in the database...\n');

  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            customers: true,
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (tenants.length === 0) {
      console.log('⚠️  No tenants found in the database.\n');
      return;
    }

    console.log(`Found ${tenants.length} tenant(s):\n`);
    console.log('─'.repeat(100));
    
    tenants.forEach((tenant, index) => {
      console.log(`\n${index + 1}. ${tenant.name}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Slug: ${tenant.slug}`);
      console.log(`   Status: ${tenant.status}`);
      console.log(`   Created: ${tenant.createdAt.toISOString()}`);
      console.log(`   Customers: ${tenant._count.customers}`);
      console.log(`   Users: ${tenant._count.users}`);
    });

    console.log('\n' + '─'.repeat(100));
    console.log('\n✅ Done!\n');
  } catch (error: any) {
    console.error('❌ Error listing tenants:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

