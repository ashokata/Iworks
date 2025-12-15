/**
 * Import Pricebook to Tenant Catalog
 * POST /api/pricebook/import
 *
 * Request body:
 * {
 *   "industrySlug": "hvac"
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-Import] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    // Extract tenant ID from headers
    const tenantId = event.headers['X-Tenant-Id'] || event.headers['x-tenant-id'];

    if (!tenantId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing X-Tenant-Id header' }),
      };
    }

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { industrySlug } = body;

    if (!industrySlug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing industrySlug in request body' }),
      };
    }

    console.log('[Pricebook-Import] Importing pricebook:', { tenantId, industrySlug });

    const result = await pricebookService.importPricebook({
      tenantId,
      industrySlug,
    });

    console.log('[Pricebook-Import] Import successful:', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        result,
      }),
    };
  } catch (error: any) {
    console.error('[Pricebook-Import] Error:', error);
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
