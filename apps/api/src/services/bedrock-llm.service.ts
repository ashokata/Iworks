/**
 * AWS Bedrock LLM Service with Function Calling Support
 * Integrates Claude AI for conversational interactions with tool use
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Configuration - Using Claude Sonnet 4 with US region prefix for cross-region inference
const DEFAULT_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0';
const FALLBACK_MODEL_ID = process.env.BEDROCK_FALLBACK_MODEL || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
const MAX_TOKENS = parseInt(process.env.BEDROCK_MAX_TOKENS || '4096');
const TEMPERATURE = parseFloat(process.env.BEDROCK_TEMPERATURE || '0.7');

// Types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface BedrockResponse {
  content?: string;
  tool_use?: ToolUse;
  stopReason?: string;
  usage?: TokenUsage;
}

export interface FunctionDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

// Function definitions for InField Works assistant
const FUNCTION_DEFINITIONS: FunctionDefinition[] = [
  {
    name: 'createCustomer',
    description: 'Create a new customer in the system. Use this when the user wants to add a new customer with their contact information.',
    input_schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', description: 'Customer first name (required)' },
        lastName: { type: 'string', description: 'Customer last name (required)' },
        email: { type: 'string', description: 'Customer email address' },
        phone: { type: 'string', description: 'Customer phone number (required)' },
        address: { type: 'string', description: 'Customer physical address' },
      },
      required: ['firstName', 'lastName', 'phone'],
    },
  },
  {
    name: 'searchCustomer',
    description: 'Search for existing customers by name, phone, email, or customer ID. Use this before creating a customer to avoid duplicates.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (name or partial match)' },
        phone: { type: 'string', description: 'Search by phone number' },
        email: { type: 'string', description: 'Search by email address' },
        customerId: { type: 'string', description: 'Look up specific customer ID' },
        limit: { type: 'number', description: 'Maximum number of results (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'updateCustomer',
    description: 'Update an existing customer\'s information.',
    input_schema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'ID of the customer to update (required)' },
        firstName: { type: 'string', description: 'New first name' },
        lastName: { type: 'string', description: 'New last name' },
        email: { type: 'string', description: 'New email address' },
        phone: { type: 'string', description: 'New phone number' },
        address: { type: 'string', description: 'New address' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'createJob',
    description: 'Create a new job/work order for a customer. Use this when scheduling work or service requests.',
    input_schema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'ID of the customer this job is for (required)' },
        jobType: { type: 'string', description: 'Type of job (e.g., HVAC repair, plumbing, electrical)' },
        problem: { type: 'string', description: 'Description of the problem or work needed' },
        scheduledDate: { type: 'string', description: 'When to schedule the job (ISO 8601 format)' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Job priority level' },
        assignedTo: { type: 'string', description: 'Technician ID to assign the job to' },
      },
      required: ['customerId', 'jobType'],
    },
  },
  {
    name: 'getJobStatus',
    description: 'Get the current status and details of a job.',
    input_schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'ID of the job to check (required)' },
        includeHistory: { type: 'boolean', description: 'Include full job history and updates' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'updateInvoice',
    description: 'Update an existing invoice. Use this to modify invoice details or mark payment status.',
    input_schema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string', description: 'ID of the invoice to update (required)' },
        amount: { type: 'number', description: 'Invoice amount in dollars' },
        status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], description: 'Payment status' },
        paymentMethod: { type: 'string', description: 'How the invoice was paid' },
        notes: { type: 'string', description: 'Additional notes about the invoice' },
      },
      required: ['invoiceId'],
    },
  },
  {
    name: 'sendNotification',
    description: 'Send a notification to a customer or user via SMS, email, or push notification.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient (phone number, email, or user ID)' },
        channel: { type: 'string', enum: ['sms', 'email', 'push'], description: 'Communication channel' },
        message: { type: 'string', description: 'Message content to send' },
        subject: { type: 'string', description: 'Subject line (for email)' },
      },
      required: ['to', 'channel', 'message'],
    },
  },
];

/**
 * Get system prompt for InField Works assistant
 */
function getSystemPrompt(tenantId: string): string {
  return `You are AIRA, an AI assistant for InField Works - a field service management platform. You help technicians and dispatchers manage customers, jobs, invoices, and communications efficiently.

Your capabilities:
- Create and search for customers
- Create and manage jobs/work orders
- Update invoices and payment status
- Send notifications to customers
- Answer questions about job status and customer information

Guidelines:
- Be concise and professional
- Always confirm critical actions before executing (e.g., "I'll create a customer with these details...")
- If information is missing, ask clarifying questions
- For customer/job lookups, use search before creating duplicates
- Format responses for mobile readability (short paragraphs, bullet points)
- Include relevant IDs and next steps in your responses
- When creating entities, confirm the created ID

Tenant: ${tenantId}
Current date: ${new Date().toISOString().split('T')[0]}`;
}

/**
 * Format messages for Claude API
 */
function formatMessages(messages: Message[]): any[] {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));
}

/**
 * Parse Bedrock response
 */
function parseResponse(responseBody: any): BedrockResponse {
  const response: BedrockResponse = {
    stopReason: responseBody.stop_reason,
    usage: responseBody.usage,
  };

  // Extract text content
  const textContent = responseBody.content?.find((c: any) => c.type === 'text');
  if (textContent) {
    response.content = textContent.text;
  }

  // Extract tool use
  const toolUseContent = responseBody.content?.find((c: any) => c.type === 'tool_use');
  if (toolUseContent) {
    response.tool_use = {
      id: toolUseContent.id,
      name: toolUseContent.name,
      input: toolUseContent.input,
    };
  }

  return response;
}

export const bedrockLLMService = {
  /**
   * Invoke Bedrock for function decision (determines if tool use is needed)
   */
  async invokeForFunctionDecision(
    messages: Message[],
    tenantId: string,
    options: { maxTokens?: number; temperature?: number; systemPrompt?: string } = {}
  ): Promise<BedrockResponse> {
    const systemPrompt = options.systemPrompt || getSystemPrompt(tenantId);

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.maxTokens || MAX_TOKENS,
      temperature: options.temperature || TEMPERATURE,
      system: systemPrompt,
      messages: formatMessages(messages),
      tools: FUNCTION_DEFINITIONS,
    };

    console.log('[Bedrock LLM] Invoking for function decision', {
      modelId: DEFAULT_MODEL_ID,
      messageCount: messages.length,
    });

    try {
      const command = new InvokeModelCommand({
        modelId: DEFAULT_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      console.log('[Bedrock LLM] Response received', {
        stopReason: responseBody.stop_reason,
        hasToolUse: !!responseBody.content?.find((c: any) => c.type === 'tool_use'),
        usage: responseBody.usage,
      });

      return parseResponse(responseBody);
    } catch (error: any) {
      console.error('[Bedrock LLM] Invocation failed', error);

      // Try fallback model
      if (DEFAULT_MODEL_ID !== FALLBACK_MODEL_ID) {
        console.log('[Bedrock LLM] Retrying with fallback model', { fallbackModel: FALLBACK_MODEL_ID });
        
        const fallbackPayload = { ...payload };
        const fallbackCommand = new InvokeModelCommand({
          modelId: FALLBACK_MODEL_ID,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(fallbackPayload),
        });

        const fallbackResponse = await client.send(fallbackCommand);
        const fallbackBody = JSON.parse(new TextDecoder().decode(fallbackResponse.body));
        return parseResponse(fallbackBody);
      }

      throw error;
    }
  },

  /**
   * Invoke Bedrock for final answer after tool execution
   */
  async invokeForFinalAnswer(
    originalQuery: string,
    toolName: string,
    toolResult: any,
    conversationHistory: Message[],
    tenantId: string
  ): Promise<BedrockResponse> {
    const systemPrompt = getSystemPrompt(tenantId) + 
      '\n\nProvide a concise, friendly summary of the action taken. Include relevant IDs and suggest next steps.';

    // Build messages with tool result
    const messages = [
      ...formatMessages(conversationHistory),
      { role: 'user', content: originalQuery },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: `tool_${Date.now()}`,
            name: toolName,
            input: toolResult.params || {},
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: `tool_${Date.now()}`,
            content: JSON.stringify(toolResult),
          },
        ],
      },
    ];

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: MAX_TOKENS,
      temperature: 0.5, // Lower temperature for summarization
      system: systemPrompt,
      messages,
    };

    console.log('[Bedrock LLM] Generating final answer', { toolName });

    const command = new InvokeModelCommand({
      modelId: DEFAULT_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return parseResponse(responseBody);
  },

  /**
   * Simple chat without function calling
   */
  async chat(
    messages: Message[],
    options: { maxTokens?: number; temperature?: number; systemPrompt?: string } = {}
  ): Promise<string> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.maxTokens || MAX_TOKENS,
      temperature: options.temperature || TEMPERATURE,
      system: options.systemPrompt || 'You are a helpful assistant.',
      messages: formatMessages(messages),
    };

    const command = new InvokeModelCommand({
      modelId: DEFAULT_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    const textContent = responseBody.content?.find((c: any) => c.type === 'text');
    return textContent?.text || '';
  },

  /**
   * Stream chat responses
   */
  async *chatStream(
    messages: Message[],
    options: { maxTokens?: number; temperature?: number; systemPrompt?: string } = {}
  ): AsyncGenerator<string> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.maxTokens || MAX_TOKENS,
      temperature: options.temperature || TEMPERATURE,
      system: options.systemPrompt || 'You are a helpful assistant.',
      messages: formatMessages(messages),
    };

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: DEFAULT_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);

    if (response.body) {
      for await (const event of response.body) {
        if (event.chunk) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
          if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
            yield chunk.delta.text;
          }
        }
      }
    }
  },

  /**
   * Get available function definitions
   */
  getFunctionDefinitions(): FunctionDefinition[] {
    return FUNCTION_DEFINITIONS;
  },
};

