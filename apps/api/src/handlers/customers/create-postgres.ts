import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '../../services/prisma.service';
import { v4 as uuidv4 } from 'uuid';

// Validation schema - accepts both camelCase and snake_case
const createCustomerSchema = z.object({
  type: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  companyName: z.string().optional(),
  company_name: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  mobile_number: z.string().optional(),
  homePhone: z.string().optional(),
  home_number: z.string().optional(),
  workPhone: z.string().optional(),
  work_number: z.string().optional(),
  notes: z.string().optional(),
  street: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  zipCode: z.string().optional(),
}).passthrough();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[PG-Create] Handler invoked');
  
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
      console.error('[PG-Create] ❌ Missing tenant ID in request headers');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Tenant ID is required',
          message: 'Please ensure you are logged in and your session is valid'
        }),
      };
    }
    
    console.log('[PG-Create] Tenant ID:', tenantId);

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const rawBody = JSON.parse(event.body);
    console.log('[PG-Create] Raw body:', JSON.stringify(rawBody));

    // Validate
    const validationResult = createCustomerSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.log('[PG-Create] Validation error:', JSON.stringify(validationResult.error.issues));
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

    // Normalize field names
    const firstName = body.firstName || body.first_name || '';
    const lastName = body.lastName || body.last_name || '';
    const email = body.email || '';
    const phone = body.mobilePhone || body.mobile_number || body.phone || '';
    const address = body.street || body.address || '';
    const city = body.city || '';
    const state = body.state || '';
    const zipCode = body.zip || body.zipCode || '';
    const notes = body.notes || '';

    console.log('[PG-Create] Normalized data:', { firstName, lastName, email, phone });

    // Check if email already exists for this tenant using raw SQL
    if (email) {
      const existingCustomers = await prisma.$queryRawUnsafe(`
        SELECT id FROM customers WHERE "tenantId" = $1 AND LOWER(email) = LOWER($2) LIMIT 1
      `, tenantId, email) as any[];

      if (existingCustomers && existingCustomers.length > 0) {
        console.log('[PG-Create] Email already exists:', email);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Email already exists',
            message: `A customer with email "${email}" already exists. Please use a different email address.`,
          }),
        };
      }
    }

    // Create customer using raw SQL
    const customerId = uuidv4();

    await prisma.$executeRawUnsafe(`
      INSERT INTO customers (id, "tenantId", "firstName", "lastName", email, phone, address, city, state, "zipCode", notes, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    `, customerId, tenantId, firstName, lastName, email || null, phone, address, city, state, zipCode, notes || null);

    console.log('[PG-Create] Customer created:', customerId);

    // Format response for frontend compatibility
    const response = {
      customer: {
        id: customerId,
        customerId: customerId,
        firstName,
        lastName,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`.trim() || 'Unknown',
        email,
        phone,
        mobilePhone: phone,
        mobile_number: phone,
        address: address ? {
          street: address,
          city,
          state,
          zip: zipCode,
        } : null,
        notes,
        tenantId,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('[PG-Create] Error:', error);
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
