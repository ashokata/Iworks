/**
 * GET /api/service-requests/:id
 * Get a service request by ID
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('[GetServiceRequest] Event:', JSON.stringify(event, null, 2));

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

    const serviceRequest = await prisma.serviceRequest.findFirst({
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
            mobilePhone: true,
            email: true,
            verificationStatus: true,
          },
        },
        serviceAddress: {
          select: {
            street: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            employeeNumber: true,
            jobTitle: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
          },
        },
      },
    });

    if (!serviceRequest) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Service request not found' }),
      };
    }

    // Get voice call log if exists
    let voiceCallLog = null;
    if (serviceRequest.voiceCallId) {
      voiceCallLog = await prisma.voiceCallLog.findUnique({
        where: { id: serviceRequest.voiceCallId },
        select: {
          vapiCallId: true,
          callerNumber: true,
          duration: true,
          createdAt: true,
        },
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...serviceRequest,
        voiceCallLog,
      }),
    };
  } catch (error: any) {
    console.error('[GetServiceRequest] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to get service request',
        message: error.message,
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
