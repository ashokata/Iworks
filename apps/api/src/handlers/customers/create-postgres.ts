import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { customerPostgresService } from '../../services/customer.postgres.service';
import { getPrismaClient } from '../../services/prisma.service';

const prisma = getPrismaClient();

// Validation schema - accepts both camelCase and snake_case
const createCustomerSchema = z.object({
  type: z.string().optional(), // Accept any string, normalize later
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  first_name: z.string().optional(), // Frontend compatibility
  last_name: z.string().optional(),  // Frontend compatibility
  companyName: z.string().optional(),
  company_name: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  mobile_number: z.string().optional(), // Frontend compatibility
  homePhone: z.string().optional(),
  home_number: z.string().optional(),
  workPhone: z.string().optional(),
  work_number: z.string().optional(),
  jobTitle: z.string().optional(),
  job_title: z.string().optional(),
  preferredContactMethod: z.enum(['SMS', 'EMAIL', 'VOICE', 'PUSH', 'IN_APP']).optional(),
  notificationsEnabled: z.boolean().optional(),
  notifications_enabled: z.boolean().optional(),
  isContractor: z.boolean().optional(),
  is_contractor: z.boolean().optional(),
  notes: z.string().optional(),
  // Flat address fields (backward compatibility)
  street: z.string().optional(),
  address: z.string().optional(), // Alias for street
  streetLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  zipCode: z.string().optional(), // Alias
  country: z.string().optional(),
  // Addresses array (new)
  addresses: z.array(z.object({
    type: z.enum(['SERVICE', 'BILLING', 'PRIMARY']).optional(),
    name: z.string().optional(),
    street: z.string(),
    streetLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    zipCode: z.string().optional(), // Alias
    postalCode: z.string().optional(), // Alias
    country: z.string().optional(),
    accessNotes: z.string().optional(),
    gateCode: z.string().optional(),
    isPrimary: z.boolean().optional(),
  })).optional(),
}).passthrough(); // Allow additional fields

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[PG-Create] Handler invoked');
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
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

    // Normalize field names (frontend uses snake_case, backend uses camelCase)
    // Also normalize type values (homeowner -> RESIDENTIAL, business -> COMMERCIAL)
    let customerType = (body.type || 'RESIDENTIAL').toUpperCase();
    if (customerType === 'HOMEOWNER') customerType = 'RESIDENTIAL';
    if (customerType === 'BUSINESS') customerType = 'COMMERCIAL';
    
    // Build customFields object for fields not in main schema
    const customFields: Record<string, any> = {};
    if (body.isContractor !== undefined || body.is_contractor !== undefined) {
      customFields.isContractor = body.isContractor ?? body.is_contractor;
    }
    if (body.jobTitle || body.job_title) {
      customFields.jobTitle = body.jobTitle || body.job_title;
    }
    
    const normalizedData = {
      tenantId,
      type: customerType as 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR',
      firstName: body.firstName || body.first_name,
      lastName: body.lastName || body.last_name,
      companyName: body.companyName || body.company_name || body.company,
      email: body.email || undefined,
      mobilePhone: body.mobilePhone || body.mobile_number || body.phone,
      homePhone: body.homePhone || body.home_number,
      workPhone: body.workPhone || body.work_number,
      preferredContactMethod: body.preferredContactMethod,
      notificationsEnabled: body.notificationsEnabled ?? body.notifications_enabled,
      notes: body.notes,
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
      // Flat address fields (backward compatibility)
      street: body.street || body.address,
      streetLine2: body.streetLine2,
      city: body.city,
      state: body.state,
      zip: body.zip || body.zipCode,
      country: body.country,
      // Addresses array (new)
      addresses: body.addresses?.map(addr => ({
        type: addr.type || 'SERVICE',
        name: addr.name,
        street: addr.street,
        streetLine2: addr.streetLine2,
        city: addr.city,
        state: addr.state,
        zip: addr.zip || addr.zipCode || addr.postalCode,
        country: addr.country || 'US',
        accessNotes: addr.accessNotes,
        gateCode: addr.gateCode,
        isPrimary: addr.isPrimary,
      })),
    };

    console.log('[PG-Create] Normalized data:', JSON.stringify(normalizedData));

    // Check if email already exists for this tenant
    if (normalizedData.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          tenantId,
          email: normalizedData.email,
          isArchived: false,
        },
        select: { id: true, email: true },
      });

      if (existingCustomer) {
        console.log('[PG-Create] Email already exists:', normalizedData.email);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Email already exists',
            message: `A customer with email "${normalizedData.email}" already exists. Please use a different email address.`,
          }),
        };
      }
    }

    // Create customer
    const customer = await customerPostgresService.createCustomer(normalizedData);
    console.log('[PG-Create] Customer created:', customer.id);

    // Format response for frontend compatibility
    const response = {
      customer: {
        id: customer.id,
        customerId: customer.id,
        customerNumber: customer.customerNumber,
        type: customer.type,
        firstName: customer.firstName,
        lastName: customer.lastName,
        first_name: customer.firstName,
        last_name: customer.lastName,
        display_name: customer.companyName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        companyName: customer.companyName,
        company: customer.companyName,
        email: customer.email,
        mobilePhone: customer.mobilePhone,
        mobile_number: customer.mobilePhone,
        homePhone: customer.homePhone,
        home_number: customer.homePhone,
        workPhone: customer.workPhone,
        work_number: customer.workPhone,
        notes: customer.notes,
        addresses: customer.addresses,
        tenantId: customer.tenantId,
        createdAt: customer.createdAt,
        created_at: customer.createdAt,
        updatedAt: customer.updatedAt,
        updated_at: customer.updatedAt,
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

