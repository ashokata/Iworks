import { APIGatewayProxyHandler } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('🌱 Starting database seed...');

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Create demo tenant
    const tenant = await prisma.tenant.upsert({
      where: { id: 'tenant1' },
      update: {},
      create: {
        id: 'tenant1',
        name: 'FieldSmartPro Demo',
        subdomain: 'demo',
        isActive: true,
      },
    });
    console.log('✅ Created tenant:', tenant.name);

    // Create demo users
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'admin@fieldsmartpro.com' },
        update: {},
        create: {
          email: 'admin@fieldsmartpro.com',
          passwordHash: 'demo-hash',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          phone: '555-0100',
          tenantId: tenant.id,
        },
      }),
      prisma.user.upsert({
        where: { email: 'tech1@fieldsmartpro.com' },
        update: {},
        create: {
          email: 'tech1@fieldsmartpro.com',
          passwordHash: 'demo-hash',
          firstName: 'Mike',
          lastName: 'Johnson',
          role: 'TECHNICIAN',
          phone: '555-0101',
          tenantId: tenant.id,
        },
      }),
      prisma.user.upsert({
        where: { email: 'tech2@fieldsmartpro.com' },
        update: {},
        create: {
          email: 'tech2@fieldsmartpro.com',
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

    // Check if customers already exist
    const existingCustomers = await prisma.customer.findMany({
      where: { tenantId: tenant.id },
    });

    let customers;
    if (existingCustomers.length > 0) {
      console.log(`ℹ️ Found ${existingCustomers.length} existing customers, skipping creation`);
      customers = existingCustomers;
    } else {
      // Create demo customers
      customers = await Promise.all([
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
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Database seeded successfully',
        summary: {
          tenant: tenant.name,
          users: users.length,
          customers: customers.length,
        },
      }),
    };
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
