/**
 * AIRA Customer Creation/Update Flow
 * Manages conversational flow for customer management with AIRA
 */

import { customerService, Customer, Address } from '../api/customerService';
import { z } from 'zod';

// Validation schemas matching API
export const customerValidation = {
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().regex(/^[+]?[\d\s()-]{10,}$/, 'Invalid phone format').optional(),
  type: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'CONTRACTOR']),
};

export type ConversationStep = 
  | 'idle'
  | 'collecting_name'
  | 'collecting_type'
  | 'collecting_phone'
  | 'collecting_email'
  | 'collecting_address'
  | 'confirming'
  | 'saving'
  | 'complete'
  | 'error';

export interface CustomerFlowState {
  step: ConversationStep;
  isCreating: boolean; // true = create, false = update
  customerId?: string;
  data: Partial<CustomerFormData>;
  errors: string[];
  lastMessage?: string;
}

export interface CustomerFormData {
  type: 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR';
  firstName: string;
  lastName: string;
  companyName?: string;
  mobilePhone?: string;
  homePhone?: string;
  workPhone?: string;
  email?: string;
  notes?: string;
  address?: {
    street: string;
    streetLine2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
    accessNotes?: string;
    gateCode?: string;
  };
}

export interface AIRAResponse {
  content: string;
  suggestions?: string[];
  action?: 'customer_created' | 'customer_updated' | 'cancelled';
  customer?: Customer;
  nextStep: ConversationStep;
}

// Intent detection
export function detectIntent(input: string): { 
  intent: 'create_customer' | 'update_customer' | 'find_customer' | 'provide_info' | 'confirm' | 'cancel' | 'unknown';
  extractedData?: Partial<CustomerFormData>;
} {
  const lower = input.toLowerCase().trim();
  
  // Cancel intent
  if (['cancel', 'stop', 'never mind', 'forget it', 'no thanks'].some(k => lower.includes(k))) {
    return { intent: 'cancel' };
  }
  
  // Confirmation intents
  if (['yes', 'yeah', 'yep', 'correct', 'that\'s right', 'confirm', 'save', 'looks good', 'go ahead'].some(k => lower.includes(k))) {
    return { intent: 'confirm' };
  }
  
  // Create customer intent
  if (['create customer', 'new customer', 'add customer', 'add a customer', 'create a new customer'].some(k => lower.includes(k))) {
    // Try to extract name if provided
    const nameMatch = lower.match(/(?:customer|add|create)\s+(?:named?\s+)?([a-z]+(?:\s+[a-z]+)?)/i);
    const extractedData: Partial<CustomerFormData> = {};
    
    if (nameMatch && nameMatch[1] && !['a', 'the', 'new'].includes(nameMatch[1])) {
      const nameParts = nameMatch[1].split(' ');
      if (nameParts.length >= 1) extractedData.firstName = capitalize(nameParts[0]);
      if (nameParts.length >= 2) extractedData.lastName = capitalize(nameParts.slice(1).join(' '));
    }
    
    return { intent: 'create_customer', extractedData };
  }
  
  // Update customer intent
  if (['update customer', 'edit customer', 'change customer', 'modify customer'].some(k => lower.includes(k))) {
    return { intent: 'update_customer' };
  }
  
  // Find customer intent
  if (['find customer', 'search customer', 'lookup customer', 'look up'].some(k => lower.includes(k))) {
    return { intent: 'find_customer' };
  }
  
  // Default: providing information
  return { intent: 'provide_info', extractedData: extractDataFromInput(input) };
}

// Extract data from natural language input
function extractDataFromInput(input: string): Partial<CustomerFormData> {
  const data: Partial<CustomerFormData> = {};
  const lower = input.toLowerCase();
  
  // Extract customer type
  if (lower.includes('residential') || lower.includes('homeowner')) {
    data.type = 'RESIDENTIAL';
  } else if (lower.includes('commercial') || lower.includes('business')) {
    data.type = 'COMMERCIAL';
  } else if (lower.includes('contractor')) {
    data.type = 'CONTRACTOR';
  }
  
  // Extract phone number (various formats)
  const phoneMatch = input.match(/(?:\+?1?[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/);
  if (phoneMatch) {
    data.mobilePhone = `+1${phoneMatch[1]}${phoneMatch[2]}${phoneMatch[3]}`;
  }
  
  // Extract email
  const emailMatch = input.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    data.email = emailMatch[0].toLowerCase();
  }
  
  // Extract name (if looks like a name)
  const nameMatch = input.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)$/);
  if (nameMatch) {
    data.firstName = nameMatch[1];
    data.lastName = nameMatch[2];
  }
  
  // Simple first/last name extraction from "my name is X" or "it's X"
  const nameIsMatch = input.match(/(?:name is|it's|i'm)\s+([a-z]+(?:\s+[a-z]+)?)/i);
  if (nameIsMatch) {
    const parts = nameIsMatch[1].split(' ');
    data.firstName = capitalize(parts[0]);
    if (parts.length > 1) data.lastName = capitalize(parts.slice(1).join(' '));
  }
  
  return data;
}

// Parse address from natural language
function parseAddress(input: string): Partial<CustomerFormData['address']> | null {
  // Common address patterns
  const addressMatch = input.match(/(\d+\s+[\w\s]+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|pl|place)\.?),?\s*(?:apt\.?\s*[\w]+,?\s*)?([a-z\s]+),?\s*([a-z]{2}),?\s*(\d{5}(?:-\d{4})?)/i);
  
  if (addressMatch) {
    return {
      street: addressMatch[1].trim(),
      city: capitalize(addressMatch[2].trim()),
      state: addressMatch[3].toUpperCase(),
      zip: addressMatch[4],
      country: 'US',
    };
  }
  
  return null;
}

// Capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Format phone for display
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

// Main conversation handler
export class CustomerFlowHandler {
  private state: CustomerFlowState;
  
  constructor() {
    this.state = {
      step: 'idle',
      isCreating: true,
      data: {},
      errors: [],
    };
  }
  
  getState(): CustomerFlowState {
    return { ...this.state };
  }
  
  reset(): void {
    this.state = {
      step: 'idle',
      isCreating: true,
      data: {},
      errors: [],
    };
  }
  
  async processInput(input: string): Promise<AIRAResponse> {
    const { intent, extractedData } = detectIntent(input);
    
    // Handle cancel at any step
    if (intent === 'cancel') {
      this.reset();
      return {
        content: "No problem! I've cancelled the customer creation. What else can I help you with?",
        suggestions: ['Create customer', 'View schedule', 'Create job'],
        nextStep: 'idle',
      };
    }
    
    // Route based on current step
    switch (this.state.step) {
      case 'idle':
        return this.handleIdle(intent, extractedData);
        
      case 'collecting_name':
        return this.handleCollectingName(input, extractedData);
        
      case 'collecting_type':
        return this.handleCollectingType(input, extractedData);
        
      case 'collecting_phone':
        return this.handleCollectingPhone(input, extractedData);
        
      case 'collecting_email':
        return this.handleCollectingEmail(input, extractedData);
        
      case 'collecting_address':
        return this.handleCollectingAddress(input);
        
      case 'confirming':
        return this.handleConfirming(intent);
        
      default:
        return this.handleIdle(intent, extractedData);
    }
  }
  
  private handleIdle(intent: string, extractedData?: Partial<CustomerFormData>): AIRAResponse {
    if (intent === 'create_customer') {
      this.state.step = 'collecting_name';
      this.state.isCreating = true;
      
      if (extractedData?.firstName) {
        this.state.data = { ...this.state.data, ...extractedData };
        
        if (this.state.data.lastName) {
          // We have both names, move to type
          this.state.step = 'collecting_type';
          return {
            content: `Got it! Creating a customer for ${this.state.data.firstName} ${this.state.data.lastName}. What type of customer is this?`,
            suggestions: ['Residential', 'Commercial', 'Contractor'],
            nextStep: 'collecting_type',
          };
        } else {
          return {
            content: `Hi! I'm creating a customer for ${this.state.data.firstName}. What's their last name?`,
            suggestions: [],
            nextStep: 'collecting_name',
          };
        }
      }
      
      return {
        content: "I'll help you create a new customer! What's their name?",
        suggestions: ['John Smith', 'Jane Doe'],
        nextStep: 'collecting_name',
      };
    }
    
    return {
      content: "I can help you manage customers. What would you like to do?",
      suggestions: ['Create customer', 'Find customer', 'Update customer'],
      nextStep: 'idle',
    };
  }
  
  private handleCollectingName(input: string, extractedData?: Partial<CustomerFormData>): AIRAResponse {
    // Try to extract name from input
    const words = input.trim().split(/\s+/);
    
    if (words.length >= 1) {
      this.state.data.firstName = capitalize(words[0]);
      if (words.length >= 2) {
        this.state.data.lastName = words.slice(1).map(capitalize).join(' ');
      }
    }
    
    if (extractedData?.firstName) {
      this.state.data.firstName = extractedData.firstName;
    }
    if (extractedData?.lastName) {
      this.state.data.lastName = extractedData.lastName;
    }
    
    if (this.state.data.firstName && this.state.data.lastName) {
      this.state.step = 'collecting_type';
      return {
        content: `Great! ${this.state.data.firstName} ${this.state.data.lastName}. What type of customer is this - Residential, Commercial, or Contractor?`,
        suggestions: ['Residential', 'Commercial', 'Contractor'],
        nextStep: 'collecting_type',
      };
    } else if (this.state.data.firstName) {
      return {
        content: `Got ${this.state.data.firstName}. What's their last name?`,
        suggestions: [],
        nextStep: 'collecting_name',
      };
    }
    
    return {
      content: "I didn't catch that. What's the customer's first and last name?",
      suggestions: [],
      nextStep: 'collecting_name',
    };
  }
  
  private handleCollectingType(input: string, extractedData?: Partial<CustomerFormData>): AIRAResponse {
    const lower = input.toLowerCase();
    
    if (lower.includes('residential') || lower.includes('home')) {
      this.state.data.type = 'RESIDENTIAL';
    } else if (lower.includes('commercial') || lower.includes('business')) {
      this.state.data.type = 'COMMERCIAL';
    } else if (lower.includes('contractor')) {
      this.state.data.type = 'CONTRACTOR';
    } else if (extractedData?.type) {
      this.state.data.type = extractedData.type;
    }
    
    if (this.state.data.type) {
      this.state.step = 'collecting_phone';
      return {
        content: `${this.state.data.type.charAt(0) + this.state.data.type.slice(1).toLowerCase()} customer. What's the best phone number to reach ${this.state.data.firstName}?`,
        suggestions: ['Skip for now'],
        nextStep: 'collecting_phone',
      };
    }
    
    return {
      content: "Please choose: Residential, Commercial, or Contractor?",
      suggestions: ['Residential', 'Commercial', 'Contractor'],
      nextStep: 'collecting_type',
    };
  }
  
  private handleCollectingPhone(input: string, extractedData?: Partial<CustomerFormData>): AIRAResponse {
    const lower = input.toLowerCase();
    
    if (lower.includes('skip')) {
      this.state.step = 'collecting_email';
      return {
        content: "No problem! Do you have an email address for them?",
        suggestions: ['Skip for now'],
        nextStep: 'collecting_email',
      };
    }
    
    // Try to extract phone
    const phoneMatch = input.match(/(?:\+?1?[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/);
    if (phoneMatch || extractedData?.mobilePhone) {
      if (phoneMatch) {
        this.state.data.mobilePhone = `+1${phoneMatch[1]}${phoneMatch[2]}${phoneMatch[3]}`;
      } else if (extractedData?.mobilePhone) {
        this.state.data.mobilePhone = extractedData.mobilePhone;
      }
      
      this.state.step = 'collecting_email';
      return {
        content: `Got it, ${formatPhone(this.state.data.mobilePhone!)}. Do you have an email address?`,
        suggestions: ['Skip for now'],
        nextStep: 'collecting_email',
      };
    }
    
    return {
      content: "I didn't recognize that phone number. Please enter a 10-digit phone number (e.g., 512-555-1234).",
      suggestions: ['Skip for now'],
      nextStep: 'collecting_phone',
    };
  }
  
  private handleCollectingEmail(input: string, extractedData?: Partial<CustomerFormData>): AIRAResponse {
    const lower = input.toLowerCase();
    
    if (lower.includes('skip') || lower.includes('no') || lower === 'none') {
      this.state.step = 'collecting_address';
      return {
        content: "No email added. What's the service address?",
        suggestions: ['Skip for now'],
        nextStep: 'collecting_address',
      };
    }
    
    // Try to extract email
    const emailMatch = input.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch || extractedData?.email) {
      const email = emailMatch ? emailMatch[0].toLowerCase() : extractedData!.email!;
      
      // Validate email
      const validation = customerValidation.email.safeParse(email);
      if (!validation.success) {
        return {
          content: "That doesn't look like a valid email. Please try again or skip.",
          suggestions: ['Skip for now'],
          nextStep: 'collecting_email',
        };
      }
      
      this.state.data.email = email;
      this.state.step = 'collecting_address';
      return {
        content: `Great, ${this.state.data.email}. What's the service address?`,
        suggestions: ['Skip for now'],
        nextStep: 'collecting_address',
      };
    }
    
    return {
      content: "I didn't catch that email. Please enter a valid email address or skip.",
      suggestions: ['Skip for now'],
      nextStep: 'collecting_email',
    };
  }
  
  private handleCollectingAddress(input: string): AIRAResponse {
    const lower = input.toLowerCase();
    
    if (lower.includes('skip') || lower.includes('no') || lower === 'none') {
      this.state.step = 'confirming';
      return this.generateConfirmation();
    }
    
    // Try to parse address
    const address = parseAddress(input);
    if (address && address.street && address.city && address.state && address.zip) {
      this.state.data.address = address as CustomerFormData['address'];
      this.state.step = 'confirming';
      return this.generateConfirmation();
    }
    
    // Try partial parsing - just get what we can
    if (input.trim().length > 5) {
      // For now, store as street only and ask for more
      return {
        content: "I need a complete address with street, city, state, and ZIP code. For example: '123 Main St, Austin, TX 78701'",
        suggestions: ['Skip for now'],
        nextStep: 'collecting_address',
      };
    }
    
    return {
      content: "Please enter the full service address (street, city, state, ZIP), or skip for now.",
      suggestions: ['Skip for now'],
      nextStep: 'collecting_address',
    };
  }
  
  private generateConfirmation(): AIRAResponse {
    const d = this.state.data;
    let summary = `Let me confirm the new customer:\n\n`;
    summary += `👤 **${d.firstName} ${d.lastName}**\n`;
    summary += `📋 Type: ${d.type}\n`;
    if (d.mobilePhone) summary += `📱 Phone: ${formatPhone(d.mobilePhone)}\n`;
    if (d.email) summary += `📧 Email: ${d.email}\n`;
    if (d.address) {
      summary += `📍 Address: ${d.address.street}, ${d.address.city}, ${d.address.state} ${d.address.zip}\n`;
    }
    summary += `\nShould I save this customer?`;
    
    return {
      content: summary,
      suggestions: ['Yes, save it', 'No, make changes', 'Cancel'],
      nextStep: 'confirming',
    };
  }
  
  private async handleConfirming(intent: string): Promise<AIRAResponse> {
    if (intent === 'confirm') {
      this.state.step = 'saving';
      
      try {
        // Build the customer payload
        const payload: Partial<Customer> = {
          type: this.state.data.type || 'RESIDENTIAL',
          firstName: this.state.data.firstName,
          lastName: this.state.data.lastName,
          companyName: this.state.data.companyName,
          mobilePhone: this.state.data.mobilePhone,
          email: this.state.data.email,
          notes: this.state.data.notes,
        };
        
        // Add address if provided
        if (this.state.data.address) {
          (payload as any).addresses = [{
            type: 'SERVICE' as const,
            street: this.state.data.address.street,
            streetLine2: this.state.data.address.streetLine2,
            city: this.state.data.address.city,
            state: this.state.data.address.state,
            zip: this.state.data.address.zip,
            country: this.state.data.address.country || 'US',
          }];
        }
        
        const customer = await customerService.createCustomer(payload);
        
        this.state.step = 'complete';
        const savedData = { ...this.state.data };
        this.reset();
        
        return {
          content: `✅ Customer created!\n\n**${savedData.firstName} ${savedData.lastName}**\nCustomer #: ${customer.customerNumber || customer.id.slice(0, 8)}\n\nWould you like to schedule a job for this customer?`,
          suggestions: ['Schedule job', 'Create estimate', 'Add another customer'],
          action: 'customer_created',
          customer,
          nextStep: 'idle',
        };
      } catch (error: any) {
        this.state.step = 'error';
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        
        // Check for duplicate email
        if (errorMessage.toLowerCase().includes('email already exists')) {
          return {
            content: `⚠️ A customer with email "${this.state.data.email}" already exists. Would you like to:\n\n• Use a different email\n• View the existing customer\n• Continue without email`,
            suggestions: ['Use different email', 'View existing', 'Remove email'],
            nextStep: 'collecting_email',
          };
        }
        
        return {
          content: `❌ Sorry, I couldn't save the customer: ${errorMessage}\n\nWould you like to try again?`,
          suggestions: ['Try again', 'Cancel'],
          nextStep: 'confirming',
        };
      }
    }
    
    // User wants changes
    this.state.step = 'collecting_name';
    return {
      content: "No problem! Let's start over. What's the customer's name?",
      suggestions: [],
      nextStep: 'collecting_name',
    };
  }
  
  // Check if we're in a customer flow
  isActive(): boolean {
    return this.state.step !== 'idle' && this.state.step !== 'complete';
  }
}

// Singleton instance
export const customerFlow = new CustomerFlowHandler();

