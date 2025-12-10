import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { customerDynamoDBService } from '../../services/customer.dynamodb.service';

const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Tenant-Id',
  };

  try {
    // Get tenant ID from headers
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'];
    
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
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'Invalid JSON in request body' 
        }),
      };
    }

    // Validate with Zod schema
    const validationResult = createCustomerSchema.safeParse(body);
    
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

