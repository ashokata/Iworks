/**
 * VAPI API Client
 * Handles communication with VAPI REST API
 * API Reference: https://api.vapi.ai/api-json
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  VapiAssistant,
  VapiPhoneNumber,
  VapiCall,
  VapiTool,
  VapiModel,
  VapiVoice,
  VapiTranscriber,
} from '../../types/vapi.types';

const VAPI_API_BASE_URL = 'https://api.vapi.ai';

export interface CreateAssistantParams {
  name: string;
  model: VapiModel;
  voice: VapiVoice;
  firstMessage?: string;
  transcriber?: VapiTranscriber;
  serverUrl?: string;
  serverUrlSecret?: string;
  endCallFunctionEnabled?: boolean;
  silenceTimeoutSeconds?: number;
  maxDurationSeconds?: number;
  backgroundSound?: 'office' | 'off';
  metadata?: Record<string, any>;
}

export interface UpdateAssistantParams extends Partial<CreateAssistantParams> {}

export interface BuyPhoneNumberParams {
  areaCode?: string;
  assistantId?: string;
  name?: string;
}

export interface CreateCallParams {
  assistantId?: string;
  phoneNumberId?: string;
  customer: {
    number: string;
    name?: string;
  };
  assistantOverrides?: Partial<CreateAssistantParams>;
}

export class VapiClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.VAPI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('[VapiClient] No API key provided. VAPI calls will fail.');
    }

    this.client = axios.create({
      baseURL: VAPI_API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Request logging
    this.client.interceptors.request.use((config) => {
      console.log(`[VapiClient] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Response/error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('[VapiClient] Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        throw error;
      }
    );
  }

  // ============================================================================
  // Assistant Management
  // ============================================================================

  /**
   * Create a new VAPI assistant
   */
  async createAssistant(params: CreateAssistantParams): Promise<VapiAssistant> {
    const response = await this.client.post<VapiAssistant>('/assistant', params);
    console.log('[VapiClient] Created assistant:', response.data.id);
    return response.data;
  }

  /**
   * Get an assistant by ID
   */
  async getAssistant(assistantId: string): Promise<VapiAssistant> {
    const response = await this.client.get<VapiAssistant>(`/assistant/${assistantId}`);
    return response.data;
  }

  /**
   * List all assistants
   */
  async listAssistants(limit: number = 100): Promise<VapiAssistant[]> {
    const response = await this.client.get<VapiAssistant[]>('/assistant', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Update an assistant
   */
  async updateAssistant(assistantId: string, params: UpdateAssistantParams): Promise<VapiAssistant> {
    const response = await this.client.patch<VapiAssistant>(`/assistant/${assistantId}`, params);
    console.log('[VapiClient] Updated assistant:', assistantId);
    return response.data;
  }

  /**
   * Delete an assistant
   */
  async deleteAssistant(assistantId: string): Promise<VapiAssistant> {
    const response = await this.client.delete<VapiAssistant>(`/assistant/${assistantId}`);
    console.log('[VapiClient] Deleted assistant:', assistantId);
    return response.data;
  }

  // ============================================================================
  // Phone Number Management
  // ============================================================================

  /**
   * Buy a new phone number
   */
  async buyPhoneNumber(params: BuyPhoneNumberParams): Promise<VapiPhoneNumber> {
    const response = await this.client.post<VapiPhoneNumber>('/phone-number/buy', {
      provider: 'vapi', // Use VAPI's built-in provider
      ...params,
    });
    console.log('[VapiClient] Purchased phone number:', response.data.number);
    return response.data;
  }

  /**
   * Get a phone number by ID
   */
  async getPhoneNumber(phoneNumberId: string): Promise<VapiPhoneNumber> {
    const response = await this.client.get<VapiPhoneNumber>(`/phone-number/${phoneNumberId}`);
    return response.data;
  }

  /**
   * List all phone numbers
   */
  async listPhoneNumbers(limit: number = 100): Promise<VapiPhoneNumber[]> {
    const response = await this.client.get<VapiPhoneNumber[]>('/phone-number', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Update a phone number (e.g., assign to different assistant)
   */
  async updatePhoneNumber(
    phoneNumberId: string,
    params: { assistantId?: string; name?: string }
  ): Promise<VapiPhoneNumber> {
    const response = await this.client.patch<VapiPhoneNumber>(`/phone-number/${phoneNumberId}`, params);
    console.log('[VapiClient] Updated phone number:', phoneNumberId);
    return response.data;
  }

  /**
   * Release/delete a phone number
   */
  async deletePhoneNumber(phoneNumberId: string): Promise<VapiPhoneNumber> {
    const response = await this.client.delete<VapiPhoneNumber>(`/phone-number/${phoneNumberId}`);
    console.log('[VapiClient] Released phone number:', phoneNumberId);
    return response.data;
  }

  // ============================================================================
  // Call Management
  // ============================================================================

  /**
   * Create an outbound call
   */
  async createCall(params: CreateCallParams): Promise<VapiCall> {
    const response = await this.client.post<VapiCall>('/call', params);
    console.log('[VapiClient] Created call:', response.data.id);
    return response.data;
  }

  /**
   * Get a call by ID
   */
  async getCall(callId: string): Promise<VapiCall> {
    const response = await this.client.get<VapiCall>(`/call/${callId}`);
    return response.data;
  }

  /**
   * List calls with optional filters
   */
  async listCalls(params?: {
    limit?: number;
    assistantId?: string;
    phoneNumberId?: string;
    createdAtGt?: string;
    createdAtLt?: string;
  }): Promise<VapiCall[]> {
    const response = await this.client.get<VapiCall[]>('/call', { params });
    return response.data;
  }

  // ============================================================================
  // Tool Creation Helpers
  // ============================================================================

  /**
   * Create standard tool definitions for FieldSmartPro
   */
  static createFieldSmartProTools(config: {
    appointmentBookingEnabled: boolean;
  }): VapiTool[] {
    const tools: VapiTool[] = [
      // Create Customer and Service Request
      {
        type: 'function',
        function: {
          name: 'createCustomerAndServiceRequest',
          description: 'Create a new customer and service request in the system. Call this after collecting customer information and understanding their service need.',
          parameters: {
            type: 'object',
            properties: {
              customerName: {
                type: 'string',
                description: 'Full name of the customer',
              },
              phoneNumber: {
                type: 'string',
                description: 'Customer phone number',
              },
              email: {
                type: 'string',
                description: 'Customer email (optional)',
              },
              address: {
                type: 'object',
                properties: {
                  street: { type: 'string', description: 'Street address' },
                  city: { type: 'string', description: 'City' },
                  state: { type: 'string', description: 'State' },
                  zipCode: { type: 'string', description: 'ZIP code' },
                },
                required: ['street', 'city', 'state', 'zipCode'],
              },
              problemType: {
                type: 'string',
                enum: ['HVAC', 'PLUMBING', 'ELECTRICAL', 'APPLIANCE', 'OTHER'],
                description: 'Category of the service issue',
              },
              problemDescription: {
                type: 'string',
                description: 'Detailed description of the problem',
              },
              urgency: {
                type: 'string',
                enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
                description: 'How urgent is the issue',
              },
            },
            required: ['customerName', 'phoneNumber', 'address', 'problemType', 'problemDescription'],
          },
        },
        async: true,
        messages: [
          {
            type: 'request-start',
            content: 'Let me create your service request...',
          },
          {
            type: 'request-complete',
            content: 'I have successfully created your service request.',
          },
          {
            type: 'request-failed',
            content: 'I apologize, but I encountered an issue creating your request. Let me try again.',
          },
        ],
      },
      // Transfer to Human
      {
        type: 'function',
        function: {
          name: 'transferToHuman',
          description: 'Transfer the call to a human representative when the caller explicitly requests it or the issue requires human intervention',
          parameters: {
            type: 'object',
            properties: {
              reason: {
                type: 'string',
                description: 'Reason for transfer',
              },
            },
          },
        },
        messages: [
          {
            type: 'request-start',
            content: 'Let me transfer you to one of our team members.',
          },
        ],
      },
    ];

    // Add appointment booking tools if enabled (premium feature)
    if (config.appointmentBookingEnabled) {
      tools.push(
        // Check Technician Availability
        {
          type: 'function',
          function: {
            name: 'checkTechnicianAvailability',
            description: 'Check available time slots for technician visits',
            parameters: {
              type: 'object',
              properties: {
                date: {
                  type: 'string',
                  description: 'Date to check availability in YYYY-MM-DD format. If not provided, checks next 7 days.',
                },
                problemType: {
                  type: 'string',
                  description: 'Type of service needed to match with qualified technicians',
                },
              },
              required: ['problemType'],
            },
          },
          async: true,
          messages: [
            {
              type: 'request-start',
              content: 'Let me check our available appointment slots...',
            },
          ],
        },
        // Book Appointment
        {
          type: 'function',
          function: {
            name: 'bookAppointment',
            description: 'Book a technician appointment for the customer',
            parameters: {
              type: 'object',
              properties: {
                customerId: {
                  type: 'string',
                  description: 'Customer ID from createCustomerAndServiceRequest',
                },
                serviceRequestId: {
                  type: 'string',
                  description: 'Service request ID',
                },
                slotId: {
                  type: 'string',
                  description: 'Selected time slot ID from checkTechnicianAvailability',
                },
              },
              required: ['customerId', 'serviceRequestId', 'slotId'],
            },
          },
          async: true,
          messages: [
            {
              type: 'request-start',
              content: 'Let me book that appointment for you...',
            },
            {
              type: 'request-complete',
              content: 'Your appointment has been confirmed.',
            },
          ],
        }
      );
    }

    return tools;
  }

  /**
   * Generate system prompt for a tenant's assistant
   */
  static generateSystemPrompt(config: {
    companyName: string;
    industry?: string;
    appointmentBookingEnabled: boolean;
    businessHours?: Record<string, { isOpen: boolean; start?: string; end?: string }>;
  }): string {
    const industryContext = config.industry
      ? `a ${config.industry} service company`
      : 'a home services company';

    const appointmentInstructions = config.appointmentBookingEnabled
      ? `
6. After creating the service request, offer to schedule an appointment:
   - Ask if they would like to schedule a technician visit
   - If yes, check availability using the checkTechnicianAvailability function
   - Present 2-3 available time slots in a natural way
   - Once they choose, book the appointment using the bookAppointment function`
      : `
6. After creating the service request, inform them that someone from the team will call them back to schedule an appointment.`;

    return `You are a professional, friendly virtual receptionist for ${config.companyName}, ${industryContext}.

Your primary goals are:
1. Greet callers warmly and make them feel heard
2. Understand their service needs clearly
3. Collect necessary information: full name, phone number, and service address
4. Create a service request in the system
5. Ensure the customer feels taken care of

Guidelines:
- Be empathetic when customers describe problems
- Speak naturally and conversationally
- Ask clarifying questions if the problem description is vague
- Confirm details before creating records
- Use the customer's name after learning it
- If you cannot help with something, offer to transfer to a human representative
${appointmentInstructions}

Problem Categories:
- HVAC: Heating, cooling, ventilation, thermostat issues
- PLUMBING: Leaks, clogs, water heater, pipes
- ELECTRICAL: Outlets, wiring, fixtures, circuit breakers
- APPLIANCE: Washer, dryer, refrigerator, dishwasher
- OTHER: Anything that doesn't fit above categories

Urgency Assessment:
- EMERGENCY: No heat in freezing weather, active water leak, electrical hazard
- HIGH: System not working, significant discomfort
- MEDIUM: Intermittent issues, partial functionality
- LOW: Maintenance, minor issues, future scheduling

Remember: You represent ${config.companyName}. Be professional but personable.`;
  }
}

// Export singleton instance for general use
export const vapiClient = new VapiClient();

