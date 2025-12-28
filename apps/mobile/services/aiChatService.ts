/**
 * AI Chat Service for Mobile
 * LLM-powered conversational AI using AWS Bedrock via /llm-chat endpoint
 * Handles customer and job operations through natural language
 */

import { apiClient } from './api/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  reply: string;
  conversationId?: string;
  metadata?: {
    action?: string;
    tool?: string;
    toolResult?: any;
    data?: any;
    success?: boolean;
    model?: string;
    tokensUsed?: any;
    latencyMs?: number;
  };
  suggestedActions?: Array<{
    label: string;
    action: string;
    params?: Record<string, any>;
  }>;
}

class AIChatService {
  private conversationId: string | null = null;
  private history: ChatMessage[] = [];

  /**
   * Send a message to the AI and get a response via LLM endpoint
   */
  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      console.log('[AI Chat] Processing message via LLM:', message);

      // Add user message to history
      const userMessage: ChatMessage = { role: 'user', content: message };
      this.history.push(userMessage);

      // Call the LLM chat endpoint
      const response = await apiClient.post<any>('/llm-chat', {
        query: message,
        history: this.history.slice(0, -1), // Don't include the message we just added
        context: {
          platform: 'mobile',
          conversationId: this.conversationId,
        },
      });

      console.log('[AI Chat] LLM response received:', {
        hasReply: !!response.reply,
        tool: response.metadata?.tool,
        conversationId: response.conversationId,
      });

      // Update conversation ID
      if (response.conversationId) {
        this.conversationId = response.conversationId;
      }

      // Add assistant response to history
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.reply || response.message || 'I processed your request.',
      };
      this.history.push(assistantMessage);

      // Format the response
      return {
        reply: response.reply || response.message || 'I processed your request.',
        conversationId: response.conversationId || this.conversationId || undefined,
        metadata: {
          action: response.metadata?.tool,
          tool: response.metadata?.tool,
          toolResult: response.metadata?.toolResult,
          data: response.data || response.metadata?.toolResult?.data,
          success: response.metadata?.toolResult?.status === 'success',
          model: response.metadata?.model,
          tokensUsed: response.metadata?.tokens || response.metadata?.tokensUsed,
          latencyMs: response.metadata?.latencyMs,
        },
        suggestedActions: response.suggestedActions,
      };
    } catch (error: any) {
      console.error('[AI Chat Service] Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Handle specific error cases
      let errorMessage = 'I encountered an error. Please try again.';

      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid request. Please check your input.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to continue using AIRA.';
      } else if (error.response?.status === 500) {
        errorMessage = error.response?.data?.message || 'Server error. Please try again in a moment.';
      } else if (error.message?.includes('Network') || error.message?.includes('timeout')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      return {
        reply: errorMessage,
        conversationId: this.conversationId || undefined,
        metadata: {
          success: false,
          action: 'error',
          tool: 'error',
        },
      };
    }
  }

  /**
   * Reset the conversation
   */
  resetConversation(): void {
    this.conversationId = null;
    this.history = [];
    console.log('[AI Chat] Conversation reset');
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  /**
   * Get the current conversation ID
   */
  getConversationId(): string | null {
    return this.conversationId;
  }
}

export const aiChatService = new AIChatService();
export type { ChatMessage, ChatResponse };
