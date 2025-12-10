import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * AI Chat API endpoint - Connected to LLM Gateway
 * Routes messages to the AWS Bedrock LLM Gateway
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user and tenant info from headers or context
    const userId = request.headers.get('x-user-id') || context?.userId || 'user-' + Date.now();
    const tenantId = request.headers.get('x-tenant-id') || context?.tenantId || 'tenant1';
    const authToken = request.headers.get('authorization') || 'Bearer test-mendix-token-12345';

    console.log('[AI Chat API] Sending request to LLM Gateway:', {
      userId,
      tenantId,
      query: message.substring(0, 100) + '...'
    });

    // Call the LLM Gateway
    const gatewayBaseUrl = process.env.LLM_GATEWAY_URL || 'http://localhost:3001';
    const gatewayUrl = `${gatewayBaseUrl}/chat`;

    console.log('[AI Chat API] Gateway URL:', gatewayUrl);

    try {
      const gatewayResponse = await axios.post(
        gatewayUrl,
        {
          userId,
          tenantId,
          query: message,
          // Include conversation history if available
          history: context?.history || [],
          context: {
            currentLocation: context?.location,
            userProfile: context?.userProfile,
            ...(context || {})
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('[AI Chat API] Gateway response received:', {
        status: gatewayResponse.status,
        hasData: !!gatewayResponse.data
      });

      // Extract the response from the gateway
      const responseData = gatewayResponse.data;

      // The gateway returns the AI response and function execution results
      let responseMessage = responseData.message || responseData.response || 'I processed your request.';

      // If a function was executed (like createCustomer), format a friendly response
      if (responseData.functionResult) {
        const funcResult = responseData.functionResult;
        if (funcResult.status === 'success') {
          responseMessage = formatSuccessResponse(funcResult);
        }
      }

      return NextResponse.json({
        message: responseMessage,
        conversationId: conversationId || `conv_${Date.now()}`,
        metadata: {
          model: 'bedrock-claude-haiku',
          gateway: 'llm-gateway',
          functionExecuted: responseData.functionName,
          tokens: responseData.usage?.total_tokens,
        },
        data: responseData.data, // Include any structured data from Mendix
      });

    } catch (gatewayError: any) {
      console.error('[AI Chat API] Gateway error:', {
        message: gatewayError.message,
        response: gatewayError.response?.data,
        status: gatewayError.response?.status
      });

      // If gateway is not available, provide helpful error
      if (gatewayError.code === 'ECONNREFUSED') {
        return NextResponse.json({
          message: "I'm having trouble connecting to the AI service. Please make sure the LLM Gateway is running locally or deployed to AWS.",
          conversationId: conversationId || `conv_${Date.now()}`,
          metadata: {
            error: 'gateway_unavailable',
            suggestion: 'Start the gateway with: cd llm-gateway && npm run invoke:local'
          }
        });
      }

      // Return error from gateway
      return NextResponse.json({
        message: `I encountered an error: ${gatewayError.response?.data?.message || gatewayError.message}. Please try again.`,
        conversationId: conversationId || `conv_${Date.now()}`,
        metadata: {
          error: 'gateway_error',
          details: gatewayError.response?.data
        }
      });
    }

  } catch (error: any) {
    console.error('[AI Chat API] Error in chat endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Sorry, I encountered an unexpected error. Please try again.',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Format success responses from Mendix function execution
 */
function formatSuccessResponse(funcResult: any): string {
  const data = funcResult.data;

  if (!data) {
    return 'Operation completed successfully!';
  }

  // Format customer creation response
  if (data.customerID || data.customerId) {
    return `✅ Customer created successfully!

**Details:**
- Customer ID: ${data.customerID || data.customerId}
- Name: ${data.firstName} ${data.lastName}
- Email: ${data.email}
- Phone: ${data.mobileNumber || data.phone || 'N/A'}
${data.displayName ? `- Address: ${data.displayName}` : ''}

The customer has been added to your system and is ready for job assignments.`;
  }

  // Format job creation response
  if (data.jobID || data.jobId) {
    return `✅ Job created successfully!

**Details:**
- Job ID: ${data.jobID || data.jobId}
- Title: ${data.jobName || data.title || 'N/A'}
- Status: ${data.status}
- Priority: ${data.priority || 'Normal'}
${data.scheduledDate ? `- Scheduled: ${new Date(data.scheduledDate).toLocaleDateString()}` : ''}

The job is now in your system and ready to be assigned to a technician.`;
  }

  // Generic success response
  return `✅ Operation completed successfully!\n\n${JSON.stringify(data, null, 2)}`;
}
