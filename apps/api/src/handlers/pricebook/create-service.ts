/**
 * Create Pricebook Service
 * POST /api/pricebook/services
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';
import { z } from 'zod';

const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  unitPrice: z.number().min(0),
  estimatedDuration: z.number().int().min(1).optional(),
  categoryId: z.string().min(1),
  sku: z.string().optional().nullable(),
  unitCost: z.number().min(0).optional(),
  orderIndex: z.number().int().optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-Service] Create handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const body = JSON.parse(event.body || '{}');
    const validated = createServiceSchema.parse(body);

    const service = await pricebookService.createService(validated);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ service }),
    };
  } catch (error: any) {
    console.error('[Pricebook-Service] Error:', error);
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation Error',
          details: error.errors,
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

