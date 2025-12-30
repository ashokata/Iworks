import { APIGatewayProxyHandler } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// SQL statements in correct order
const migrationStatements = [
  // Create tenants table
  `CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    settings JSONB,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
  )`,

  // Create users table
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    role TEXT DEFAULT 'TECHNICIAN' NOT NULL,
    phone TEXT,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON users("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "users_email_idx" ON users(email)`,

  // Create customers table
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    "zipCode" TEXT,
    notes TEXT,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS "customers_tenantId_idx" ON customers("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "customers_email_idx" ON customers(email)`,

  // Create jobs table
  `CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    "jobNumber" TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'SCHEDULED' NOT NULL,
    priority TEXT DEFAULT 'MEDIUM' NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "estimatedDuration" INTEGER,
    "actualDuration" INTEGER,
    address TEXT,
    city TEXT,
    state TEXT,
    "zipCode" TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    "customerId" TEXT NOT NULL REFERENCES customers(id),
    "assignedToId" TEXT REFERENCES users(id),
    "tenantId" TEXT NOT NULL REFERENCES tenants(id),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS "jobs_tenantId_idx" ON jobs("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "jobs_customerId_idx" ON jobs("customerId")`,
  `CREATE INDEX IF NOT EXISTS "jobs_assignedToId_idx" ON jobs("assignedToId")`,
  `CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON jobs(status)`,
  `CREATE INDEX IF NOT EXISTS "jobs_scheduledDate_idx" ON jobs("scheduledDate")`,

  // Create job_notes table
  `CREATE TABLE IF NOT EXISTS job_notes (
    id TEXT PRIMARY KEY,
    "jobId" TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS "job_notes_jobId_idx" ON job_notes("jobId")`,

  // Create invoices table
  `CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    "invoiceNumber" TEXT UNIQUE NOT NULL,
    "jobId" TEXT NOT NULL REFERENCES jobs(id),
    status TEXT DEFAULT 'DRAFT' NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    notes TEXT,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS "invoices_tenantId_idx" ON invoices("tenantId")`,
  `CREATE INDEX IF NOT EXISTS "invoices_jobId_idx" ON invoices("jobId")`,
  `CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON invoices(status)`,

  // Create invoice_items table
  `CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    "invoiceId" TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER DEFAULT 0 NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS "invoice_items_invoiceId_idx" ON invoice_items("invoiceId")`
];

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('📦 Starting database migration...');

    // Execute each statement individually
    for (let i = 0; i < migrationStatements.length; i++) {
      const statement = migrationStatements[i];
      console.log(`Executing statement ${i + 1}/${migrationStatements.length}:`, statement.substring(0, 50) + '...');
      await prisma.$executeRawUnsafe(statement);
    }

    console.log('✅ Database schema created successfully');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Database migrations completed successfully',
      }),
    };
  } catch (error: any) {
    console.error('❌ Error running migrations:', error);
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
