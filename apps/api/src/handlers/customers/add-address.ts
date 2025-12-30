import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '../../services/prisma.service';
import { v4 as uuidv4 } from 'uuid';

const addAddressSchema = z.object({
  type: z.enum(['PRIMARY', 'SERVICE', 'BILLING']).optional().default('SERVICE'),
  name: z.string().optional(),
  street: z.string().min(1, 'Street is required'),
  street2: z.string().optional(),
  streetLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'Zip is required'),
  zipCode: z.string().optional(),
  country: z.string().optional().default('US'),
  accessNotes: z.string().optional(),
  gateCode: z.string().optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Add Address] Handler invoked');
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const prisma = getPrismaClient();
    
    // Get tenant ID from header
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'] || event.headers['X-Tenant-ID'];
    
    if (!tenantId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Tenant ID is required' }),
      };
    }

    // Get customer ID from path
    const customerId = event.pathParameters?.customerId || event.pathParameters?.id;
    if (!customerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Customer ID is required' }),
      };
    }

    console.log('[Add Address] Customer ID:', customerId, 'Tenant ID:', tenantId);

    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const rawBody = JSON.parse(event.body);
    console.log('[Add Address] Raw body:', JSON.stringify(rawBody));

    const validationResult = addAddressSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation Error',
          details: validationResult.error.issues,
        }),
      };
    }

    const body = validationResult.data;

    // Verify customer exists
    const customerCheck = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id FROM customers WHERE id = $1 AND "tenantId" = $2 LIMIT 1
    `, customerId, tenantId);

    if (!customerCheck || customerCheck.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Customer not found' }),
      };
    }

    // If this is a PRIMARY address, unset any existing PRIMARY address
    if (body.type === 'PRIMARY') {
      await prisma.$executeRawUnsafe(`
        UPDATE addresses SET type = 'SERVICE' 
        WHERE "customerId" = $1 AND type = 'PRIMARY'
      `, customerId);
    }

    // Create address using raw SQL
    const addressId = uuidv4();
    const now = new Date().toISOString();
    const streetLine2 = body.street2 || body.streetLine2 || null;
    const zipCode = body.zip || body.zipCode;

    await prisma.$executeRawUnsafe(`
      INSERT INTO addresses (
        id, type, name, street, "streetLine2", city, state, zip, country,
        "accessNotes", "gateCode", "customerId", "tenantId", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::timestamp, $15::timestamp
      )
    `,
      addressId,
      body.type,
      body.name || null,
      body.street,
      streetLine2,
      body.city,
      body.state,
      zipCode,
      body.country,
      body.accessNotes || null,
      body.gateCode || null,
      customerId,
      tenantId,
      now,
      now
    );

    console.log('[Add Address] Address created:', addressId);

    // Return created address
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        address: {
          id: addressId,
          type: body.type,
          name: body.name || null,
          street: body.street,
          streetLine2: streetLine2,
          city: body.city,
          state: body.state,
          zip: zipCode,
          country: body.country,
          accessNotes: body.accessNotes || null,
          gateCode: body.gateCode || null,
          customerId: customerId,
          tenantId: tenantId,
          createdAt: now,
          updatedAt: now,
        },
      }),
    };
  } catch (error: any) {
    console.error('[Add Address] Error:', error);
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

