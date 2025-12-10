import { APIGatewayProxyHandler } from 'aws-lambda';
import { bedrockService } from '../../services/bedrock.service';
import { conversationService, Conversation } from '../../services/dynamodb.service';
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_PROMPT = `You are an AI assistant for FieldSmartPro, a field service management platform.
You can help with:
- Creating and managing customer records
- Scheduling and tracking jobs
- Generating invoices
- Providing job status updates
- Answering questions about the platform

You have access to the customer database and can search for customers, create new records, and retrieve job information.
Always be professional, helpful, and concise.`;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const tenantId = event.headers['x-tenant-id'];
    const userId = event.headers['x-user-id'];
    
    if (!tenantId || !userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing authentication headers' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { message, conversationId: existingConversationId } = body;

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    // Get or create conversation
    let conversation: Conversation;
    const conversationId = existingConversationId || uuidv4();
    
    if (existingConversationId) {
      const existing = await conversationService.getConversation(existingConversationId);
      if (!existing) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Conversation not found' }),
        };
      }
      conversation = existing;
    } else {
      const now = Date.now();
      conversation = {
        conversationId,
        userId,
        tenantId,
        messages: [],
        createdAt: now,
        updatedAt: now,
        ttl: Math.floor(now / 1000) + 86400, // 24 hours
      };
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });

    // Get AI response
    const response = await bedrockService.chat(
      conversation.messages.map(m => ({ role: m.role, content: m.content })),
      { systemPrompt: SYSTEM_PROMPT }
    );

    // Add assistant message
    conversation.messages.push({
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    });

    conversation.updatedAt = Date.now();

    // Save conversation
    await conversationService.saveConversation(conversation);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        message: response,
      }),
    };
  } catch (error) {
    console.error('Error in chat handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process chat message' }),
    };
  }
};

export const chatHandler = handler;
