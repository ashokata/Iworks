/**
 * DELETE /api/estimates/:id
 * Delete an estimate
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('[DeleteEstimate] Event:', JSON.stringify(event, null, 2));

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

    // Verify estimate exists
    const existing = await prisma.estimate.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Estimate not found' }),
      };
    }

    // Check if estimate is linked to any service requests
    const linkedServiceRequests = await prisma.serviceRequest.count({
      where: { estimateId: id },
    });

    if (linkedServiceRequests > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Cannot delete estimate',
          message: `This estimate is linked to ${linkedServiceRequests} service request(s). Please unlink them first.`,
        }),
      };
    }

    // Check if estimate is linked to any jobs
    const linkedJobs = await prisma.job.count({
      where: { estimateId: id },
    });

    if (linkedJobs > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Cannot delete estimate',
          message: `This estimate is linked to ${linkedJobs} job(s). Please unlink them first.`,
        }),
      };
    }

    // Delete line items first (cascade)
    await prisma.estimateLineItem.deleteMany({
      where: {
        option: {
          estimateId: id,
        },
      },
    });

    // Delete options
    await prisma.estimateOption.deleteMany({
      where: { estimateId: id },
    });

    // Delete estimate
    await prisma.estimate.delete({
      where: { id },
    });

    console.log('[DeleteEstimate] Deleted:', id);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Estimate deleted successfully' }),
    };
  } catch (error: any) {
    console.error('[DeleteEstimate] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to delete estimate',
        message: error.message,
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
