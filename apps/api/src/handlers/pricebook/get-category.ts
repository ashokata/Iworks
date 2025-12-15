/**
 * Get Pricebook Category
 * GET /api/pricebook/categories/{id}
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-GetCategory] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing id parameter' }),
      };
    }

    const category = await pricebookService.getCategory(id);

    if (!category) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Category not found' }),
      };
    }

    console.log('[Pricebook-GetCategory] Found category:', id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ category }),
    };
  } catch (error: any) {
    console.error('[Pricebook-GetCategory] Error:', error);
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
