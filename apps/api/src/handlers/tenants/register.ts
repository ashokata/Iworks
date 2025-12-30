import { APIGatewayProxyHandler } from 'aws-lambda';
import { getPrismaClient } from '../../services/prisma.service';

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

    // Generate slug from company name
    const slug = company.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if tenant with this slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'A company with this name already exists.',
        }),
      };
    }

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: company.name,
          slug,
          status: 'TRIAL',
          settings: {
            domain: company.domain || '',
            email: company.email || '',
            phone: company.phone || '',
          },
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          tenant: { connect: { id: tenant.id } },
          email: admin.email,
          passwordHash: admin.password, // In production, hash this
          firstName: admin.firstName || '',
          lastName: admin.lastName || '',
          role: 'OWNER',
          isActive: true,
          isVerified: true,
        },
      });

      return { tenant, user };
    });

    console.log('[Tenant Register] Success:', result.tenant.name);

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Registration successful',
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
        },
        user: {
          id: result.user.id,
          email: result.user.email,
        },
      }),
    };
  } catch (error: any) {
    console.error('[Tenant Register] Error:', error);

    if (error.code === 'P2002') {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'A company with this information already exists' }),
      };
    }

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

