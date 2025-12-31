import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { getPrismaClient } from '../../services/prisma.service';

// Validation schema - accepts both camelCase and snake_case
const updateCustomerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  displayName: z.string().optional(),
  companyName: z.string().optional(),
  company_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  homePhone: z.string().optional(),
  workPhone: z.string().optional(),
  mobile_number: z.string().optional(),
  home_number: z.string().optional(),
  work_number: z.string().optional(),
  notes: z.string().optional(),
  // Address fields (for backward compatibility, but addresses are in separate table now)
  street: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  zipCode: z.string().optional(),
  addresses: z.array(z.any()).optional(),
}).passthrough();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[PG-Update] Handler invoked');
  
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
      console.error('[PG-Update] ❌ Missing tenant ID in request headers');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Tenant ID is required',
          message: 'Please ensure you are logged in and your session is valid'
        }),
      };
    }
    
    console.log('[PG-Update] Tenant ID:', tenantId);

    // Get customer ID from path
    const customerId = event.pathParameters?.customerId || event.pathParameters?.id;
    if (!customerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Customer ID is required' }),
      };
    }

    console.log('[PG-Update] Customer ID:', customerId);

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const rawBody = JSON.parse(event.body);
    console.log('[PG-Update] Raw body:', JSON.stringify(rawBody));

    // Validate
    const validationResult = updateCustomerSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.log('[PG-Update] Validation error:', JSON.stringify(validationResult.error.issues));
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

    // Handle display_name - split into firstName and lastName if provided
    let firstName = body.firstName || body.first_name;
    let lastName = body.lastName || body.last_name;
    
    const displayName = body.display_name || body.displayName;
    if (displayName && !firstName && !lastName) {
      const parts = displayName.trim().split(' ');
      if (parts.length >= 2) {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      } else {
        firstName = displayName;
      }
    }

    const email = body.email || '';
    const mobilePhone = body.mobilePhone || body.mobile_number || body.phone || '';
    const homePhone = body.homePhone || body.home_number || '';
    const workPhone = body.workPhone || body.work_number || '';
    const notes = body.notes;
    const companyName = body.companyName || body.company_name;

    // Check if customer exists using raw SQL
    const existingCustomers = await prisma.$queryRawUnsafe(`
      SELECT id, "firstName", "lastName", "companyName", email, "mobilePhone", "homePhone", "workPhone", notes
      FROM customers
      WHERE id = $1 AND "tenantId" = $2
      LIMIT 1
    `, customerId, tenantId) as any[];

    if (!existingCustomers || existingCustomers.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Customer not found' }),
      };
    }

    const existing = existingCustomers[0];

    // Check if email already exists for another customer
    if (email && email !== existing.email) {
      const emailCheck = await prisma.$queryRawUnsafe(`
        SELECT id FROM customers 
        WHERE "tenantId" = $1 AND LOWER(email) = LOWER($2) AND id != $3
        LIMIT 1
      `, tenantId, email, customerId) as any[];

      if (emailCheck && emailCheck.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Email already exists',
            message: `A customer with email "${email}" already exists.`,
          }),
        };
      }
    }

    // Update customer using raw SQL - only update fields that are provided
    await prisma.$executeRawUnsafe(`
      UPDATE customers SET
        "firstName" = COALESCE($1, "firstName"),
        "lastName" = COALESCE($2, "lastName"),
        "companyName" = COALESCE($3, "companyName"),
        email = COALESCE($4, email),
        "mobilePhone" = COALESCE($5, "mobilePhone"),
        "homePhone" = COALESCE($6, "homePhone"),
        "workPhone" = COALESCE($7, "workPhone"),
        notes = COALESCE($8, notes),
        "updatedAt" = NOW()
      WHERE id = $9 AND "tenantId" = $10
    `,
      firstName || null,
      lastName || null,
      companyName || null,
      email || null,
      mobilePhone || null,
      homePhone || null,
      workPhone || null,
      notes !== undefined ? notes : null,
      customerId,
      tenantId
    );

    console.log('[PG-Update] Customer updated:', customerId);

    // Fetch updated customer
    const updatedCustomers = await prisma.$queryRawUnsafe(`
      SELECT id, "tenantId", "firstName", "lastName", "companyName", email,
             "mobilePhone", "homePhone", "workPhone", notes,
             "createdAt", "updatedAt"
      FROM customers
      WHERE id = $1 AND "tenantId" = $2
      LIMIT 1
    `, customerId, tenantId) as any[];

    const customer = updatedCustomers[0];

    // Get linked addresses from addresses table
    const addresses = await prisma.$queryRawUnsafe(`
      SELECT
        id, type, name, street, "streetLine2", city, state, zip, country,
        "accessNotes", "gateCode", latitude, longitude, "createdAt", "updatedAt"
      FROM addresses
      WHERE "customerId" = $1
      ORDER BY
        CASE WHEN type = 'PRIMARY' THEN 0
             WHEN type = 'BILLING' THEN 1
             ELSE 2 END,
        "createdAt" DESC
    `, customerId) as any[];

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
        companyName: customer.companyName,
        display_name: customer.companyName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown',
        email: customer.email,
        phone: customer.mobilePhone,
        mobilePhone: customer.mobilePhone,
        homePhone: customer.homePhone,
        workPhone: customer.workPhone,
        mobile_number: customer.mobilePhone,
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
        } : null,
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
    console.error('[PG-Update] Error:', error);
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
