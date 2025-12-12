import { NextRequest } from 'next/server';

/**
 * AI Chat Streaming API endpoint
 * Routes requests to AWS Lambda LLM Chat function
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, context } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get tenant and user info from headers or environment
    // Use the configured tenant ID (local-tenant for local, tenant1 for AWS)
    const tenantId = request.headers.get('x-tenant-id') || process.env.NEXT_PUBLIC_TENANT_ID || 'local-tenant';
    const userId = request.headers.get('x-user-id') || 'user-' + Date.now();

    // Build conversation history
    const conversationHistory = context?.history || [];
    const messages = conversationHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Call the LLM Chat endpoint
    // Use local API if NEXT_PUBLIC_API_BASE_URL is set to local, otherwise use AWS deployed endpoint
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const isLocalApi = apiBaseUrl.includes('localhost');
    
    // For local development with PostgreSQL, use local API (requires AWS credentials for Bedrock)
    // For production or if local Bedrock isn't configured, use deployed AWS Lambda
    const llmChatUrl = isLocalApi 
      ? `${apiBaseUrl}/llm-chat`
      : (process.env.NEXT_PUBLIC_LLM_API_URL || 'https://gpajab36b7.execute-api.us-east-1.amazonaws.com/prod/llm-chat');

    console.log('[AI Chat Stream] Calling Lambda:', {
      url: llmChatUrl,
      tenantId,
      userId,
      messageLength: message.length,
    });

    // Call the Lambda
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
        history: messages,
        context: {
          currentLocation: context?.currentLocation,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Chat Stream] Lambda error:', {
        status: response.status,
        error: errorText,
      });

      // Return fallback response
      const fallbackResponse = generateFallbackResponse(message);
      return streamTextResponse(fallbackResponse, conversationId);
    }

    const lambdaResponse = await response.json();
    console.log('[AI Chat Stream] Lambda response received:', {
      hasReply: !!lambdaResponse.reply,
      tool: lambdaResponse.metadata?.tool,
    });

    // Stream the response back to client
    const responseText = lambdaResponse.reply || 'I received your message but had trouble generating a response. Please try again.';
    return streamTextResponse(responseText, lambdaResponse.conversationId || conversationId);

  } catch (error: any) {
    console.error('[AI Chat Stream] Error:', {
      message: error.message,
      stack: error.stack?.split('\n')[0]
    });

    const fallbackResponse = generateFallbackResponse('');
    return streamTextResponse(fallbackResponse, null);
  }
}

/**
 * Stream text response word by word
 */
function streamTextResponse(text: string, conversationId: string | null): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const newConversationId = conversationId || `conv_${Date.now()}`;
        const words = text.split(' ');

        for (let i = 0; i < words.length; i++) {
          const word = words[i] + (i < words.length - 1 ? ' ' : '');
          const data = JSON.stringify({
            content: word,
            conversationId: newConversationId,
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, 30));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('[Stream] Error:', error);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Fallback response when Gateway is unavailable
 */
function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('dispatch') || lowerMessage.includes('assign')) {
    return `I can help with dispatch! Our Smart Dispatch feature uses AI to automatically assign jobs to the best-suited technicians based on their skills, location, availability, and current workload. Would you like me to guide you through the dispatch process?`;
  }

  if (lowerMessage.includes('schedule') || lowerMessage.includes('calendar')) {
    return `I can help you with scheduling! The scheduler allows you to view and manage technician schedules, drag and drop jobs to assign them, see availability at a glance, and set up recurring appointments. Would you like to open the scheduler?`;
  }

  if (lowerMessage.includes('customer')) {
    return `I can assist with customer management! You can add new customers, update their information, view customer history and jobs, and manage contact details. What would you like to do with customers?`;
  }

  return `Thanks for your message! I'm AIRA, your field service management assistant. I can help with smart scheduling, AI-powered dispatch, route optimization, technician management, jobs, customers, invoicing, and reports. What would you like to know more about?`;
}
