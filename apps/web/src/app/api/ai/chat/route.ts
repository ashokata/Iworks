import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Chat API endpoint - Connected to AWS Lambda LLM Gateway
 * Routes messages to the AWS Bedrock LLM Lambda function
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

    console.log('[AI Chat API] Sending request to LLM Lambda:', {
      userId,
      tenantId,
      query: message.substring(0, 100) + '...'
    });

    // Call the AWS Lambda LLM Chat endpoint
    const llmChatUrl = process.env.NEXT_PUBLIC_API_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/llm-chat`
      : 'https://gpajab36b7.execute-api.us-east-1.amazonaws.com/prod/llm-chat';

    console.log('[AI Chat API] LLM Chat URL:', llmChatUrl);

    try {
      const response = await fetch(llmChatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
          'x-user-id': userId,
        },
        body: JSON.stringify({
          query: message,
          userId,
          tenantId,
          history: context?.history || [],
          context: {
            currentLocation: context?.location,
            userProfile: context?.userProfile,
            ...(context || {})
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      console.log('[AI Chat API] LLM response received:', {
        conversationId: responseData.conversationId,
        hasReply: !!responseData.reply,
        tool: responseData.metadata?.tool
      });

      // Return the response from the Lambda
      return NextResponse.json({
        message: responseData.reply || 'I processed your request.',
        conversationId: responseData.conversationId || conversationId || `conv_${Date.now()}`,
        metadata: {
          model: responseData.metadata?.model || 'claude-sonnet-4',
          gateway: 'aws-lambda',
          functionExecuted: responseData.metadata?.tool,
          toolResult: responseData.metadata?.toolResult,
          tokens: responseData.metadata?.tokensUsed,
          latencyMs: responseData.metadata?.latencyMs,
        },
        suggestedActions: responseData.suggestedActions,
        data: responseData.metadata?.toolResult?.data,
      });

    } catch (fetchError: any) {
      console.error('[AI Chat API] LLM Lambda error:', {
        message: fetchError.message,
      });

      // If Lambda is not available, provide helpful error
      if (fetchError.message.includes('fetch failed') || fetchError.message.includes('ECONNREFUSED')) {
        return NextResponse.json({
          message: "I'm having trouble connecting to the AI service. Please check your internet connection and try again.",
          conversationId: conversationId || `conv_${Date.now()}`,
          metadata: {
            error: 'lambda_unavailable',
          }
        });
      }

      // Return error from Lambda
      return NextResponse.json({
        message: `I encountered an error: ${fetchError.message}. Please try again.`,
        conversationId: conversationId || `conv_${Date.now()}`,
        metadata: {
          error: 'lambda_error',
          details: fetchError.message
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
