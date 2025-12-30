import { APIGatewayProxyHandler } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('🌱 Starting database seed...');

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if tenant exists
    const tenantExists = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count FROM tenants WHERE id = 'tenant1'
    `);

    if (parseInt(tenantExists[0].count) === 0) {
      // Create demo tenant using raw SQL (simple schema)
      await prisma.$executeRawUnsafe(`
        INSERT INTO tenants (id, name, subdomain, "isActive", settings, "createdAt", "updatedAt")
        VALUES ('tenant1', 'FieldSmartPro Demo', 'demo', true, '{}', NOW(), NOW())
      `);
      console.log('✅ Created tenant: FieldSmartPro Demo');
    } else {
      console.log('ℹ️ Tenant already exists, skipping creation');
    }

    // Check if users exist
    const usersExist = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count FROM users WHERE "tenantId" = 'tenant1'
    `);

    if (parseInt(usersExist[0].count) === 0) {
      // Create demo users using raw SQL (simple schema)
      await prisma.$executeRawUnsafe(`
        INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role, phone, "isActive", "tenantId", "createdAt", "updatedAt")
        VALUES
          ('user1', 'admin@fieldsmartpro.com', 'demo-hash', 'Admin', 'User', 'ADMIN', '555-0100', true, 'tenant1', NOW(), NOW()),
          ('user2', 'tech1@fieldsmartpro.com', 'demo-hash', 'Mike', 'Johnson', 'TECHNICIAN', '555-0101', true, 'tenant1', NOW(), NOW()),
          ('user3', 'tech2@fieldsmartpro.com', 'demo-hash', 'Sarah', 'Williams', 'TECHNICIAN', '555-0102', true, 'tenant1', NOW(), NOW())
      `);
      console.log('✅ Created 3 users');
    } else {
      console.log('ℹ️ Users already exist, skipping creation');
    }

    // Check if customers already exist
    const existingCustomers = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count FROM customers WHERE "tenantId" = 'tenant1'
    `);

    const customerCount = parseInt(existingCustomers[0].count);

    if (customerCount > 0) {
      console.log(`ℹ️ Found ${customerCount} existing customers, skipping creation`);
    } else {
      // Create demo customers using raw SQL
      await prisma.$executeRawUnsafe(`
        INSERT INTO customers (id, "firstName", "lastName", email, phone, address, city, state, "zipCode", notes, "tenantId", "createdAt", "updatedAt")
        VALUES
          ('cust1', 'John', 'Smith', 'john.smith@example.com', '555-1001', '123 Main Street', 'Springfield', 'IL', '62701', 'Preferred customer - VIP service', 'tenant1', NOW(), NOW()),
          ('cust2', 'Emily', 'Davis', 'emily.davis@example.com', '555-1002', '456 Oak Avenue', 'Springfield', 'IL', '62702', NULL, 'tenant1', NOW(), NOW()),
          ('cust3', 'Robert', 'Brown', 'robert.brown@example.com', '555-1003', '789 Pine Road', 'Riverside', 'IL', '60546', 'Commercial account - office building', 'tenant1', NOW(), NOW()),
          ('cust4', 'Jennifer', 'Wilson', 'jennifer.wilson@example.com', '555-1004', '321 Elm Street', 'Aurora', 'IL', '60505', NULL, 'tenant1', NOW(), NOW()),
          ('cust5', 'Michael', 'Taylor', 'michael.taylor@example.com', '555-1005', '654 Maple Drive', 'Naperville', 'IL', '60540', 'New customer - first service call', 'tenant1', NOW(), NOW()),
          ('cust6', 'Sarah', 'Martinez', 'sarah.martinez@example.com', '555-1006', '890 Birch Lane', 'Joliet', 'IL', '60431', 'Property manager - handles multiple units', 'tenant1', NOW(), NOW()),
          ('cust7', 'David', 'Anderson', 'david.anderson@example.com', '555-1007', '234 Cedar Court', 'Schaumburg', 'IL', '60173', NULL, 'tenant1', NOW(), NOW()),
          ('cust8', 'Lisa', 'Thompson', 'lisa.thompson@example.com', '555-1008', '567 Willow Way', 'Evanston', 'IL', '60201', 'Recurring monthly maintenance contract', 'tenant1', NOW(), NOW()),
          ('cust9', 'James', 'Garcia', 'james.garcia@example.com', '555-1009', '901 Spruce Street', 'Oak Park', 'IL', '60302', NULL, 'tenant1', NOW(), NOW()),
          ('cust10', 'Patricia', 'Rodriguez', 'patricia.rodriguez@example.com', '555-1010', '1234 Ash Boulevard', 'Skokie', 'IL', '60076', 'Prefers afternoon appointments only', 'tenant1', NOW(), NOW()),
          ('cust11', 'Christopher', 'Lee', 'christopher.lee@example.com', '555-1011', '456 Hickory Hills', 'Downers Grove', 'IL', '60515', 'Commercial - Restaurant equipment', 'tenant1', NOW(), NOW()),
          ('cust12', 'Amanda', 'White', 'amanda.white@example.com', '555-1012', '789 Poplar Place', 'Wheaton', 'IL', '60187', NULL, 'tenant1', NOW(), NOW()),
          ('cust13', 'Daniel', 'Harris', 'daniel.harris@example.com', '555-1013', '321 Chestnut Circle', 'Elmhurst', 'IL', '60126', 'Senior citizen - discounted rates apply', 'tenant1', NOW(), NOW()),
          ('cust14', 'Michelle', 'Clark', 'michelle.clark@example.com', '555-1014', '654 Redwood Drive', 'Arlington Heights', 'IL', '60004', NULL, 'tenant1', NOW(), NOW()),
          ('cust15', 'Thomas', 'Lewis', 'thomas.lewis@example.com', '555-1015', '987 Magnolia Street', 'Palatine', 'IL', '60067', 'Industrial client - large warehouse facility', 'tenant1', NOW(), NOW())
      `);
      console.log('✅ Created 15 customers');
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
          tenant: 'FieldSmartPro Demo',
          users: 3,
          customers: customerCount > 0 ? customerCount : 15,
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
