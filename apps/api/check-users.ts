import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      tenantId: true,
      firstName: true,
      lastName: true,
    },
  });
  console.log('Users in database:');
  console.log(JSON.stringify(users, null, 2));

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  });
  console.log('\nTenants in database:');
  console.log(JSON.stringify(tenants, null, 2));
}

main()
  .finally(() => prisma.$disconnect());
