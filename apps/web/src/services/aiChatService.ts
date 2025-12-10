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
      const request: ChatRequest = {
        message,
        conversationId: this.conversationId || undefined,
        context,
      };

      // Adjust the endpoint based on your Mendix API structure
      // This is a common pattern for Mendix REST APIs
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
      const request: ChatRequest = {
        message,
        conversationId: this.conversationId || undefined,
        context,
      };

      const response = await fetch(
        '/api/ai/chat/stream',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
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
