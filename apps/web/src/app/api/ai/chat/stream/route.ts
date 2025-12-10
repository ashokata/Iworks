import { NextRequest } from 'next/server';

/**
 * AI Chat Streaming API endpoint
 * Routes requests to AWS LLM Gateway (Bedrock)
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

    // Get LLM Gateway URL from environment
    const gatewayUrl = process.env.LLM_GATEWAY_URL;

    if (!gatewayUrl) {
      console.error('[AI Chat Stream] LLM_GATEWAY_URL not configured');
      return new Response(
        JSON.stringify({ error: 'LLM Gateway not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI Chat Stream] Routing request to AWS LLM Gateway');

    // Get tenant and user info from headers
    const tenantId = request.headers.get('x-tenant-id') || 'tenant1';
    const userId = request.headers.get('x-user-id') || 'user-' + Date.now();
    const authToken = request.headers.get('authorization') || '';

    // Build conversation history for gateway
    const conversationHistory = context?.history || [];
    const messages = conversationHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Prepare request for LLM Gateway
    const gatewayRequest = {
      userId,
      tenantId,
      query: message,
      context: {
        currentLocation: context?.currentLocation,
      },
      history: messages,
    };

    console.log('[AI Chat Stream] Calling gateway with:', {
      url: `${gatewayUrl}/chat`,
      tenantId,
      userId,
      messageLength: message.length,
    });

    // Call the LLM Gateway
    const response = await fetch(`${gatewayUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'X-Tenant-Id': tenantId,
        'X-User-Id': userId,
      },
      body: JSON.stringify(gatewayRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Chat Stream] Gateway error:', {
        status: response.status,
        error: errorText,
      });

      // Return fallback response
      const fallbackResponse = generateFallbackResponse(message);
      return streamTextResponse(fallbackResponse, conversationId);
    }

    const gatewayResponse = await response.json();
    console.log('[AI Chat Stream] Gateway response received:', {
      hasContent: !!gatewayResponse.content,
      hasToolUse: !!gatewayResponse.tool_use,
    });

    // Stream the response back to client
    const responseText = gatewayResponse.content || 'I received your message but had trouble generating a response. Please try again.';
    return streamTextResponse(responseText, conversationId);

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
