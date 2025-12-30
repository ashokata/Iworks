import { APIGatewayProxyHandler } from 'aws-lambda';
import { getPrismaClient } from '../../services/prisma.service';
import { v4 as uuidv4 } from 'uuid';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Tenant-Id',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export const handler: APIGatewayProxyHandler = async (event) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  try {
    const prisma = getPrismaClient();
    const body = JSON.parse(event.body || '{}');
    const { company, admin } = body;

    console.log('[Tenant Register] Request:', { company: company?.name, admin: admin?.email });

    // Validate required fields
    if (!company?.name || !admin?.email || !admin?.password) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Missing required fields',
          required: ['company.name', 'admin.email', 'admin.password'],
        }),
      };
    }

    // Generate subdomain from company name (use subdomain instead of slug)
    const subdomain = company.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if tenant with this subdomain already exists using raw SQL
    const existingTenants = await prisma.$queryRawUnsafe(`
      SELECT id FROM tenants WHERE subdomain = $1 LIMIT 1
    `, subdomain) as any[];

    if (existingTenants && existingTenants.length > 0) {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'A company with this name already exists.',
        }),
      };
    }

    // Check if user with this email already exists
    const existingUsers = await prisma.$queryRawUnsafe(`
      SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1
    `, admin.email.trim()) as any[];

    if (existingUsers && existingUsers.length > 0) {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'An account with this email already exists.',
        }),
      };
    }

    // Create tenant and user using raw SQL
    const tenantId = uuidv4();
    const userId = uuidv4();

    // Create tenant
    await prisma.$executeRawUnsafe(`
      INSERT INTO tenants (id, name, subdomain, settings, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4::jsonb, true, NOW(), NOW())
    `, tenantId, company.name, subdomain, JSON.stringify({
      domain: company.domain || '',
      email: company.email || '',
      phone: company.phone || '',
    }));

    // Create admin user
    await prisma.$executeRawUnsafe(`
      INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role, "isActive", "tenantId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, 'ADMIN', true, $6, NOW(), NOW())
    `, userId, admin.email.toLowerCase().trim(), admin.password, admin.firstName || '', admin.lastName || '', tenantId);

    console.log('[Tenant Register] Success:', { tenantId, userId, company: company.name });

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Registration successful',
        tenant: {
          id: tenantId,
          name: company.name,
          subdomain,
        },
        user: {
          id: userId,
          email: admin.email,
        },
      }),
    };
  } catch (error: any) {
    console.error('[Tenant Register] Error:', error);

    // Handle unique constraint violations
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'A company or user with this information already exists' }),
      };
    }

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
