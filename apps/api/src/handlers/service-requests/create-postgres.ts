/**
 * POST /api/service-requests
 * Create a new service request
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('[CreateServiceRequest] Event:', JSON.stringify(event, null, 2));

  try {
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'];
    
    if (!tenantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Tenant ID is required' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body = JSON.parse(event.body);
    const {
      customerId,
      title,
      description,
      problemType,
      urgency = 'MEDIUM',
      status = 'NEW',
      createdSource = 'WEB',
      serviceAddressId,
      assignedToId,
      estimateId,
      notes,
      useSameAsPrimary,
    } = body;

    // Validate required fields
    if (!customerId || !title || !description || !problemType) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: customerId, title, description, problemType',
        }),
      };
    }

    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId,
      },
    });

    if (!customer) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Customer not found' }),
      };
    }

    // Generate request number
    const lastRequest = await prisma.serviceRequest.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { requestNumber: true },
    });

    let nextNumber = 1;
    if (lastRequest?.requestNumber) {
      const match = lastRequest.requestNumber.match(/SR-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const requestNumber = `SR-${nextNumber.toString().padStart(4, '0')}`;

    // Map CRITICAL to EMERGENCY if provided (for backwards compatibility)
    const mappedUrgency = urgency === 'CRITICAL' ? 'EMERGENCY' : urgency;

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        tenantId,
        customerId,
        requestNumber,
        title,
        description,
        problemType,
        urgency: mappedUrgency,
        status,
        createdSource,
        serviceAddressId: serviceAddressId || null,
        assignedToId: assignedToId || null,
        estimateId: estimateId || null,
        notes: notes || null,
        useSameAsPrimary: useSameAsPrimary || false,
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
      },
    });

    console.log('[CreateServiceRequest] Created:', serviceRequest.id);

    return {
      statusCode: 201,
      body: JSON.stringify(serviceRequest),
    };
  } catch (error: any) {
    console.error('[CreateServiceRequest] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create service request',
        message: error.message,
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
