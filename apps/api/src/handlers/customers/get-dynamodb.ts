import { APIGatewayProxyHandler } from 'aws-lambda';
import { customerDynamoDBService } from '../../services/customer.dynamodb.service';

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Tenant-Id',
  };

  try {
    console.log('Get customer (DynamoDB) called:', event);
    
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

    // Get customer ID from path parameters
    const customerId = event.pathParameters?.customerId;
    
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

    console.log('Looking up customer:', customerId);

    const customer = await customerDynamoDBService.getCustomer(customerId);

    if (!customer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Not Found',
          message: `Customer with ID ${customerId} not found` 
        }),
      };
    }

    // Verify tenant ownership
    if (customer.tenantId !== tenantId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'Forbidden',
          message: 'You do not have access to this customer' 
        }),
      };
    }

    console.log('Customer found:', customer.customerId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ customer }),
    };
  } catch (error) {
    console.error('Error getting customer:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'Failed to get customer',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export const getCustomerDynamoDBHandler = handler;

