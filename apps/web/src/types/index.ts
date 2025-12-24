// Re-export all database types for convenience
export * from './database.types';

export interface Tenant {
  id: string;
  name: string;
  slug?: string;
  domain?: string;
  logo?: string;
  industry?: string;
  size?: string;
  active?: boolean;
  createdAt: string;
  settings?: TenantSettings;
}

export interface TenantSettings {
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
  };
  features?: {
    enableInvoicing?: boolean;
    enableReports?: boolean;
    enableCustomerPortal?: boolean;
  };
}

/**
 * @deprecated Use Job from database.types.ts instead
 * Legacy Job interface - aligned with OData schema
 * Endpoint: /odata/iworks/v1/Jobs
 */
export interface LegacyODataJob {
  id: number;                    // JobID (integer)
  tenantId: string;              // Multi-tenant isolation (via header)
  title: string;                 // JobName
  description?: string;          // Description
  status: 'Scheduled' | 'In_Progress' | 'Completed' | 'Canceled';  // Status (enum)
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';               // Priority (enum)
  date: string;                  // ScheduledDate (ISO 8601)
  startDate?: string;            // StartDate (ISO 8601)
  endDate?: string;              // EndDate (ISO 8601)
  location?: string;             // Location
  estimatedDuration?: number;    // EstimatedDuration (minutes)
  eventAllDay?: boolean;         // EventAllDay
  assignedTo?: string;           // From expanded Job_AssignedTo relation
  lineItems?: JobLineItem[];     // From expanded JobLineItems relation
  pricing?: Pricing;             // From expanded Pricing relation
  changedDate?: string;          // changedDate (read-only, ISO 8601)
  createdDate?: string;          // createdDate (read-only, ISO 8601)
}

/**
 * JobLineItem interface - for line items in jobs
 */
export interface JobLineItem {
  id?: number;                   // LineItemID (optional for create, now number)
  itemType: 'Service' | 'Product'; // Type: Service or Product (Material)
  name: string;                  // Item name
  description?: string;          // Item description
  quantity: number;              // Quantity
  unitPrice: number;             // Unit price
  totalPrice: number;            // Total price (quantity * unitPrice)
}

/**
 * CreateJobRequest interface - for POST /Jobs
 * Based on JobCREATE schema
 */
export interface CreateJobRequest {
  title: string;                 // JobName (required)
  description?: string;          // Description
  status?: 'Scheduled' | 'In_Progress' | 'Completed' | 'Canceled';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledDate?: string;        // ScheduledDate (ISO 8601)
  startDate?: string;            // StartDate (ISO 8601)
  endDate?: string;              // EndDate (ISO 8601)
  location?: string;             // Location
  estimatedDuration?: number;    // EstimatedDuration (minutes)
  eventAllDay?: boolean;         // EventAllDay
  assignedTo?: string;           // For UI, not directly in OData
  lineItems?: JobLineItem[];     // Line items (services and products)
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Technician' | 'admin' | 'technician' | 'user';
  tenantId: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export interface VoiceIntent {
  action: 'create_job' | 'update_job' | 'view_jobs' | 'search_jobs';
  parameters?: Record<string, any>;
  confidence: number;
}

/**
 * Pricing interface - aligned with OData schema
 * Endpoint: /odata/iworks/v1/Pricing
 */
export interface Pricing {
  id: number;                    // PricingID (integer)
  tenantId: string;              // Multi-tenant isolation (via header)
  subTotal: number;              // SubTotal (decimal)
  discount: number;              // Discount (decimal)
  taxRate: number;               // TaxRate (percentage as decimal)
  taxAmount: number;             // TaxAmount (decimal)
  total: number;                 // Total (decimal)
  county?: string;               // County (string)
  jobId?: number;                // JobID (foreign key, optional)
  job?: Job;                     // Expanded Job relation
  changedDate?: string;          // changedDate (read-only, ISO 8601)
  createdDate?: string;          // createdDate (read-only, ISO 8601)
}

/**
 * CreatePricingRequest interface - for POST /Pricing
 * Based on PricingCREATE schema
 */
export interface CreatePricingRequest {
  subTotal: number;              // SubTotal (required)
  discount?: number;             // Discount (optional, default 0)
  taxRate?: number;              // TaxRate (optional, default 0)
  taxAmount?: number;            // TaxAmount (optional, calculated)
  total?: number;                // Total (optional, calculated)
  county?: string;               // County (optional)
  jobId?: number;                // JobID to associate with (optional)
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface Customer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
  title?: string;
  isActive?: boolean;
  phoneWork?: string;
  addressLine2?: string;
  enableText?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
  title?: string;
  isActive?: boolean;
  phoneWork?: string;
  addressLine2?: string;
  enableText?: boolean;
}

/**
 * AI Chat Message interface
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: ChatAttachment[];
}

/**
 * Chat attachment interface
 */
export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
}

/**
 * Chat request to Mendix/Bedrock API
 */
export interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: Record<string, any>;
}

/**
 * Chat response from Mendix/Bedrock API
 */
export interface ChatResponse {
  message: string;
  conversationId: string;
  metadata?: {
    model?: string;
    tokens?: number;
    confidence?: number;
  };
}

/**
 * Scheduling and Dispatch Types
 */

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  availability: TechnicianAvailability[];
  color?: string; // For calendar display
}

export interface TechnicianAvailability {
  id: string;
  technicianId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
}

export interface ScheduledJob extends Job {
  technicianId?: string;
  technician?: Technician;
  scheduledStart: string; // ISO 8601
  scheduledEnd: string; // ISO 8601
  actualStart?: string;
  actualEnd?: string;
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
  parentJobId?: string; // For recurring jobs
  isEmergency?: boolean;
  dispatchStatus: 'pending' | 'dispatched' | 'accepted' | 'in_progress' | 'completed' | 'canceled';
  notes?: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // For weekly (0-6)
  endDate?: string; // When to stop recurring
  occurrences?: number; // Or after N occurrences
}

export interface DispatchRule {
  id: string;
  name: string;
  priority: number;
  conditions: DispatchCondition[];
  actions: DispatchAction[];
  isActive: boolean;
}

export interface DispatchCondition {
  type: 'skill_match' | 'distance' | 'availability' | 'workload' | 'priority';
  operator: 'equals' | 'contains' | 'less_than' | 'greater_than';
  value: any;
}

export interface DispatchAction {
  type: 'assign' | 'notify' | 'prioritize' | 'escalate';
  parameters: Record<string, any>;
}

export interface DispatchRecommendation {
  technicianId: string;
  technician: Technician;
  score: number;
  reasons: string[];
  estimatedTravelTime: number; // minutes
  distance: number; // kilometers
  availability: boolean;
}
