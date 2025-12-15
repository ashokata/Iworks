/**
 * List Pricebook Services
 * GET /api/pricebook/services
 *
 * Query parameters:
 * - categoryId: Filter by category ID
 * - page: Page number (default: 1)
 * - pageSize: Page size (default: 50)
 * - sortBy: Sort field (default: orderIndex)
 * - sortOrder: asc or desc (default: asc)
 * - expand: Comma-separated list (materials, category)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-Services] Handler invoked');

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

    // Parse expand
    const expand = params.expand ? params.expand.split(',') : [];

    // Build service params
    const serviceParams: any = {
      page,
      pageSize,
      sortBy: params.sortBy || 'orderIndex',
      sortOrder: (params.sortOrder as 'asc' | 'desc') || 'asc',
      expand,
    };

    if (params.categoryId) {
      serviceParams.categoryId = params.categoryId;
    }

    console.log('[Pricebook-Services] Fetching services with params:', serviceParams);

    const result = await pricebookService.getServices(serviceParams);

    console.log('[Pricebook-Services] Found services:', result.total);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('[Pricebook-Services] Error:', error);
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
