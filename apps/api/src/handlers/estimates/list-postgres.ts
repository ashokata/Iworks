/**
 * GET /api/estimates
 * List all estimates
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('[ListEstimates] Event:', JSON.stringify(event, null, 2));

  try {
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'];
    
    if (!tenantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Tenant ID is required' }),
      };
    }

    const estimates = await prisma.estimate.findMany({
      where: {
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('[ListEstimates] Found:', estimates.length);

    return {
      statusCode: 200,
      body: JSON.stringify(estimates),
    };
  } catch (error: any) {
    console.error('[ListEstimates] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to retrieve estimates',
        message: error.message,
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
