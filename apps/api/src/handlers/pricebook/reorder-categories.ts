/**
 * Reorder Pricebook Categories
 * POST /api/pricebook/categories/reorder
 *
 * Request body:
 * {
 *   "industryId": "ind-123",
 *   "categoryIds": ["cat-1", "cat-2", "cat-3"]
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-ReorderCategories] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { industryId, categoryIds } = body;

    if (!industryId || !categoryIds || !Array.isArray(categoryIds)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: industryId and categoryIds (array) are required'
        }),
      };
    }

    console.log('[Pricebook-ReorderCategories] Reordering', categoryIds.length, 'categories for industry:', industryId);

    await pricebookService.reorderCategories(industryId, categoryIds);

    console.log('[Pricebook-ReorderCategories] Categories reordered successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Categories reordered successfully',
      }),
    };
  } catch (error: any) {
    console.error('[Pricebook-ReorderCategories] Error:', error);
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
