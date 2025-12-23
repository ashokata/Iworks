/**
 * DELETE /api/service-requests/:id
 * Delete a service request
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('[DeleteServiceRequest] Event:', JSON.stringify(event, null, 2));

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
        body: JSON.stringify({ error: 'Service request ID is required' }),
      };
    }

    // Verify service request exists and belongs to tenant
    const existing = await prisma.serviceRequest.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existing) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Service request not found' }),
      };
    }

    // Prevent deletion of Voice Agent service requests
    if (existing.createdSource === 'VOICE_AGENT') {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Voice Agent service requests cannot be deleted' }),
      };
    }

    // Delete the service request
    await prisma.serviceRequest.delete({
      where: { id },
    });

    console.log('[DeleteServiceRequest] Deleted:', id);

    return {
      statusCode: 204,
      body: JSON.stringify({ message: 'Service request deleted successfully' }),
    };
  } catch (error: any) {
    console.error('[DeleteServiceRequest] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to delete service request',
        message: error.message,
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
