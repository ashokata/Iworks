/**
 * Update Pricebook Service
 * PUT /api/pricebook/services/{id}
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';
import { z } from 'zod';

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  unitPrice: z.number().min(0).optional(),
  estimatedDuration: z.number().int().min(1).optional(),
  sku: z.string().optional().nullable(),
  unitCost: z.number().min(0).optional(),
  orderIndex: z.number().int().optional(),
}).passthrough();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-Service] Update handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const serviceId = event.pathParameters?.id;
    if (!serviceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Service ID is required' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const validated = updateServiceSchema.parse(body);

    const service = await pricebookService.updateService(serviceId, validated);

    return {
      statusCode: 200,
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

