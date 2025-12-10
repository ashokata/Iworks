import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo data...');

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'local-tenant' },
    update: {},
    create: {
      id: 'local-tenant',
      name: 'Local Development',
      subdomain: 'local',
      isActive: true,
    },
  });
  console.log('✅ Created tenant:', tenant.name);

  // Create demo users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@fieldsmartpro.local' },
      update: {},
      create: {
        email: 'admin@fieldsmartpro.local',
        passwordHash: 'demo-hash', // In production, use bcrypt
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        phone: '555-0100',
        tenantId: tenant.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'tech1@fieldsmartpro.local' },
      update: {},
      create: {
        email: 'tech1@fieldsmartpro.local',
        passwordHash: 'demo-hash',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'TECHNICIAN',
        phone: '555-0101',
        tenantId: tenant.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'tech2@fieldsmartpro.local' },
      update: {},
      create: {
        email: 'tech2@fieldsmartpro.local',
        passwordHash: 'demo-hash',
        firstName: 'Sarah',
        lastName: 'Williams',
        role: 'TECHNICIAN',
        phone: '555-0102',
        tenantId: tenant.id,
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  // Create demo customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '555-1001',
        address: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        notes: 'Preferred customer - VIP service',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@example.com',
        phone: '555-1002',
        address: '456 Oak Avenue',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Robert',
        lastName: 'Brown',
        email: 'robert.brown@example.com',
        phone: '555-1003',
        address: '789 Pine Road',
        city: 'Riverside',
        state: 'IL',
        zipCode: '60546',
        notes: 'Commercial account - office building',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Jennifer',
        lastName: 'Wilson',
        email: 'jennifer.wilson@example.com',
        phone: '555-1004',
        address: '321 Elm Street',
        city: 'Aurora',
        state: 'IL',
        zipCode: '60505',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Michael',
        lastName: 'Taylor',
        email: 'michael.taylor@example.com',
        phone: '555-1005',
        address: '654 Maple Drive',
        city: 'Naperville',
        state: 'IL',
        zipCode: '60540',
        notes: 'New customer - first service call',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Martinez',
        email: 'sarah.martinez@example.com',
        phone: '555-1006',
        address: '890 Birch Lane',
        city: 'Joliet',
        state: 'IL',
        zipCode: '60431',
        notes: 'Property manager - handles multiple units',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'David',
        lastName: 'Anderson',
        email: 'david.anderson@example.com',
        phone: '555-1007',
        address: '234 Cedar Court',
        city: 'Schaumburg',
        state: 'IL',
        zipCode: '60173',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Lisa',
        lastName: 'Thompson',
        email: 'lisa.thompson@example.com',
        phone: '555-1008',
        address: '567 Willow Way',
        city: 'Evanston',
        state: 'IL',
        zipCode: '60201',
        notes: 'Recurring monthly maintenance contract',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'James',
        lastName: 'Garcia',
        email: 'james.garcia@example.com',
        phone: '555-1009',
        address: '901 Spruce Street',
        city: 'Oak Park',
        state: 'IL',
        zipCode: '60302',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Patricia',
        lastName: 'Rodriguez',
        email: 'patricia.rodriguez@example.com',
        phone: '555-1010',
        address: '1234 Ash Boulevard',
        city: 'Skokie',
        state: 'IL',
        zipCode: '60076',
        notes: 'Prefers afternoon appointments only',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Christopher',
        lastName: 'Lee',
        email: 'christopher.lee@example.com',
        phone: '555-1011',
        address: '456 Hickory Hills',
        city: 'Downers Grove',
        state: 'IL',
        zipCode: '60515',
        notes: 'Commercial - Restaurant equipment',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Amanda',
        lastName: 'White',
        email: 'amanda.white@example.com',
        phone: '555-1012',
        address: '789 Poplar Place',
        city: 'Wheaton',
        state: 'IL',
        zipCode: '60187',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Daniel',
        lastName: 'Harris',
        email: 'daniel.harris@example.com',
        phone: '555-1013',
        address: '321 Chestnut Circle',
        city: 'Elmhurst',
        state: 'IL',
        zipCode: '60126',
        notes: 'Senior citizen - discounted rates apply',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Michelle',
        lastName: 'Clark',
        email: 'michelle.clark@example.com',
        phone: '555-1014',
        address: '654 Redwood Drive',
        city: 'Arlington Heights',
        state: 'IL',
        zipCode: '60004',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.create({
      data: {
        firstName: 'Thomas',
        lastName: 'Lewis',
        email: 'thomas.lewis@example.com',
        phone: '555-1015',
        address: '987 Magnolia Street',
        city: 'Palatine',
        state: 'IL',
        zipCode: '60067',
        notes: 'Industrial client - large warehouse facility',
        tenantId: tenant.id,
      },
    }),
  ]);
  console.log(`✅ Created ${customers.length} customers`);

  // Create demo jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        jobNumber: 'JOB-000001',
        title: 'HVAC System Maintenance',
        description: 'Annual HVAC system inspection and cleaning',
        status: 'SCHEDULED',
        priority: 'MEDIUM',
        scheduledDate: new Date('2025-12-15T09:00:00'),
        estimatedDuration: 120, // 2 hours
        customerId: customers[0].id,
        assignedToId: users[1].id,
        tenantId: tenant.id,
        address: customers[0].address!,
        city: customers[0].city!,
        state: customers[0].state!,
        zipCode: customers[0].zipCode!,
      },
    }),
    prisma.job.create({
      data: {
        jobNumber: 'JOB-000002',
        title: 'Plumbing Repair',
        description: 'Fix leaking kitchen faucet',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        scheduledDate: new Date('2025-12-10T10:00:00'),
        estimatedDuration: 60,
        customerId: customers[1].id,
        assignedToId: users[2].id,
        tenantId: tenant.id,
        address: customers[1].address!,
        city: customers[1].city!,
        state: customers[1].state!,
        zipCode: customers[1].zipCode!,
      },
    }),
    prisma.job.create({
      data: {
        jobNumber: 'JOB-000003',
        title: 'Electrical Inspection',
        description: 'Complete electrical system inspection for commercial building',
        status: 'SCHEDULED',
        priority: 'URGENT',
        scheduledDate: new Date('2025-12-11T08:00:00'),
        estimatedDuration: 240, // 4 hours
        customerId: customers[2].id,
        assignedToId: users[1].id,
        tenantId: tenant.id,
        address: customers[2].address!,
        city: customers[2].city!,
        state: customers[2].state!,
        zipCode: customers[2].zipCode!,
      },
    }),
    prisma.job.create({
      data: {
        jobNumber: 'JOB-000004',
        title: 'Water Heater Installation',
        description: 'Install new 50-gallon water heater',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        scheduledDate: new Date('2025-12-05T13:00:00'),
        completedDate: new Date('2025-12-05T16:30:00'),
        estimatedDuration: 180,
        actualDuration: 210,
        customerId: customers[3].id,
        assignedToId: users[2].id,
        tenantId: tenant.id,
        address: customers[3].address!,
        city: customers[3].city!,
        state: customers[3].state!,
        zipCode: customers[3].zipCode!,
      },
    }),
    prisma.job.create({
      data: {
        jobNumber: 'JOB-000005',
        title: 'AC Unit Repair',
        description: 'Diagnose and repair AC not cooling properly',
        status: 'ON_HOLD',
        priority: 'HIGH',
        scheduledDate: new Date('2025-12-12T14:00:00'),
        estimatedDuration: 90,
        customerId: customers[4].id,
        tenantId: tenant.id,
        address: customers[4].address!,
        city: customers[4].city!,
        state: customers[4].state!,
        zipCode: customers[4].zipCode!,
      },
    }),
  ]);
  console.log(`✅ Created ${jobs.length} jobs`);

  // Create job notes for some jobs
  await prisma.jobNote.createMany({
    data: [
      {
        jobId: jobs[0].id,
        note: 'Customer requested morning appointment',
        createdBy: users[0].id,
      },
      {
        jobId: jobs[1].id,
        note: 'Customer will be home all day',
        createdBy: users[2].id,
      },
      {
        jobId: jobs[2].id,
        note: 'Contact building manager before arrival',
        createdBy: users[1].id,
      },
    ],
  });
  console.log('✅ Created job notes');

  // Create invoices for completed job
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-000001',
      jobId: jobs[3].id,
      status: 'SENT',
      subtotal: 850.00,
      tax: 68.00,
      total: 918.00,
      dueDate: new Date('2025-12-20'),
      tenantId: tenant.id,
      items: {
        create: [
          {
            description: '50-gallon water heater',
            quantity: 1,
            unitPrice: 650.00,
            total: 650.00,
            sortOrder: 1,
          },
          {
            description: 'Installation labor (3.5 hours)',
            quantity: 3.5,
            unitPrice: 50.00,
            total: 175.00,
            sortOrder: 2,
          },
          {
            description: 'Copper piping and fittings',
            quantity: 1,
            unitPrice: 25.00,
            total: 25.00,
            sortOrder: 3,
          },
        ],
      },
    },
  });
  console.log('✅ Created invoice:', invoice.invoiceNumber);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 Tenant: ${tenant.name}`);
  console.log(`   - ${users.length} Users (1 admin, 2 technicians)`);
  console.log(`   - ${customers.length} Customers`);
  console.log(`   - ${jobs.length} Jobs`);
  console.log(`   - 1 Invoice with 3 line items`);
  console.log('\n🔑 Demo Credentials:');
  console.log(`   - Admin: admin@fieldsmartpro.local`);
  console.log(`   - Tech 1: tech1@fieldsmartpro.local`);
  console.log(`   - Tech 2: tech2@fieldsmartpro.local`);
  console.log(`   - Password: (demo-hash)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
