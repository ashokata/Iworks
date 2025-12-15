/**
 * Get Pricebook Industry by slug
 * GET /api/pricebook/industries/{slug}
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-GetIndustry] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const slug = event.pathParameters?.slug;

    if (!slug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing slug parameter' }),
      };
    }

    const industry = await pricebookService.getIndustry(slug);

    if (!industry) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Industry not found' }),
      };
    }

    console.log('[Pricebook-GetIndustry] Found industry:', slug);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ industry }),
    };
  } catch (error: any) {
    console.error('[Pricebook-GetIndustry] Error:', error);
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
