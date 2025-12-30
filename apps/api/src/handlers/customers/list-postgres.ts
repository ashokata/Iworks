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
      // Search customers with addresses
      const searchPattern = `%${search.toLowerCase()}%`;
      customers = await prisma.$queryRawUnsafe(`
        SELECT 
          c.id, c."tenantId", c."firstName", c."lastName", c.email, c.phone, 
          c.address as inline_address, c.city as inline_city, c.state as inline_state, c."zipCode" as inline_zip,
          c.notes, c."createdAt", c."updatedAt",
          a.id as addr_id, a.type as addr_type, a.street as addr_street, a."streetLine2" as addr_street2,
          a.city as addr_city, a.state as addr_state, a.zip as addr_zip, a.country as addr_country
        FROM customers c
        LEFT JOIN (
          SELECT DISTINCT ON ("customerId") *
          FROM addresses
          WHERE "tenantId" = $1
          ORDER BY "customerId", 
            CASE WHEN type = 'PRIMARY' THEN 0 WHEN type = 'BILLING' THEN 1 ELSE 2 END,
            "createdAt" DESC
        ) a ON c.id = a."customerId"
        WHERE c."tenantId" = $1 
        AND (
          LOWER(c."firstName") LIKE $2 
          OR LOWER(c."lastName") LIKE $2 
          OR LOWER(c.email) LIKE $2 
          OR c.phone LIKE $2
        )
        ORDER BY c."createdAt" DESC
        LIMIT $3 OFFSET $4
      `, tenantId, searchPattern, limit, offset);

      const countResult = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM customers 
        WHERE "tenantId" = $1 
        AND (
          LOWER("firstName") LIKE $2 
          OR LOWER("lastName") LIKE $2 
          OR LOWER(email) LIKE $2 
          OR phone LIKE $2
        )
      `, tenantId, searchPattern) as any[];
      total = parseInt(countResult[0]?.count || '0', 10);
    } else {
      // List all customers with addresses
      customers = await prisma.$queryRawUnsafe(`
        SELECT 
          c.id, c."tenantId", c."firstName", c."lastName", c.email, c.phone, 
          c.address as inline_address, c.city as inline_city, c.state as inline_state, c."zipCode" as inline_zip,
          c.notes, c."createdAt", c."updatedAt",
          a.id as addr_id, a.type as addr_type, a.street as addr_street, a."streetLine2" as addr_street2,
          a.city as addr_city, a.state as addr_state, a.zip as addr_zip, a.country as addr_country
        FROM customers c
        LEFT JOIN (
          SELECT DISTINCT ON ("customerId") *
          FROM addresses
          WHERE "tenantId" = $1
          ORDER BY "customerId", 
            CASE WHEN type = 'PRIMARY' THEN 0 WHEN type = 'BILLING' THEN 1 ELSE 2 END,
            "createdAt" DESC
        ) a ON c.id = a."customerId"
        WHERE c."tenantId" = $1 
        ORDER BY c."createdAt" DESC
        LIMIT $2 OFFSET $3
      `, tenantId, limit, offset);

      const countResult = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM customers WHERE "tenantId" = $1
      `, tenantId) as any[];
      total = parseInt(countResult[0]?.count || '0', 10);
    }

    console.log('[PG-List] Found customers:', customers.length);

    // Format response for frontend compatibility
    const formattedCustomers = customers.map(customer => {
      // Prefer linked address over inline address
      const hasLinkedAddress = customer.addr_id !== null;
      const address = hasLinkedAddress ? {
        id: customer.addr_id,
        type: customer.addr_type,
        street: customer.addr_street,
        street2: customer.addr_street2,
        streetLine2: customer.addr_street2,
        city: customer.addr_city,
        state: customer.addr_state,
        zip: customer.addr_zip,
        country: customer.addr_country,
      } : (customer.inline_address ? {
        street: customer.inline_address,
        city: customer.inline_city,
        state: customer.inline_state,
        zip: customer.inline_zip,
      } : null);

      return {
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
        address,
        notes: customer.notes,
        tenantId: customer.tenantId,
        createdAt: customer.createdAt,
        created_at: customer.createdAt,
        updatedAt: customer.updatedAt,
        updated_at: customer.updatedAt,
      };
    });

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
