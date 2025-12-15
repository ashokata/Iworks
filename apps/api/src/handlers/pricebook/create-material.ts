/**
 * Create Service Material
 * POST /api/pricebook/materials
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { pricebookService } from '../../services/pricebook.postgres.service';
import { z } from 'zod';

const createMaterialSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  unitPrice: z.number().min(0),
  quantity: z.number().min(0),
  unit: z.string().min(1),
  serviceId: z.string().min(1),
  sku: z.string().optional().nullable(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Pricebook-Material] Create handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const body = JSON.parse(event.body || '{}');
    const validated = createMaterialSchema.parse(body);

    const material = await pricebookService.addServiceMaterial(validated.serviceId, {
      name: validated.name,
      description: validated.description,
      unitPrice: validated.unitPrice,
      quantity: validated.quantity,
      unit: validated.unit,
      sku: validated.sku,
    });

    return {
      statusCode: 201,
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

