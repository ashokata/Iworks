import { apiClient } from './apiClient';
import { ChatRequest, ChatResponse } from '@/types';

/**
 * AI Chat Service - Handles communication with Mendix/Bedrock LLM APIs
 */
class AIChatService {
  private conversationId: string | null = null;

  /**
   * Send a message to the AI and get a response
   * @param message User's message
   * @param context Additional context for the conversation
   * @returns Promise with the AI response
   */
  async sendMessage(message: string, context?: Record<string, any>): Promise<ChatResponse> {
    try {
      // Get tenant ID from user session and include in context
      const tenantId = this.getTenantId();
      
      const request: ChatRequest = {
        message,
        conversationId: this.conversationId || undefined,
        context: {
          ...context,
          tenantId, // Include tenant ID in context as backup
        },
      };

      // apiClient automatically adds tenant ID to headers, but include in context too
      const response = await apiClient.post<ChatResponse>(
        '/api/ai/chat',
        request
      );

      // Store conversation ID for context continuity
      if (response.conversationId) {
        this.conversationId = response.conversationId;
      }

      return response;
    } catch (error: any) {
      console.error('[AI Chat Service] Error sending message:', error);
      throw new Error(error?.response?.data?.message || 'Failed to send message to AI');
    }
  }

  /**
   * Get tenant ID from user session (same logic as apiClient)
   */
  private getTenantId(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Get from user session in localStorage
    const userJson = localStorage.getItem('authUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.tenantId) {
          return user.tenantId;
        }
      } catch (error) {
        console.error('[AI Chat Service] Error parsing user data:', error);
      }
    }
    
    // Fallback to environment variable
    if (process.env.NEXT_PUBLIC_TENANT_ID) {
      return process.env.NEXT_PUBLIC_TENANT_ID;
    }
    
    return null;
  }

  /**
   * Send a message with streaming response
   * @param message User's message
   * @param onChunk Callback for each chunk of the response
   * @param context Additional context
   */
  async sendMessageStreaming(
    message: string,
    onChunk: (chunk: string) => void,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      // Get tenant ID from user session
      const tenantId = this.getTenantId();
      if (!tenantId) {
        throw new Error('Tenant ID is required. Please log in again.');
      }

      const request: ChatRequest = {
        message,
        conversationId: this.conversationId || undefined,
        context: {
          ...context,
          tenantId, // Include tenant ID in context as fallback
        },
      };

      const response = await fetch(
        '/api/ai/chat/stream',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'x-tenant-id': tenantId, // CRITICAL: Include tenant ID in headers
            'X-Tenant-ID': tenantId, // Also send in different case format
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
              if (parsed.conversationId) {
                this.conversationId = parsed.conversationId;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.error('[AI Chat Service] Error in streaming:', error);
      throw new Error('Failed to stream message from AI');
    }
  }

  /**
   * Reset the conversation
   */
  resetConversation(): void {
    this.conversationId = null;
  }

  /**
   * Get current conversation ID
   */
  getConversationId(): string | null {
    return this.conversationId;
  }
}

export const aiChatService = new AIChatService();
