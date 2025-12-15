/**
 * Update Service Material
 * PUT /api/pricebook/materials/{id}
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';
import { z } from 'zod';

const updateMaterialSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  unitPrice: z.number().min(0).optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().min(1).optional(),
  sku: z.string().optional().nullable(),
}).passthrough();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-Material] Update handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const materialId = event.pathParameters?.id;
    if (!materialId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Material ID is required' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const validated = updateMaterialSchema.parse(body);

    const material = await pricebookService.updateServiceMaterial(materialId, validated);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ material }),
    };
  } catch (error: any) {
    console.error('[Pricebook-Material] Error:', error);
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

