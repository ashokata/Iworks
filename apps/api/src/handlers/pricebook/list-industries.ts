/**
 * List Pricebook Industries
 * GET /api/pricebook/industries
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-Industries] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const industries = await pricebookService.getIndustries();

    console.log('[Pricebook-Industries] Found industries:', industries.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        industries,
        total: industries.length,
      }),
    };
  } catch (error: any) {
    console.error('[Pricebook-Industries] Error:', error);
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
