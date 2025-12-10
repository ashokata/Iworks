import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { customerDynamoDBService } from '../../services/customer.dynamodb.service';

const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

// Transform snake_case input to camelCase (frontend compatibility)
function normalizeCustomerInput(body: any): any {
  const normalized: any = {};
  
  // Handle display_name by splitting into firstName and lastName
  if (body.display_name) {
    const parts = body.display_name.trim().split(/\s+/);
    normalized.firstName = parts[0] || '';
    normalized.lastName = parts.slice(1).join(' ') || '';
  }
  
  // Direct firstName/lastName take precedence
  if (body.firstName || body.first_name) {
    normalized.firstName = body.firstName || body.first_name;
  }
  if (body.lastName !== undefined || body.last_name !== undefined) {
    normalized.lastName = body.lastName || body.last_name || '';
  }
  if (body.email !== undefined) {
    normalized.email = body.email || '';
  }
  if (body.phone || body.mobile_number || body.home_number || body.work_number) {
    normalized.phone = body.phone || body.mobile_number || body.home_number || body.work_number || '';
  }
  if (body.address !== undefined) {
    normalized.address = body.address || '';
  }
  if (body.city !== undefined) {
    normalized.city = body.city || '';
  }
  if (body.state !== undefined) {
    normalized.state = body.state || '';
  }
  if (body.zipCode !== undefined || body.zip_code !== undefined) {
    normalized.zipCode = body.zipCode || body.zip_code || '';
  }
  if (body.notes !== undefined) {
    normalized.notes = body.notes || '';
  }
  
  return normalized;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Tenant-Id',
  };

  // #region agent log
  console.log('[UPD-L1] Lambda invoked', JSON.stringify({ path: event.path, pathParams: event.pathParameters, headers: event.headers, body: event.body?.substring(0, 500) }));
  // #endregion

  try {
    // Get tenant ID from headers
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'];
    
    // #region agent log
    console.log('[UPD-L2] TenantId extracted', JSON.stringify({ tenantId, headerKeys: Object.keys(event.headers) }));
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

    // Get customer ID from path parameters
    const customerId = event.pathParameters?.customerId;
    
    // #region agent log
    console.log('[UPD-L3] CustomerId from path', JSON.stringify({ customerId, pathParameters: event.pathParameters }));
    // #endregion
    
    if (!customerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'Customer ID is required in the path' 
        }),
      };
    }

    // Parse request body
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

    // #region agent log
    console.log('[UPD-L4] Parsed body', JSON.stringify({ body }));
    // #endregion

    // First, verify the customer exists and belongs to this tenant
    const existingCustomer = await customerDynamoDBService.getCustomer(customerId);
    
    // #region agent log
    console.log('[UPD-L5] Existing customer lookup', JSON.stringify({ customerId, found: !!existingCustomer, existingCustomer }));
    // #endregion
    
    if (!existingCustomer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Not Found',
          message: `Customer with ID ${customerId} not found` 
        }),
      };
    }

    if (existingCustomer.tenantId !== tenantId) {
      // #region agent log
      console.log('[UPD-L6] Tenant mismatch', JSON.stringify({ existingTenantId: existingCustomer.tenantId, requestTenantId: tenantId }));
      // #endregion
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'Forbidden',
          message: 'You do not have access to this customer' 
        }),
      };
    }

    // Normalize and validate input
    const normalizedBody = normalizeCustomerInput(body);
    
    // #region agent log
    console.log('[UPD-L7] Normalized body', JSON.stringify({ normalizedBody, originalBody: body }));
    // #endregion

    const validationResult = updateCustomerSchema.safeParse(normalizedBody);
    
    // #region agent log
    console.log('[UPD-L8] Validation result', JSON.stringify({ success: validationResult.success, data: validationResult.success ? validationResult.data : null, errors: !validationResult.success ? validationResult.error.errors : null }));
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

    // #region agent log
    console.log('[UPD-L9] About to call updateCustomer', JSON.stringify({ customerId, dataToUpdate: validationResult.data }));
    // #endregion

    // Update customer in DynamoDB
    const updatedCustomer = await customerDynamoDBService.updateCustomer(customerId, validationResult.data);

    // #region agent log
    console.log('[UPD-L10] Update result', JSON.stringify({ customerId, updatedCustomer }));
    // #endregion

    if (!updatedCustomer) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Internal Server Error',
          message: 'Failed to update customer' 
        }),
      };
    }

    console.log('Customer updated successfully:', customerId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Customer updated successfully',
        customer: updatedCustomer,
      }),
    };
  } catch (error) {
    // #region agent log
    console.error('[UPD-L-ERR] Exception caught', JSON.stringify({ error: error instanceof Error ? { message: error.message, stack: error.stack } : error }));
    // #endregion
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'Failed to update customer',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export const updateCustomerDynamoDBHandler = handler;

