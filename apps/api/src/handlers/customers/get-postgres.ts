import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '../../services/prisma.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[PG-Get] Handler invoked');
  
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
      console.error('[PG-Get] ❌ Missing tenant ID in request headers');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Tenant ID is required',
          message: 'Please ensure you are logged in and your session is valid'
        }),
      };
    }
    
    console.log('[PG-Get] Tenant ID:', tenantId);

    // Get customer ID from path
    const customerId = event.pathParameters?.customerId || event.pathParameters?.id;
    if (!customerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Customer ID is required' }),
      };
    }

    console.log('[PG-Get] Customer ID:', customerId);

    // Get customer using raw SQL
    const customers = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, "tenantId", "firstName", "lastName", email, phone, address, city, state, "zipCode", notes,
        "createdAt", "updatedAt"
      FROM customers 
      WHERE id = $1 AND "tenantId" = $2
      LIMIT 1
    `, customerId, tenantId);

    if (!customers || customers.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Customer not found' }),
      };
    }

    const customer = customers[0];
    console.log('[PG-Get] Customer found:', customer.id);

    // Get linked addresses from addresses table
    const addresses = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, type, name, street, "streetLine2", city, state, zip, country,
        "accessNotes", "gateCode", latitude, longitude, "createdAt", "updatedAt"
      FROM addresses 
      WHERE "customerId" = $1 AND "tenantId" = $2
      ORDER BY 
        CASE WHEN type = 'PRIMARY' THEN 0 
             WHEN type = 'BILLING' THEN 1 
             ELSE 2 END,
        "createdAt" DESC
    `, customerId, tenantId);

    console.log('[PG-Get] Found', addresses?.length || 0, 'addresses for customer');

    // Find primary address for backward compatibility
    const primaryAddress = addresses?.find((a: any) => a.type === 'PRIMARY') || addresses?.[0];

    // Format response for frontend compatibility
    const response = {
      customer: {
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
        // Legacy inline address (from customers table)
        inlineAddress: customer.address ? {
          street: customer.address,
          city: customer.city,
          state: customer.state,
          zip: customer.zipCode,
        } : null,
        // Primary address for backward compatibility
        address: primaryAddress ? {
          id: primaryAddress.id,
          type: primaryAddress.type,
          name: primaryAddress.name,
          street: primaryAddress.street,
          street2: primaryAddress.streetLine2,
          streetLine2: primaryAddress.streetLine2,
          city: primaryAddress.city,
          state: primaryAddress.state,
          zip: primaryAddress.zip,
          country: primaryAddress.country,
          accessNotes: primaryAddress.accessNotes,
          gateCode: primaryAddress.gateCode,
        } : (customer.address ? {
          street: customer.address,
          city: customer.city,
          state: customer.state,
          zip: customer.zipCode,
        } : null),
        // All addresses array
        addresses: addresses?.map((addr: any) => ({
          id: addr.id,
          type: addr.type,
          name: addr.name,
          street: addr.street,
          street2: addr.streetLine2,
          streetLine2: addr.streetLine2,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          country: addr.country,
          accessNotes: addr.accessNotes,
          gateCode: addr.gateCode,
          latitude: addr.latitude,
          longitude: addr.longitude,
          createdAt: addr.createdAt,
          updatedAt: addr.updatedAt,
        })) || [],
        notes: customer.notes,
        tenantId: customer.tenantId,
        createdAt: customer.createdAt,
        created_at: customer.createdAt,
        updatedAt: customer.updatedAt,
        updated_at: customer.updatedAt,
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('[PG-Get] Error:', error);
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
