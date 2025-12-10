import { APIGatewayProxyHandler } from 'aws-lambda';
import { customerDynamoDBService } from '../../services/customer.dynamodb.service';

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Tenant-Id',
  };

  try {
    console.log('List customers (DynamoDB) called:', event);
    
    // Get tenant ID from headers
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'];
    console.log('Tenant ID:', tenantId);
    
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

    const { search, limit = '50' } = event.queryStringParameters || {};
    console.log('Query params:', { search, limit });

    let customers;
    
    if (search) {
      // Search customers by name/email
      customers = await customerDynamoDBService.searchCustomers(tenantId, search);
    } else {
      // List all customers for tenant
      customers = await customerDynamoDBService.listCustomersByTenant(tenantId, parseInt(limit));
    }

    console.log(`Returning ${customers.length} customers`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        customers,
        count: customers.length,
      }),
    };
  } catch (error) {
    console.error('Error listing customers:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'Failed to list customers',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export const listCustomersDynamoDBHandler = handler;

