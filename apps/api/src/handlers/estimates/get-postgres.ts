/**
 * GET /api/estimates/:id
 * Get estimate by ID
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('[GetEstimate] Event:', JSON.stringify(event, null, 2));

  try {
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'];
    
    if (!tenantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Tenant ID is required' }),
      };
    }

    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Estimate ID is required' }),
      };
    }

    const estimate = await prisma.estimate.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            mobilePhone: true,
          },
        },
        address: {
          select: {
            street: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        lineItems: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!estimate) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Estimate not found' }),
      };
    }

    console.log('[GetEstimate] Found:', estimate.id);

    return {
      statusCode: 200,
      body: JSON.stringify(estimate),
    };
  } catch (error: any) {
    console.error('[GetEstimate] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to retrieve estimate',
        message: error.message,
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
