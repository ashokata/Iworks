import { BedrockRuntimeClient, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  modelId?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export const bedrockService = {
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    const {
      modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      maxTokens = 4096,
      temperature = 0.7,
      systemPrompt,
    } = options;

    const command = new ConverseStreamCommand({
      modelId,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: [{ text: msg.content }],
      })),
      system: systemPrompt ? [{ text: systemPrompt }] : undefined,
      inferenceConfig: {
        maxTokens,
        temperature,
      },
    });

    const response = await client.send(command);
    let fullText = '';

    if (response.stream) {
      for await (const event of response.stream) {
        if (event.contentBlockDelta?.delta?.text) {
          fullText += event.contentBlockDelta.delta.text;
        }
      }
    }

    return fullText;
  },

  async *chatStream(messages: ChatMessage[], options: ChatOptions = {}): AsyncGenerator<string> {
    const {
      modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      maxTokens = 4096,
      temperature = 0.7,
      systemPrompt,
    } = options;

    const command = new ConverseStreamCommand({
      modelId,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: [{ text: msg.content }],
      })),
      system: systemPrompt ? [{ text: systemPrompt }] : undefined,
      inferenceConfig: {
        maxTokens,
        temperature,
      },
    });

    const response = await client.send(command);

    if (response.stream) {
      for await (const event of response.stream) {
        if (event.contentBlockDelta?.delta?.text) {
          yield event.contentBlockDelta.delta.text;
        }
      }
    }
  },
};
