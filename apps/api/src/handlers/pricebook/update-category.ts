/**
 * Update Pricebook Category
 * PUT /api/pricebook/categories/{id}
 *
 * Request body:
 * {
 *   "name": "Updated Name" (optional),
 *   "description": "Updated Description" (optional)
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-UpdateCategory] Handler invoked');

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

    const body = event.body ? JSON.parse(event.body) : {};
    const { name, description } = body;

    console.log('[Pricebook-UpdateCategory] Updating category:', id);

    const category = await pricebookService.updateCategory(id, {
      name,
      description,
    });

    console.log('[Pricebook-UpdateCategory] Category updated successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        category,
      }),
    };
  } catch (error: any) {
    console.error('[Pricebook-UpdateCategory] Error:', error);

    if (error.code === 'P2025') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Not Found',
          message: 'Category not found',
        }),
      };
    }

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
