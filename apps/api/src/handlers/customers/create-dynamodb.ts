import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { customerDynamoDBService } from '../../services/customer.dynamodb.service';

const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required').optional().default(''),
  email: z.string().email('Valid email is required').optional().default(''),
  phone: z.string().min(1, 'Phone is required').optional().default(''),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

// Transform snake_case input to camelCase (frontend compatibility)
function normalizeCustomerInput(body: any): any {
  return {
    firstName: body.firstName || body.first_name || '',
    lastName: body.lastName || body.last_name || '',
    email: body.email || '',
    phone: body.phone || body.mobile_number || body.home_number || body.work_number || '',
    address: body.address || '',
    city: body.city || '',
    state: body.state || '',
    zipCode: body.zipCode || body.zip_code || '',
    notes: body.notes || '',
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Tenant-Id',
  };

  // #region agent log
  console.log('[DEBUG-H1] Raw event body:', event.body);
  console.log('[DEBUG-H1] Event headers:', JSON.stringify(event.headers));
  // #endregion

  try {
    // Get tenant ID from headers
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'];
    
    // #region agent log
    console.log('[DEBUG-H2] Tenant ID extracted:', tenantId);
    // #endregion
    
    if (!tenantId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Missing tenant ID. Please provide X-Tenant-Id header.' 
        }),
      };
    }

    // Parse and validate request body
    if (!event.body) {
      // #region agent log
      console.log('[DEBUG-H3] No body in request');
      // #endregion
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'Request body is required' 
        }),
      };
    }

    let body;
    try {
      body = JSON.parse(event.body);
      // #region agent log
      console.log('[DEBUG-H4] Parsed body:', JSON.stringify(body));
      // #endregion
    } catch {
      // #region agent log
      console.log('[DEBUG-H4] JSON parse failed');
      // #endregion
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'Invalid JSON in request body' 
        }),
      };
    }

    // Normalize input (support both snake_case and camelCase)
    const normalizedBody = normalizeCustomerInput(body);
    // #region agent log
    console.log('[DEBUG-H5] Normalized body:', JSON.stringify(normalizedBody));
    // #endregion

    // Validate with Zod schema
    const validationResult = createCustomerSchema.safeParse(normalizedBody);
    
    // #region agent log
    console.log('[DEBUG-H6] Validation success:', validationResult.success);
    if (!validationResult.success) {
      console.log('[DEBUG-H6] Validation errors:', JSON.stringify(validationResult.error.errors));
    }
    // #endregion
    
    if (!validationResult.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Validation Error',
          message: 'Invalid customer data',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        }),
      };
    }

    const customerData = validationResult.data;

    // Create customer in DynamoDB
    const customer = await customerDynamoDBService.createCustomer({
      tenantId,
      ...customerData,
    });

    console.log('Customer created successfully:', customer.customerId);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Customer created successfully',
        customer,
      }),
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'Failed to create customer',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export const createCustomerDynamoDBHandler = handler;

