/**
 * VAPI Webhook Handler for AWS Lambda
 * Handles incoming webhooks from VAPI during voice calls
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handleVapiWebhook } from '../../services/vapi/vapi.webhooks';
import { getPrismaClient } from '../../services/prisma.service';

// Mock Express request/response for webhook handler
interface MockRequest {
  body: any;
  headers: Record<string, string>;
  params: Record<string, string>;
}

interface MockResponse {
  statusCode: number;
  body: any;
  status: (code: number) => MockResponse;
  json: (data: any) => void;
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  // Don't wait for empty event loop (keeps Lambda warm)
  context.callbackWaitsForEmptyEventLoop = false;

  console.log('[VAPI Webhook] Received event:', {
    path: event.path,
    httpMethod: event.httpMethod,
    pathParameters: event.pathParameters,
  });

  try {
    // Extract tenant ID from path
    const tenantId = event.pathParameters?.tenantId;
    
    if (!tenantId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing tenantId in path' }),
      };
    }

    // Verify tenant exists
    const prisma = getPrismaClient();
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      console.error('[VAPI Webhook] Tenant not found:', tenantId);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Tenant not found' }),
      };
    }

    // Parse body
    let body: any;
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON body' }),
      };
    }

    // Create mock request/response for the webhook handler
    let responseData: any = { success: true };
    let responseStatus = 200;

    const mockReq: MockRequest = {
      body,
      headers: event.headers as Record<string, string>,
      params: { tenantId },
    };

    const mockRes: MockResponse = {
      statusCode: 200,
      body: null,
      status: function(code: number) {
        this.statusCode = code;
        responseStatus = code;
        return this;
      },
      json: function(data: any) {
        this.body = data;
        responseData = data;
      },
    };

    // Handle the webhook
    await handleVapiWebhook(mockReq as any, mockRes as any, tenantId);

    return {
      statusCode: responseStatus,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(responseData),
    };

  } catch (error: any) {
    console.error('[VAPI Webhook] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

