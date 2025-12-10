// Enhanced types for HouseCallPro integration

import { User, AuthState, Tenant, Job } from './index';

/**
 * Enhanced Job type with checklist, materials, and other features from HouseCallPro
 */
export interface EnhancedJob {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  scheduledTime: string;
  location: string;
  customerId: string;
  technicianId: string;
  checklist: ChecklistItem[];
  template?: string;
  materials: Material[];
  estimatedDuration: number;
  jobType: 'Install' | 'Repair' | 'Diagnostic' | 'Maintenance';
  customerSignature?: string;
  technicianNotes?: string;
  business_unit?: string;
  callback?: boolean;
}

/**
 * Checklist item for job quality control
 */
export interface ChecklistItem {
  id: string;
  subject: string;
  valueType: 'boolean' | 'stop_light' | 'text';
  value: any;
  required: boolean;
  completed: boolean;
  orderIndex: number;
}

/**
 * Material used in jobs for tracking inventory and costs
 */
export interface Material {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  taxable: boolean;
}

/**
 * Job template for creating standardized jobs
 */
export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  jobType: string;
  checklistTemplateIds: string[];
  materialIds: string[];
  serviceIds: string[];
}

/**
 * Enhanced customer with more detailed contact info and preferences
 */
export interface EnhancedCustomer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email?: string;
  billableEmail?: string;
  mobileNumber?: string;
  homeNumber?: string;
  workNumber?: string;
  company?: string;
  type: 'homeowner' | 'business' | 'contractor';
  notificationsEnabled: boolean;
  doNotService: boolean;
  tags: string[];
  addresses: Address[];
  hasCardOnFile: boolean;
}

/**
 * Address for customers with multiple locations
 */
export interface Address {
  id: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isPrimary: boolean;
  isBilling: boolean;
}

/**
 * Service item for the service catalog
 */
export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  taxable: boolean;
  materials: Material[];
  estimatedDuration: number;
  trackMaterialUsage: boolean;
  industrySpecific: boolean;
  industryType?: string;
  onlineBookingEnabled: boolean;
}

/**
 * Service category for organizing service items
 */
export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  industryId?: string;
  orderIndex: number;
  active: boolean;
  parentCategoryId?: string;
}

/**
 * Price book category for organizing services
 */
export interface PriceBookCategory {
  id: string;
  name: string;
  industryId: string;
  orderIndex: number;
}

/**
 * Industry for industry-specific content
 */
export interface Industry {
  id: string;
  name: string;
  active: boolean;
}

/**
 * Enhanced employee with detailed permissions
 */
export interface EnhancedEmployee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  mobileNumber?: string;
  role: 'Admin' | 'Field Tech' | 'Office Staff';
  isAdmin: boolean;
  permissions: EmployeePermissions;
  colorHex: string;
  archived: boolean;
}

/**
 * Detailed permissions for granular access control
 */
export interface EmployeePermissions {
  showMarketing: boolean;
  showReporting: boolean;
  showCustomers: boolean;
  showCreateJob: boolean;
  showCompanySetup: boolean;
  showTimeTracking: boolean;
  showFullSchedule: boolean;
  showJobCostingSummary: boolean;
  canChatWithCustomers: boolean;
  canCallAndTextWithCustomers: boolean;
  canAddAndEditJob: boolean;
  canDeleteAndCancelJob: boolean;
  canTakePaymentSeePrices: boolean;
  canManageMobileCheckDeposit: boolean;
  canBeBookedOnline: boolean;
  canSeeHomeData: boolean;
  canShareJob: boolean;
  canEditMessageOnInvoice: boolean;
  canEditCommunicationSettings: boolean;
  canEditPayDetails: boolean;
  showPipeline: boolean;
  showMarketingCenter: boolean;
  viewCallLogs: boolean;
  listenCallRecordings: boolean;
}

/**
 * Checklist template for reusable checklists
 */
export interface ChecklistTemplate {
  id: string;
  title: string;
  required: boolean;
  autoAddToJobs: boolean;
  items: ChecklistTemplateItem[];
}

/**
 * Checklist template item
 */
export interface ChecklistTemplateItem {
  id: string;
  subject: string;
  valueType: 'boolean' | 'stop_light' | 'text';
  orderIndex: number;
  subtitle?: string;
  required: boolean;
}

/**
 * Enhanced tenant with more detailed settings
 */
export interface EnhancedTenant extends Tenant {
  phone_number?: string;
  email?: string;
  contractor_license?: string;
  features: TenantFeature[];
  businessHours: BusinessHours[];
  defaultIndustry?: Industry;
}

/**
 * Feature flag for tenant subscription features
 */
export interface TenantFeature {
  name: string;
  enabled: boolean;
  quantity: number;
}

/**
 * Business hours for scheduling
 */
export interface BusinessHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start: string; // HH:MM format
  end: string;   // HH:MM format
  closed: boolean;
}

/**
 * Invoice item for detailed billing
 */
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxable: boolean;
}

/**
 * Invoice for billing customers
 */
export interface Invoice {
  id: string;
  jobId: string;
  customerId: string;
  tenantId: string;
  createdAt: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  notes?: string;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Cancelled' | 'Partial';
  paidAmount?: number;
  paidDate?: string;
  paymentMethod?: string;
}
