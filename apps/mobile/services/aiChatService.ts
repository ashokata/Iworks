/**
 * AI Chat Service for Mobile
 * Handles communication with the LLM API (AWS Bedrock via Lambda)
 */

import { API_CONFIG, APP_CONFIG } from '../constants/config';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  reply: string;
  conversationId?: string;
  metadata?: {
    tool?: string;
    result?: any;
  };
}

class AIChatService {
  private conversationId: string | null = null;
  private history: ChatMessage[] = [];

  /**
   * Send a message to the AI and get a response
   */
  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      // Add user message to history
      this.history.push({ role: 'user', content: message });

      // Call the LLM endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/llm-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': APP_CONFIG.DEFAULT_TENANT_ID,
          'x-user-id': 'mobile-user',
        },
        body: JSON.stringify({
          query: message,
          userId: 'mobile-user',
          tenantId: APP_CONFIG.DEFAULT_TENANT_ID,
          history: this.history.slice(-10), // Keep last 10 messages for context
          context: {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Chat] Error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Add assistant response to history
      if (data.reply) {
        this.history.push({ role: 'assistant', content: data.reply });
      }

      // Store conversation ID
      if (data.conversationId) {
        this.conversationId = data.conversationId;
      }

      return {
        reply: data.reply || 'I received your message but had trouble generating a response.',
        conversationId: data.conversationId,
        metadata: data.metadata,
      };
    } catch (error: any) {
      console.error('[AI Chat Service] Error:', error);
      
      // Return fallback response
      return {
        reply: this.generateFallbackResponse(message),
        conversationId: this.conversationId || undefined,
      };
    }
  }

  /**
   * Generate a fallback response when the API is unavailable
   */
  private generateFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('create') && lowerMessage.includes('customer')) {
      return "I'd love to help you create a customer! Please provide the customer's name, phone number, and email address. For example: 'Create customer John Smith, phone 555-1234, email john@example.com'";
    }

    if (lowerMessage.includes('create') && lowerMessage.includes('job')) {
      return "I can help you create a job! Please provide the customer name, job type, and scheduled date. For example: 'Create a plumbing repair job for John Smith tomorrow at 2pm'";
    }

    if (lowerMessage.includes('update')) {
      return "I can help you update records. What would you like to update? Please specify the customer, job, or invoice details.";
    }

    if (lowerMessage.includes('schedule') || lowerMessage.includes('appointment')) {
      return "I can help with scheduling! Would you like to view your schedule, create a new appointment, or reschedule an existing one?";
    }

    if (lowerMessage.includes('customer')) {
      return "I can help with customer management! You can ask me to create a new customer, find a customer, or update customer information.";
    }

    if (lowerMessage.includes('job')) {
      return "I can help with jobs! You can ask me to create a new job, check job status, or update job details.";
    }

    return "I'm AIRA, your AI field service assistant. I can help you:\n\n• Create or update customers\n• Schedule and manage jobs\n• Check schedules and availability\n• Generate invoices\n\nHow can I assist you today?";
  }

  /**
   * Reset the conversation
   */
  resetConversation(): void {
    this.conversationId = null;
    this.history = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.history];
  }
}

export const aiChatService = new AIChatService();
export type { ChatMessage, ChatResponse };

