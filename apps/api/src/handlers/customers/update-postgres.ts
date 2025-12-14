import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { customerPostgresService } from '../../services/customer.postgres.service';

// Validation schema - accepts both camelCase and snake_case
const updateCustomerSchema = z.object({
  type: z.string().optional(), // Accept any string, normalize later
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  displayName: z.string().optional(),
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
  jobTitle: z.string().optional(),
  job_title: z.string().optional(),
  notes: z.string().optional(),
  doNotService: z.boolean().optional(),
  doNotServiceReason: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
  notifications_enabled: z.boolean().optional(),
  isContractor: z.boolean().optional(),
  is_contractor: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  archived: z.boolean().optional(),
  verificationStatus: z.enum(['VERIFIED', 'UNVERIFIED', 'PENDING']).optional(),
  verification_status: z.enum(['VERIFIED', 'UNVERIFIED', 'PENDING']).optional(),
}).passthrough(); // Allow additional fields

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[PG-Update] Handler invoked');
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    // Get tenant ID from header
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'] || 'default-tenant';
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

    // Normalize type (homeowner -> RESIDENTIAL, business -> COMMERCIAL)
    let customerType = body.type;
    if (customerType) {
      customerType = customerType.toUpperCase();
      if (customerType === 'HOMEOWNER') customerType = 'RESIDENTIAL';
      if (customerType === 'BUSINESS') customerType = 'COMMERCIAL';
    }

    // Normalize field names
    const normalizedData = {
      type: customerType as 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR' | undefined,
      firstName,
      lastName,
      companyName: body.companyName || body.company_name || body.company,
      email: body.email || undefined,
      mobilePhone: body.mobilePhone || body.mobile_number || body.phone,
      homePhone: body.homePhone || body.home_number,
      workPhone: body.workPhone || body.work_number,
      notes: body.notes,
      doNotService: body.doNotService,
      doNotServiceReason: body.doNotServiceReason,
      notificationsEnabled: body.notificationsEnabled ?? body.notifications_enabled,
      verificationStatus: body.verificationStatus || body.verification_status,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(normalizedData).filter(([_, v]) => v !== undefined)
    );

    console.log('[PG-Update] Normalized data:', JSON.stringify(cleanData));

    // Update customer
    const customer = await customerPostgresService.updateCustomer(tenantId, customerId, cleanData);

    if (!customer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Customer not found' }),
      };
    }

    console.log('[PG-Update] Customer updated:', customer.id);

    // Format response for frontend compatibility
    const primaryAddress = customer.addresses?.find(a => a.isPrimary) || customer.addresses?.[0];
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
        address: primaryAddress ? {
          street: primaryAddress.street,
          city: primaryAddress.city,
          state: primaryAddress.state,
          zip: primaryAddress.zip,
        } : null,
        addresses: customer.addresses,
        verificationStatus: (customer as any).verificationStatus || 'VERIFIED',
        verification_status: (customer as any).verificationStatus || 'VERIFIED',
        createdSource: (customer as any).createdSource || 'WEB',
        created_source: (customer as any).createdSource || 'WEB',
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

