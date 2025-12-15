/**
 * Create Pricebook Category
 * POST /api/pricebook/categories
 *
 * Request body:
 * {
 *   "industryId": "ind-123",
 *   "name": "Installation",
 *   "description": "Installation services",
 *   "parentId": "parent-456" (optional)
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-CreateCategory] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { industryId, name, description, parentId } = body;

    if (!industryId || !name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: industryId and name are required'
        }),
      };
    }

    console.log('[Pricebook-CreateCategory] Creating category:', { industryId, name });

    const category = await pricebookService.createCategory({
      industryId,
      name,
      description,
      parentId,
    });

    console.log('[Pricebook-CreateCategory] Category created:', category.id);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        category,
      }),
    };
  } catch (error: any) {
    console.error('[Pricebook-CreateCategory] Error:', error);
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
