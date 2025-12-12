/**
 * Migration Script: DynamoDB to PostgreSQL
 * 
 * This script migrates customer data from DynamoDB to PostgreSQL.
 * Run this after deploying the new PostgreSQL infrastructure.
 * 
 * Usage:
 *   npx ts-node scripts/migrate-dynamodb-to-postgres.ts
 * 
 * Environment variables required:
 *   DATABASE_URL - PostgreSQL connection string
 *   AWS_REGION - AWS region for DynamoDB
 *   DYNAMODB_CUSTOMERS_TABLE - DynamoDB table name
 */

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface DynamoDBCustomer {
  customerId: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

async function migrateCustomers() {
  console.log('🚀 Starting DynamoDB to PostgreSQL migration...\n');

  const tableName = process.env.DYNAMODB_CUSTOMERS_TABLE || 'FieldSmartProStack-CustomersTable';
  
  try {
    // Step 1: Ensure tenant exists
    console.log('📋 Step 1: Ensuring default tenant exists...');
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'default' },
      update: {},
      create: {
        name: 'Default Tenant',
        slug: 'default',
        status: 'ACTIVE',
      },
    });
    console.log(`   ✅ Tenant ready: ${tenant.id}\n`);

    // Step 2: Scan DynamoDB table
    console.log('📋 Step 2: Scanning DynamoDB table...');
    const customers: DynamoDBCustomer[] = [];
    let lastEvaluatedKey: any = undefined;

    do {
      const command = new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response = await dynamodb.send(command);
      
      if (response.Items) {
        for (const item of response.Items) {
          customers.push(unmarshall(item) as DynamoDBCustomer);
        }
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log(`   ✅ Found ${customers.length} customers in DynamoDB\n`);

    if (customers.length === 0) {
      console.log('   ℹ️  No customers to migrate\n');
      return;
    }

    // Step 3: Migrate customers to PostgreSQL
    console.log('📋 Step 3: Migrating customers to PostgreSQL...');
    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const ddbCustomer of customers) {
      try {
        // Check if customer already exists (by email or old ID in notes)
        const existing = await prisma.customer.findFirst({
          where: {
            OR: [
              { email: ddbCustomer.email || undefined },
              { notes: { contains: ddbCustomer.customerId } },
            ],
          },
        });

        if (existing) {
          console.log(`   ⏭️  Skipping ${ddbCustomer.firstName} ${ddbCustomer.lastName} (already exists)`);
          skipped++;
          continue;
        }

        // Generate customer number
        const customerCount = await prisma.customer.count({
          where: { tenantId: tenant.id },
        });
        const customerNumber = `CUST-${String(customerCount + 1).padStart(6, '0')}`;

        // Create customer in PostgreSQL
        const pgCustomer = await prisma.customer.create({
          data: {
            tenantId: tenant.id,
            customerNumber,
            type: 'RESIDENTIAL',
            firstName: ddbCustomer.firstName || null,
            lastName: ddbCustomer.lastName || null,
            email: ddbCustomer.email || null,
            mobilePhone: ddbCustomer.phone || null,
            notes: ddbCustomer.notes 
              ? `${ddbCustomer.notes}\n\n[Migrated from DynamoDB: ${ddbCustomer.customerId}]`
              : `[Migrated from DynamoDB: ${ddbCustomer.customerId}]`,
            createdAt: new Date(ddbCustomer.createdAt),
            updatedAt: new Date(ddbCustomer.updatedAt),
            // Create address if available
            addresses: ddbCustomer.address ? {
              create: {
                type: 'BOTH',
                street: ddbCustomer.address,
                city: ddbCustomer.city || '',
                state: ddbCustomer.state || '',
                zip: ddbCustomer.zipCode || '',
                country: 'US',
                isPrimary: true,
              },
            } : undefined,
          },
          include: {
            addresses: true,
          },
        });

        console.log(`   ✅ Migrated: ${pgCustomer.firstName} ${pgCustomer.lastName} (${pgCustomer.customerNumber})`);
        migrated++;
      } catch (error: any) {
        console.error(`   ❌ Failed to migrate ${ddbCustomer.firstName} ${ddbCustomer.lastName}: ${error.message}`);
        failed++;
      }
    }

    // Step 4: Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Total in DynamoDB: ${customers.length}`);
    console.log(`   Successfully migrated: ${migrated}`);
    console.log(`   Skipped (already exists): ${skipped}`);
    console.log(`   Failed: ${failed}`);
    console.log('\n✅ Migration complete!\n');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await migrateCustomers();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

