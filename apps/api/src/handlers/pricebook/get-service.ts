/**
 * Get Pricebook Service
 * GET /api/pricebook/services/{id}
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-Service] Get handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const serviceId = event.pathParameters?.id;
    if (!serviceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Service ID is required' }),
      };
    }

    const params = event.queryStringParameters || {};
    const expand = params.expand ? params.expand.split(',') as ('materials' | 'category')[] : [];

    const service = await pricebookService.getService(serviceId, expand);

    if (!service) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Service not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ service }),
    };
  } catch (error: any) {
    console.error('[Pricebook-Service] Error:', error);
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

