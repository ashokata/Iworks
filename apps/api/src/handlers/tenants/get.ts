import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '../../services/prisma.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Tenant-Get] Handler invoked');
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  try {
    const prisma = getPrismaClient();
    
    // Get tenant ID from path
    const tenantId = event.pathParameters?.tenantId || event.pathParameters?.id;
    
    if (!tenantId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Tenant ID is required' }),
      };
    }

    console.log('[Tenant-Get] Tenant ID:', tenantId);

    // Get tenant using raw SQL
    const tenants = await prisma.$queryRawUnsafe(`
      SELECT id, name, subdomain, settings, "isActive", "createdAt", "updatedAt"
      FROM tenants 
      WHERE id = $1
      LIMIT 1
    `, tenantId) as any[];

    if (!tenants || tenants.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Tenant not found' }),
      };
    }

    const tenant = tenants[0];
    console.log('[Tenant-Get] Tenant found:', tenant.name);

    // Parse settings if it's a string
    let settings = tenant.settings;
    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch {
        settings = {};
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          slug: tenant.subdomain, // Alias for frontend
          settings,
          isActive: tenant.isActive,
          status: tenant.isActive ? 'ACTIVE' : 'INACTIVE',
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        },
      }),
    };
  } catch (error: any) {
    console.error('[Tenant-Get] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }),
    };
  }
};

