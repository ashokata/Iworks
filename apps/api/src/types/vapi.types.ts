/**
 * VAPI Integration Types
 * Based on VAPI API specification: https://api.vapi.ai/api-json
 */

// ============================================================================
// VAPI API Types
// ============================================================================

export interface VapiAssistant {
  id: string;
  orgId: string;
  name: string;
  model: VapiModel;
  voice: VapiVoice;
  firstMessage?: string;
  firstMessageMode?: 'assistant-speaks-first' | 'assistant-waits-for-user';
  transcriber?: VapiTranscriber;
  serverUrl?: string;
  serverUrlSecret?: string;
  endCallFunctionEnabled?: boolean;
  silenceTimeoutSeconds?: number;
  maxDurationSeconds?: number;
  backgroundSound?: 'office' | 'off';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface VapiModel {
  provider: 'openai' | 'anthropic' | 'together-ai' | 'groq';
  model: string;
  temperature?: number;
  systemPrompt?: string;
  tools?: VapiTool[];
  toolIds?: string[];
}

export interface VapiVoice {
  provider: '11labs' | 'playht' | 'deepgram' | 'azure' | 'vapi';
  voiceId: string;
  speed?: number;
  stability?: number;
}

export interface VapiTranscriber {
  provider: 'deepgram' | 'talkscriber';
  model?: string;
  language?: string;
  keywords?: string[];
}

export interface VapiTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, VapiToolProperty>;
      required?: string[];
    };
  };
  async?: boolean;
  messages?: VapiToolMessage[];
}

export interface VapiToolProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: string[];
  properties?: Record<string, VapiToolProperty>;
  items?: VapiToolProperty;
  required?: string[];
}

export interface VapiToolMessage {
  type: 'request-start' | 'request-complete' | 'request-failed';
  content: string;
}

export interface VapiPhoneNumber {
  id: string;
  orgId: string;
  number: string;
  provider: 'twilio' | 'vonage' | 'vapi';
  assistantId?: string;
  squadId?: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VapiCall {
  id: string;
  orgId: string;
  assistantId?: string;
  phoneNumberId?: string;
  type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall';
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
  endedReason?: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  transcript?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  analysis?: VapiCallAnalysis;
  messages?: VapiMessage[];
  metadata?: Record<string, any>;
}

export interface VapiCallAnalysis {
  summary?: string;
  successEvaluation?: string;
  structuredData?: Record<string, any>;
}

export interface VapiMessage {
  role: 'assistant' | 'user' | 'system' | 'tool-calls' | 'tool-call-result';
  message?: string;
  time?: number;
  endTime?: number;
  toolCalls?: VapiToolCall[];
}

export interface VapiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

// ============================================================================
// Webhook Payload Types
// ============================================================================

export type VapiWebhookEvent =
  | VapiAssistantRequestEvent
  | VapiToolCallEvent
  | VapiStatusUpdateEvent
  | VapiEndOfCallReportEvent
  | VapiHangEvent
  | VapiSpeechUpdateEvent;

export interface VapiAssistantRequestEvent {
  message: {
    type: 'assistant-request';
    call: VapiCall;
    customer?: {
      number: string;
      name?: string;
    };
  };
}

export interface VapiToolCallEvent {
  message: {
    type: 'tool-calls';
    call: VapiCall;
    toolCallList: VapiToolCall[];
  };
}

export interface VapiStatusUpdateEvent {
  message: {
    type: 'status-update';
    status: 'in-progress' | 'forwarding' | 'ended';
    call: VapiCall;
    endedReason?: string;
  };
}

export interface VapiEndOfCallReportEvent {
  message: {
    type: 'end-of-call-report';
    call: VapiCall;
    recordingUrl?: string;
    stereoRecordingUrl?: string;
    summary?: string;
    transcript?: string;
    messages?: VapiMessage[];
    endedReason?: string;
  };
}

export interface VapiHangEvent {
  message: {
    type: 'hang';
    call: VapiCall;
  };
}

export interface VapiSpeechUpdateEvent {
  message: {
    type: 'speech-update';
    status: 'started' | 'stopped';
    role: 'assistant' | 'user';
    call: VapiCall;
  };
}

// ============================================================================
// Tool Call Parameter Types
// ============================================================================

export interface CreateCustomerAndServiceRequestParams {
  customerName: string;
  phoneNumber: string;
  email?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  problemType: 'HVAC' | 'PLUMBING' | 'ELECTRICAL' | 'APPLIANCE' | 'OTHER';
  problemDescription: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
}

export interface CheckTechnicianAvailabilityParams {
  date?: string; // YYYY-MM-DD
  problemType: string;
}

export interface BookAppointmentParams {
  customerId: string;
  serviceRequestId: string;
  slotId: string;
}

export interface TransferToHumanParams {
  reason?: string;
}

// ============================================================================
// Tool Call Response Types
// ============================================================================

export interface CreateCustomerResult {
  success: boolean;
  customerId?: string;
  serviceRequestId?: string;
  confirmationNumber?: string;
  message: string;
}

export interface AvailabilitySlot {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  technicianName: string;
  technicianId: string;
}

export interface CheckAvailabilityResult {
  success: boolean;
  slots: AvailabilitySlot[];
  message: string;
}

export interface BookAppointmentResult {
  success: boolean;
  appointmentId?: string;
  confirmationNumber?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  technicianName?: string;
  message: string;
}

// ============================================================================
// Internal Configuration Types
// ============================================================================

export interface VapiTenantConfig {
  tenantId: string;
  companyName: string;
  industry?: string;
  
  // VAPI Resources
  vapiAssistantId?: string;
  vapiPhoneNumberId?: string;
  phoneNumber?: string;
  
  // Feature Flags
  isEnabled: boolean;
  appointmentBookingEnabled: boolean;
  
  // Customization
  companyGreeting?: string;
  voiceId?: string;
  businessHours?: BusinessHours;
  afterHoursMessage?: string;
  
  // Notifications
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPush: boolean;
  notificationRecipients?: NotificationRecipient[];
}

export interface BusinessHours {
  [day: string]: {
    isOpen: boolean;
    start?: string; // HH:mm
    end?: string;   // HH:mm
  };
}

export interface NotificationRecipient {
  email?: string;
  phone?: string;
  userId?: string;
}

// ============================================================================
// Provisioning Types
// ============================================================================

export interface ProvisionTenantRequest {
  tenantId: string;
  companyName: string;
  industry?: string;
  features?: {
    appointmentBooking?: boolean;
    afterHoursVoicemail?: boolean;
  };
  notifications?: {
    email?: string[];
    sms?: string[];
    userIds?: string[];
  };
  areaCode?: string; // Preferred area code for phone number
}

export interface ProvisionTenantResult {
  success: boolean;
  phoneNumber?: string;
  assistantId?: string;
  webhookUrl?: string;
  error?: string;
}

export interface DeprovisionTenantResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface VapiCallStats {
  totalCalls: number;
  totalDuration: number; // minutes
  averageDuration: number;
  customersCreated: number;
  serviceRequestsCreated: number;
  appointmentsBooked: number;
  callsByStatus: Record<string, number>;
  callsByProblemType: Record<string, number>;
  callsByDay: Array<{ date: string; count: number }>;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface NewRequestNotification {
  type: 'NEW_VOICE_REQUEST';
  tenant: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address: string;
    verificationStatus: 'UNVERIFIED';
  };
  serviceRequest: {
    id: string;
    confirmationNumber: string;
    problemType: string;
    description: string;
    urgency: string;
  };
  appointment?: {
    id: string;
    date: string;
    timeSlot: string;
    technicianName: string;
  };
  callInfo: {
    duration: number;
    recordingUrl?: string;
    transcriptUrl?: string;
  };
  timestamp: string;
}

