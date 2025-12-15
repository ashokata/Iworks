/**
 * List Service Materials
 * GET /api/pricebook/services/{id}/materials
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-Materials] List handler invoked');

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

    // Get service with materials
    const service = await pricebookService.getService(serviceId, ['materials']);

    if (!service) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Service not found' }),
      };
    }

    const materials = service.materials || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ materials }),
    };
  } catch (error: any) {
    console.error('[Pricebook-Materials] Error:', error);
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

