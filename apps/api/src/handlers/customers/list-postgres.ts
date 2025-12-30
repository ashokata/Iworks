import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '../../services/prisma.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[PG-List] Handler invoked');
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id,Authorization',
  };

  try {
    const prisma = getPrismaClient();
    
    // Get tenant ID from header - REQUIRED for tenant isolation
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'] || event.headers['X-Tenant-ID'];
    
    if (!tenantId) {
      console.error('[PG-List] ❌ Missing tenant ID in request headers');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Tenant ID is required',
          message: 'Please ensure you are logged in and your session is valid'
        }),
      };
    }
    
    console.log('[PG-List] Tenant ID:', tenantId);

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const limit = Math.min(parseInt(queryParams.limit || '50', 10), 100);
    const offset = parseInt(queryParams.offset || '0', 10);
    const search = queryParams.search || queryParams.query;

    console.log('[PG-List] Query params:', { limit, offset, search });

    // Use raw SQL to avoid schema mismatch
    let customers: any[];
    let total: number;

    if (search) {
      // Search customers
      const searchPattern = `%${search.toLowerCase()}%`;
      customers = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          id, "tenantId", "firstName", "lastName", email, phone, address, city, state, "zipCode", notes,
          "createdAt", "updatedAt"
        FROM customers 
        WHERE "tenantId" = $1 
        AND (
          LOWER("firstName") LIKE $2 
          OR LOWER("lastName") LIKE $2 
          OR LOWER(email) LIKE $2 
          OR phone LIKE $2
        )
        ORDER BY "createdAt" DESC
        LIMIT $3 OFFSET $4
      `, tenantId, searchPattern, limit, offset);

      const countResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) as count FROM customers 
        WHERE "tenantId" = $1 
        AND (
          LOWER("firstName") LIKE $2 
          OR LOWER("lastName") LIKE $2 
          OR LOWER(email) LIKE $2 
          OR phone LIKE $2
        )
      `, tenantId, searchPattern);
      total = parseInt(countResult[0]?.count || '0', 10);
    } else {
      // List all customers
      customers = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          id, "tenantId", "firstName", "lastName", email, phone, address, city, state, "zipCode", notes,
          "createdAt", "updatedAt"
        FROM customers 
        WHERE "tenantId" = $1 
        ORDER BY "createdAt" DESC
        LIMIT $2 OFFSET $3
      `, tenantId, limit, offset);

      const countResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) as count FROM customers WHERE "tenantId" = $1
      `, tenantId);
      total = parseInt(countResult[0]?.count || '0', 10);
    }

    console.log('[PG-List] Found customers:', customers.length);

    // Format response for frontend compatibility
    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      customerId: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      first_name: customer.firstName,
      last_name: customer.lastName,
      display_name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown',
      email: customer.email,
      phone: customer.phone,
      mobilePhone: customer.phone,
      mobile_number: customer.phone,
      address: customer.address ? {
        street: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zipCode,
      } : null,
      notes: customer.notes,
      tenantId: customer.tenantId,
      createdAt: customer.createdAt,
      created_at: customer.createdAt,
      updatedAt: customer.updatedAt,
      updated_at: customer.updatedAt,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        customers: formattedCustomers,
        total,
        limit,
        offset,
      }),
    };
  } catch (error: any) {
    console.error('[PG-List] Error:', error);
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
