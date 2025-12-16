/**
 * LLM Chat Handler - AWS Lambda handler for AI chat with function calling
 * Integrates Bedrock Claude AI with DynamoDB operations
 */

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { bedrockLLMService, Message } from '../../services/bedrock-llm.service';
import { llmFunctionExecutor } from '../../services/llm-function-executor';

// Types
interface ChatRequest {
  query: string;
  userId?: string;
  tenantId?: string;
  history?: Message[];
  context?: Record<string, any>;
}

interface ChatResponse {
  conversationId: string;
  reply: string;
  metadata?: {
    tool?: string;
    toolResult?: any;
    model?: string;
    tokensUsed?: any;
    latencyMs?: number;
  };
  suggestedActions?: Array<{
    label: string;
    action: string;
    params?: Record<string, any>;
  }>;
  timestamp: string;
}

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Tenant-Id,X-User-Id',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

/**
 * Sanitize user input
 */
function sanitizeInput(input: string): string {
  // Remove potential injection patterns
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
    .substring(0, 10000); // Limit input length
}

/**
 * Generate suggested follow-up actions based on the function executed
 */
function generateSuggestedActions(functionName: string, result: any): Array<{ label: string; action: string; params?: Record<string, any> }> {
  const actions: Array<{ label: string; action: string; params?: Record<string, any> }> = [];

  if (functionName === 'createCustomer' && result.data?.customerId) {
    actions.push({
      label: 'Create Job for Customer',
      action: 'createJob',
      params: { customerId: result.data.customerId },
    });
    actions.push({
      label: 'View Customer Details',
      action: 'viewCustomer',
      params: { customerId: result.data.customerId },
    });
  }

  if (functionName === 'createJob' && result.data?.jobId) {
    actions.push({
      label: 'View Job Status',
      action: 'getJobStatus',
      params: { jobId: result.data.jobId },
    });
  }

  if (functionName === 'searchCustomer' && result.data?.customers?.length > 0) {
    actions.push({
      label: 'Create Job for Customer',
      action: 'createJob',
      params: { customerId: result.data.customers[0].customerId },
    });
  }

  return actions;
}

/**
 * Main Lambda handler for LLM chat
 */
export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = uuidv4();
  const startTime = Date.now();

  console.log('[LLM Chat] Request received', {
    requestId,
    path: event.path,
    method: event.httpMethod,
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Request body is required',
          requestId,
        }),
      };
    }

    let body: ChatRequest;
    try {
      body = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON in request body',
          requestId,
        }),
      };
    }

    // Validate required fields
    if (!body.query || typeof body.query !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Validation Error',
          message: 'Query is required and must be a string',
          requestId,
        }),
      };
    }

    // Get tenant ID from header or body - REQUIRED for tenant isolation
    let tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'] || event.headers['X-Tenant-ID'] || body.tenantId;
    
    // Normalize tenant ID: remove whitespace, take first value if comma-separated
    if (tenantId) {
      tenantId = String(tenantId).trim().split(',')[0].trim();
    }
    
    if (!tenantId) {
      console.error('[LLM Chat] ❌ Missing tenant ID in request');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Tenant ID is required',
          message: 'Please ensure you are logged in and your session is valid',
          requestId,
        }),
      };
    }
    
    // Validate tenant ID format (should be a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('[LLM Chat] ❌ Invalid tenant ID format', { tenantId });
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid Tenant ID format',
          message: `The tenant ID '${tenantId}' is not in a valid format. Please log out and log back in.`,
          requestId,
        }),
      };
    }
    
    const userId = event.headers['x-user-id'] || event.headers['X-User-Id'] || body.userId || 'anonymous';

    // Sanitize input
    const sanitizedQuery = sanitizeInput(body.query);

    console.log('[LLM Chat] Processing query', {
      requestId,
      tenantId,
      userId,
      queryLength: sanitizedQuery.length,
      historyLength: body.history?.length || 0,
      headers: {
        'x-tenant-id': event.headers['x-tenant-id'],
        'X-Tenant-Id': event.headers['X-Tenant-Id'],
        'X-Tenant-ID': event.headers['X-Tenant-ID'],
      },
      bodyTenantId: body.tenantId,
    });

    // Build messages for Bedrock
    const messages: Message[] = [
      ...(body.history || []),
      { role: 'user', content: sanitizedQuery },
    ];

    // Call Bedrock for function decision
    const bedrockResponse = await bedrockLLMService.invokeForFunctionDecision(messages, tenantId);

    // Handle tool use (function call)
    if (bedrockResponse.tool_use) {
      const toolUse = bedrockResponse.tool_use;

      console.log('[LLM Chat] LLM requested function call', {
        requestId,
        functionName: toolUse.name,
        params: toolUse.input,
      });

      // Execute the function
      const functionResult = await llmFunctionExecutor.executeFunction(
        toolUse.name,
        toolUse.input,
        userId,
        tenantId
      );

      console.log('[LLM Chat] Function executed', {
        requestId,
        functionName: toolUse.name,
        status: functionResult.status,
        tenantId,
        hasError: functionResult.status === 'error',
      });

      // If function execution failed, return error immediately without calling Bedrock
      if (functionResult.status === 'error') {
        const errorMessage = functionResult.error?.message || 'An error occurred while processing your request';
        const errorDetails = functionResult.error?.details;
        
        console.error('[LLM Chat] Function execution failed', {
          requestId,
          functionName: toolUse.name,
          error: errorMessage,
          details: errorDetails,
          tenantId,
        });

        const latency = Date.now() - startTime;
        
        // Clean up error message - remove duplicate tenant ID if present
        let cleanErrorMessage = errorMessage;
        if (errorDetails?.tenantId && errorMessage.includes(errorDetails.tenantId)) {
          // If tenant ID is already in the error message, don't add it again
          cleanErrorMessage = errorMessage;
        } else if (errorDetails?.tenantId) {
          cleanErrorMessage = `${errorMessage} (Tenant ID: ${errorDetails.tenantId})`;
        }
        
        return {
          statusCode: 200, // Still return 200, but with error in response
          headers: corsHeaders,
          body: JSON.stringify({
            conversationId: requestId,
            reply: `I encountered an error: ${cleanErrorMessage}. Please check your tenant configuration and try again.`,
            metadata: {
              tool: toolUse.name,
              toolResult: functionResult,
              model: 'claude-3.5-sonnet',
              error: true,
              latencyMs: latency,
            },
            timestamp: new Date().toISOString(),
          }),
        };
      }

      // Get final answer from Bedrock (summarize the result)
      const finalResponse = await bedrockLLMService.invokeForFinalAnswer(
        sanitizedQuery,
        toolUse.name,
        functionResult,
        body.history || [],
        tenantId
      );

      const latency = Date.now() - startTime;

      const response: ChatResponse = {
        conversationId: requestId,
        reply: finalResponse.content || functionResult.data?.message || 'Action completed successfully.',
        metadata: {
          tool: toolUse.name,
          toolResult: functionResult,
          model: 'claude-3.5-sonnet',
          tokensUsed: bedrockResponse.usage,
          latencyMs: latency,
        },
        suggestedActions: generateSuggestedActions(toolUse.name, functionResult),
        timestamp: new Date().toISOString(),
      };

      console.log('[LLM Chat] Request completed with function call', {
        requestId,
        latencyMs: latency,
        tool: toolUse.name,
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(response),
      };
    }

    // Handle direct response (no function call)
    const latency = Date.now() - startTime;

    const response: ChatResponse = {
      conversationId: requestId,
      reply: bedrockResponse.content || 'I can help you with that. What would you like to do?',
      metadata: {
        model: 'claude-3.5-sonnet',
        tokensUsed: bedrockResponse.usage,
        latencyMs: latency,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('[LLM Chat] Request completed with direct response', {
      requestId,
      latencyMs: latency,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    console.error('[LLM Chat] Request failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      latencyMs: latency,
    });

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to process chat request',
        details: error.message,
        requestId,
      }),
    };
  }
};

export const llmChatHandler = handler;

