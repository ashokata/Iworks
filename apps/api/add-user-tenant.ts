import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = '3cb84ec3-15a6-41df-bc9f-f638db123b0a';

  // Get industry for reference
  const industry = await prisma.industry.findFirst({ where: { slug: 'hvac' } });

  // Create tenant with the user's current tenant ID
  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'My Company',
      slug: 'my-company',
      status: 'ACTIVE',
      industryId: industry?.id,
      timezone: 'America/Chicago',
    },
  });
  console.log('✅ Created/updated tenant:', tenant.name, tenant.id);

  // Create a user with common email pattern
  const user = await prisma.user.upsert({
    where: { id: 'user-main' },
    update: {
      tenantId: tenantId,
    },
    create: {
      id: 'user-main',
      email: 'ashok@gmail.com',
      passwordHash: 'password123', // Plain text password for local dev
      firstName: 'Ashok',
      lastName: 'User',
      role: 'ADMIN',
      phone: '555-0100',
      tenantId: tenantId,
      isActive: true,
      isVerified: true,
    },
  });
  console.log('✅ Created/updated user:', user.email);

  console.log('\n📝 You can now login with:');
  console.log('   Email: ashok@gmail.com');
  console.log('   Password: password123');
  console.log('   Tenant ID:', tenantId);
}

main()
  .then(() => {
    console.log('\n✨ Done!');
    prisma.$disconnect();
  })
  .catch((e) => {
    console.error('Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
