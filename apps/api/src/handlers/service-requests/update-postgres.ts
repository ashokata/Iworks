/**
 * PUT /api/service-requests/:id
 * Update a service request
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('[UpdateServiceRequest] Event:', JSON.stringify(event, null, 2));

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

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body = JSON.parse(event.body);
    console.log('[UpdateServiceRequest] ===== RECEIVED UPDATE =====');
    console.log('[UpdateServiceRequest] Full body:', JSON.stringify(body, null, 2));
    console.log('[UpdateServiceRequest] isServiceAddressSameAsPrimary:', body.isServiceAddressSameAsPrimary);
    console.log('[UpdateServiceRequest] serviceAddressId:', body.serviceAddressId);
    console.log('[UpdateServiceRequest] ================================');

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

    // Map CRITICAL to EMERGENCY if provided (for backwards compatibility)
    const updateData: any = {};
    if (body.customerId !== undefined) updateData.customerId = body.customerId;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.problemType !== undefined) updateData.problemType = body.problemType;
    if (body.urgency !== undefined) {
      updateData.urgency = body.urgency === 'CRITICAL' ? 'EMERGENCY' : body.urgency;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
      updateData.statusChangedAt = new Date();
    }
    if (body.assignedToId !== undefined) {
      updateData.assignedToId = body.assignedToId || null;
      if (body.assignedToId) {
        updateData.assignedAt = new Date();
      }
    }
    if (body.serviceAddressId !== undefined) {
      updateData.serviceAddressId = body.serviceAddressId || null;
    }
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.isServiceAddressSameAsPrimary !== undefined) {
      updateData.isServiceAddressSameAsPrimary = body.isServiceAddressSameAsPrimary;
    }

    console.log('[UpdateServiceRequest] ===== UPDATE DATA =====');
    console.log('[UpdateServiceRequest] updateData:', JSON.stringify(updateData, null, 2));
    console.log('[UpdateServiceRequest] ================================');

    // Update service request
    const serviceRequest = await prisma.serviceRequest.update({
      where: { id },
      data: updateData,
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
      },
    });

    console.log('[UpdateServiceRequest] Updated:', serviceRequest.id);

    return {
      statusCode: 200,
      body: JSON.stringify(serviceRequest),
    };
  } catch (error: any) {
    console.error('[UpdateServiceRequest] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to update service request',
        message: error.message,
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
