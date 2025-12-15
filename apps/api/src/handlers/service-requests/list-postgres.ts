/**
 * List Service Requests (PostgreSQL)
 * GET /api/service-requests
 *
 * Query parameters:
 * - createdSource: Filter by source (VOICE_AGENT, WEB, API)
 * - status: Filter by status
 * - page: Page number (default: 1)
 * - pageSize: Page size (default: 50)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '../../services/prisma.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[ServiceRequests-List] Handler invoked');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'] || 'local-tenant';
    const params = event.queryStringParameters || {};

    // Parse pagination
    const page = params.page ? parseInt(params.page, 10) : 1;
    const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 50;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {
      tenantId,
    };

    if (params.createdSource) {
      where.createdSource = params.createdSource;
    }

    if (params.status) {
      where.status = params.status;
    }

    // Get total count
    const total = await getPrismaClient().serviceRequest.count({ where });

    // Get service requests with related data
    const serviceRequests = await getPrismaClient().serviceRequest.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    // Fetch voice call logs for requests that have voiceCallId
    const voiceCallIds = serviceRequests
      .filter((sr) => sr.voiceCallId)
      .map((sr) => sr.voiceCallId!);

    const voiceCallLogs = voiceCallIds.length > 0
      ? await getPrismaClient().voiceCallLog.findMany({
          where: {
            vapiCallId: { in: voiceCallIds },
          },
          select: {
            vapiCallId: true,
            callerNumber: true,
            duration: true,
            createdAt: true,
          },
        })
      : [];

    // Create a map for quick lookup
    const voiceCallLogMap = new Map(
      voiceCallLogs.map((log) => [log.vapiCallId, log])
    );

    // Attach voice call logs to service requests
    const serviceRequestsWithCallLogs = serviceRequests.map((sr) => ({
      ...sr,
      voiceCallLog: sr.voiceCallId ? voiceCallLogMap.get(sr.voiceCallId) || null : null,
    }));

    console.log('[ServiceRequests-List] Found requests:', total);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        serviceRequests: serviceRequestsWithCallLogs,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      }),
    };
  } catch (error: any) {
    console.error('[ServiceRequests-List] Error:', error);
    console.error('[ServiceRequests-List] Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message || 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
    };
  }
};

