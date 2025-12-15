/**
 * List Pricebook Categories
 * GET /api/pricebook/categories
 *
 * Query parameters:
 * - industryId: Filter by industry ID
 * - parentId: Filter by parent category ID
 * - page: Page number (default: 1)
 * - pageSize: Page size (default: 50)
 * - sortBy: Sort field (default: orderIndex)
 * - sortOrder: asc or desc (default: asc)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-Categories] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const params = event.queryStringParameters || {};

    // Parse pagination
    const page = params.page ? parseInt(params.page, 10) : 1;
    const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 50;

    // Build service params
    const serviceParams: any = {
      page,
      pageSize,
      sortBy: params.sortBy || 'orderIndex',
      sortOrder: (params.sortOrder as 'asc' | 'desc') || 'asc',
    };

    if (params.industryId) {
      serviceParams.industryId = params.industryId;
    }

    if (params.parentId) {
      serviceParams.parentId = params.parentId;
    }

    console.log('[Pricebook-Categories] Fetching categories with params:', serviceParams);

    const result = await pricebookService.getCategories(serviceParams);

    console.log('[Pricebook-Categories] Found categories:', result.total);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('[Pricebook-Categories] Error:', error);
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
