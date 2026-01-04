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

    // Use raw SQL that works with both simplified and full schema
    let customers: any[];
    let total: number;

    if (search) {
      // Search customers with addresses
      const searchPattern = `%${search.toLowerCase()}%`;
      customers = await prisma.$queryRawUnsafe(`
        SELECT 
          c.id, c."tenantId", c."firstName", c."lastName", c."companyName", c.email, 
          c."mobilePhone", c."homePhone", c."workPhone",
          c.notes, c."createdAt", c."updatedAt",
          a.id as addr_id, a.type as addr_type, a.street as addr_street, a."streetLine2" as addr_street2,
          a.city as addr_city, a.state as addr_state, a.zip as addr_zip, a.country as addr_country
        FROM customers c
        LEFT JOIN (
          SELECT DISTINCT ON ("customerId") *
          FROM addresses
          ORDER BY "customerId", 
            CASE WHEN type = 'PRIMARY' THEN 0 WHEN type = 'BILLING' THEN 1 ELSE 2 END,
            "createdAt" DESC
        ) a ON c.id = a."customerId"
        WHERE c."tenantId" = $1 
        AND (
          LOWER(c."firstName") LIKE $2 
          OR LOWER(c."lastName") LIKE $2 
          OR LOWER(c."companyName") LIKE $2 
          OR LOWER(c.email) LIKE $2 
          OR c."mobilePhone" LIKE $2
        )
        ORDER BY c."createdAt" DESC
        LIMIT $3 OFFSET $4
      `, tenantId, searchPattern, limit, offset) as any[];

      const countResult = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM customers 
        WHERE "tenantId" = $1 
        AND (
          LOWER("firstName") LIKE $2 
          OR LOWER("lastName") LIKE $2 
          OR LOWER("companyName") LIKE $2 
          OR LOWER(email) LIKE $2 
          OR "mobilePhone" LIKE $2
        )
      `, tenantId, searchPattern) as any[];
      total = parseInt(countResult[0]?.count || '0', 10);
    } else {
      // List all customers with addresses
      customers = await prisma.$queryRawUnsafe(`
        SELECT 
          c.id, c."tenantId", c."firstName", c."lastName", c."companyName", c.email, 
          c."mobilePhone", c."homePhone", c."workPhone",
          c.notes, c."createdAt", c."updatedAt",
          a.id as addr_id, a.type as addr_type, a.street as addr_street, a."streetLine2" as addr_street2,
          a.city as addr_city, a.state as addr_state, a.zip as addr_zip, a.country as addr_country
        FROM customers c
        LEFT JOIN (
          SELECT DISTINCT ON ("customerId") *
          FROM addresses
          ORDER BY "customerId", 
            CASE WHEN type = 'PRIMARY' THEN 0 WHEN type = 'BILLING' THEN 1 ELSE 2 END,
            "createdAt" DESC
        ) a ON c.id = a."customerId"
        WHERE c."tenantId" = $1 
        ORDER BY c."createdAt" DESC
        LIMIT $2 OFFSET $3
      `, tenantId, limit, offset) as any[];

      const countResult = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM customers WHERE "tenantId" = $1
      `, tenantId) as any[];
      total = parseInt(countResult[0]?.count || '0', 10);
    }

    console.log('[PG-List] Found customers:', customers.length);

    // Get all addresses for all customers in one query for efficiency
    const customerIds = customers.map(c => c.id);
    let allAddresses: any[] = [];
    if (customerIds.length > 0) {
      allAddresses = await prisma.address.findMany({
        where: {
          customerId: { in: customerIds }
        },
        orderBy: [
          { customerId: 'asc' },
          { type: 'asc' },
          { createdAt: 'desc' }
        ]
      });
      console.log('[PG-List] Found addresses:', allAddresses.length);
    }

    // Group addresses by customerId
    const addressesByCustomer = allAddresses.reduce((acc: any, addr: any) => {
      if (!acc[addr.customerId]) acc[addr.customerId] = [];
      acc[addr.customerId].push({
        id: addr.id,
        type: addr.type,
        street: addr.street,
        street2: addr.streetLine2,
        streetLine2: addr.streetLine2,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country || 'US',
        accessNotes: addr.accessNotes,
        gateCode: addr.gateCode,
        createdAt: addr.createdAt,
        updatedAt: addr.updatedAt,
      });
      return acc;
    }, {});

    // Format response for frontend compatibility
    const formattedCustomers = customers.map(customer => {
      // Get ALL addresses for this customer
      const customerAddresses = addressesByCustomer[customer.id] || [];

      return {
        id: customer.id,
        customerId: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        first_name: customer.firstName,
        last_name: customer.lastName,
        companyName: customer.companyName,
        display_name: customer.companyName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown',
        email: customer.email,
        phone: customer.mobilePhone,
        mobilePhone: customer.mobilePhone,
        homePhone: customer.homePhone,
        workPhone: customer.workPhone,
        mobile_number: customer.mobilePhone,
        addresses: customerAddresses, // Now returns ALL addresses as an array
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
