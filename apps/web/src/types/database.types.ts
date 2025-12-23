/**
 * Frontend Types - Aligned with PostgreSQL Schema
 * 
 * This file contains TypeScript interfaces that match the Prisma schema.
 * Use these types for all API interactions to ensure type safety.
 */

// ============================================================================
// ENUMS - Match Prisma/PostgreSQL enums exactly
// ============================================================================

export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED';
export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type PlanTier = 'STARTER' | 'ESSENTIALS' | 'PRO' | 'ENTERPRISE';

export type CustomerType = 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR';
export type CustomerVerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'PENDING';
export type CustomerCreatedSource = 'WEB' | 'MOBILE' | 'VOICE_AGENT' | 'API' | 'IMPORT';
export type AddressType = 'SERVICE' | 'BILLING' | 'PRIMARY';

export type EmployeeRole = 'OWNER' | 'ADMIN' | 'OFFICE_STAFF' | 'DISPATCHER' | 'FIELD_TECH' | 'SALES_REP';
export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type JobStatus = 
  | 'UNSCHEDULED' 
  | 'SCHEDULED' 
  | 'DISPATCHED' 
  | 'EN_ROUTE' 
  | 'IN_PROGRESS' 
  | 'ON_HOLD' 
  | 'COMPLETED' 
  | 'INVOICED' 
  | 'PAID' 
  | 'CANCELLED';

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
export type JobSource = 'MANUAL' | 'ONLINE_BOOKING' | 'PHONE' | 'API' | 'RECURRING' | 'ESTIMATE';
export type AssignmentRole = 'PRIMARY' | 'SECONDARY' | 'HELPER';

export type LineItemType = 'SERVICE' | 'MATERIAL' | 'LABOR' | 'FEE' | 'DISCOUNT' | 'TAX';
export type ChecklistValueType = 'BOOLEAN' | 'TEXT' | 'NUMBER' | 'STOPLIGHT' | 'PHOTO' | 'SIGNATURE' | 'SELECT' | 'MULTI_SELECT';
export type AttachmentType = 'PHOTO' | 'DOCUMENT' | 'SIGNATURE' | 'VIDEO' | 'AUDIO';

export type EstimateStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'APPROVED' | 'DECLINED' | 'EXPIRED' | 'CONVERTED';
export type DiscountType = 'NONE' | 'PERCENT' | 'FIXED';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID' | 'REFUNDED';
export type PaymentTerms = 'DUE_ON_RECEIPT' | 'NET_7' | 'NET_15' | 'NET_30' | 'NET_60';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'ACH' | 'CHECK' | 'CASH' | 'FINANCING' | 'OTHER';

export type AgreementStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
export type BillingFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export type MessageChannel = 'SMS' | 'EMAIL' | 'PUSH' | 'VOICE' | 'IN_APP';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
export type MessageTrigger = 
  | 'MANUAL' 
  | 'JOB_SCHEDULED' 
  | 'JOB_DISPATCHED' 
  | 'TECH_EN_ROUTE' 
  | 'JOB_COMPLETED' 
  | 'INVOICE_SENT' 
  | 'PAYMENT_RECEIVED' 
  | 'ESTIMATE_SENT' 
  | 'APPOINTMENT_REMINDER' 
  | 'REVIEW_REQUEST' 
  | 'MEMBERSHIP_RENEWAL';

// ============================================================================
// TENANT & ORGANIZATION
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  industryId?: string;
  industry?: Industry;
  timezone: string;
  locale: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  settings: Record<string, any>;
  featureFlags: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  defaultServices: string[];
  sortOrder: number;
  isActive: boolean;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  tier: PlanTier;
  description?: string;
  monthlyPrice: number;
  annualPrice?: number;
  maxUsers?: number;
  maxCustomers?: number;
  maxJobsPerMonth?: number;
  features: Record<string, boolean>;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  plan?: Plan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  seatCount: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string;
}

export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  legalName?: string;
  dbaName?: string;
  taxId?: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  street?: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  employeeCount: number;
  foundedYear?: number;
}

// ============================================================================
// USER & EMPLOYEE
// ============================================================================

export interface User {
  id: string;
  tenantId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string; // Computed: firstName + lastName
  phone?: string;
  avatarUrl?: string;
  role: EmployeeRole;
  isActive: boolean;
  isVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId?: string;
  user?: User;
  tenantId: string;
  employeeNumber?: string;
  // Employee's own fields (for employees without user accounts)
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  hireDate?: string;
  terminationDate?: string;
  jobTitle?: string;
  department?: string;
  colorHex: string;
  hourlyRate?: number;
  overtimeRate?: number;
  commissionRate: number;
  canBeBookedOnline: boolean;
  isDispatchEnabled: boolean;
  receivesDispatchNotifications: boolean;
  serviceArea?: GeoJSON;
  maxDailyJobs?: number;
  certifications: Certification[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  isArchived: boolean;
  archivedAt?: string;
  skills?: EmployeeSkill[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSkill {
  id: string;
  employeeId: string;
  skillId: string;
  skill?: Skill;
  proficiencyLevel: ProficiencyLevel;
  certifiedAt?: string;
  certificationExpires?: string;
  certificationNumber?: string;
  notes?: string;
}

export interface Skill {
  id: string;
  tenantId: string;
  name: string;
  category?: string;
  description?: string;
  requiresCertification: boolean;
  certificationName?: string;
  isActive: boolean;
}

export interface Certification {
  name: string;
  number?: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
}

export interface GeoJSON {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][];
}

// ============================================================================
// CUSTOMER & ADDRESS
// ============================================================================

export interface Customer {
  id: string;
  tenantId: string;
  customerNumber?: string;
  type: CustomerType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  displayName: string; // Computed: companyName || firstName + lastName
  email?: string;
  mobilePhone?: string;
  homePhone?: string;
  workPhone?: string;
  preferredContactMethod: MessageChannel;
  notificationsEnabled: boolean;
  doNotService: boolean;
  doNotServiceReason?: string;
  leadSourceId?: string;
  leadSource?: LeadSource;
  referredByCustomerId?: string;
  referredBy?: Customer;
  lifetimeValue: number;
  totalJobs: number;
  notes?: string;
  customFields: Record<string, any>;
  isArchived: boolean;
  archivedAt?: string;
  createdById?: string;
  createdBy?: User;
  addresses: Address[];
  tags: Tag[];
  verificationStatus?: CustomerVerificationStatus;
  createdSource?: CustomerCreatedSource;
  createdAt: string;
  updatedAt: string;
  // Snake_case aliases for backward compatibility with frontend pages
  verification_status?: CustomerVerificationStatus;
  created_source?: CustomerCreatedSource;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  mobile_number?: string;
  home_number?: string;
  work_number?: string;
  company?: string;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Address {
  id: string;
  customerId: string;
  type: AddressType;
  name?: string;
  street: string;
  streetLine2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  accessNotes?: string;
  gateCode?: string;
  isVerified: boolean;
  properties?: Property[];
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  addressId: string;
  name: string;
  equipmentType?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
  warrantyExpiry?: string;
  lastServiceDate?: string;
  nextServiceDue?: string;
  condition?: string;
  locationInHome?: string;
  notes?: string;
  specifications: Record<string, any>;
  photoUrls: string[];
  isActive: boolean;
}

export interface Tag {
  id: string;
  tenantId: string;
  name: string;
  colorHex: string;
  entityType: 'customer' | 'job' | 'employee';
}

export interface LeadSource {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
}

// ============================================================================
// JOB & SCHEDULING
// ============================================================================

export interface Job {
  id: string;
  tenantId: string;
  jobNumber: string;
  customerId: string;
  customer?: CustomerSummary;
  addressId: string;
  address?: AddressSummary;
  jobTypeId?: string;
  jobType?: JobType;
  status: JobStatus;
  priority: JobPriority;
  source: JobSource;
  title: string;
  description?: string;
  internalNotes?: string;
  
  // Scheduling
  scheduledStart?: string;
  scheduledEnd?: string;
  arrivalWindowStart?: string;
  arrivalWindowEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  estimatedDuration: number;
  
  // Relationships
  parentJobId?: string;
  parentJob?: Job;
  isCallback: boolean;
  callbackReason?: string;
  estimateId?: string;
  estimate?: Estimate;
  serviceAgreementId?: string;
  serviceAgreement?: ServiceAgreement;
  
  // Financials
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  
  // Tracking
  dispatchedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  
  customFields: Record<string, any>;
  createdById?: string;
  createdBy?: User;
  
  // Relations
  assignments: JobAssignment[];
  lineItems: JobLineItem[];
  attachments: JobAttachment[];
  checklists: JobChecklist[];
  
  createdAt: string;
  updatedAt: string;
}

export interface JobType {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  colorHex: string;
  defaultDuration: number;
  defaultPriority: JobPriority;
  sortOrder: number;
  isActive: boolean;
}

export interface JobAssignment {
  id: string;
  jobId: string;
  employeeId: string;
  employee?: EmployeeSummary;
  role: AssignmentRole;
  commissionRate?: number;
  notifiedAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobLineItem {
  id: string;
  jobId: string;
  type: LineItemType;
  serviceId?: string;
  service?: Service;
  materialId?: string;
  material?: Material;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  isTaxable: boolean;
  total: number; // Computed
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobAttachment {
  id: string;
  jobId: string;
  type: AttachmentType;
  name?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize?: number;
  mimeType?: string;
  isBefore: boolean;
  uploadedById?: string;
  uploadedBy?: User;
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
}

export interface JobChecklist {
  id: string;
  jobId: string;
  checklistTemplateId?: string;
  checklistTemplate?: ChecklistTemplate;
  name: string;
  isCompleted: boolean;
  completedAt?: string;
  completedById?: string;
  completedBy?: User;
  items: JobChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface JobChecklistItem {
  id: string;
  jobChecklistId: string;
  templateItemId?: string;
  label: string;
  valueType: ChecklistValueType;
  isRequired: boolean;
  value?: string;
  photoUrl?: string;
  completedAt?: string;
  completedById?: string;
  completedBy?: User;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PRICE BOOK (Services & Materials)
// ============================================================================

export interface Category {
  id: string;
  tenantId: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  name: string;
  description?: string;
  type: 'SERVICE' | 'MATERIAL';
  sortOrder: number;
  isActive: boolean;
}

export interface Service {
  id: string;
  tenantId: string;
  categoryId?: string;
  category?: Category;
  sku?: string;
  name: string;
  description?: string;
  unitPrice: number;
  unitCost: number;
  unitOfMeasure: string;
  estimatedDuration: number;
  isTaxable: boolean;
  taxRateOverride?: number;
  isOnlineBookable: boolean;
  isFavorite: boolean;
  requiredSkills: string[];
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  tenantId: string;
  categoryId?: string;
  category?: Category;
  sku?: string;
  name: string;
  description?: string;
  unitCost: number;
  markupPercent: number;
  unitPrice: number; // Computed: unitCost * (1 + markupPercent/100)
  unitOfMeasure: string;
  manufacturer?: string;
  manufacturerPartNumber?: string;
  vendorPartNumber?: string;
  isTaxable: boolean;
  qtyOnHand: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LaborRate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  hourlyRate: number;
  overtimeMultiplier: number;
  emergencyMultiplier: number;
  isDefault: boolean;
  isActive: boolean;
}

// ============================================================================
// TEMPLATES
// ============================================================================

export interface ChecklistTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category?: string;
  isRequiredForCompletion: boolean;
  sortOrder: number;
  isActive: boolean;
  items: ChecklistTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistTemplateItem {
  id: string;
  checklistTemplateId: string;
  label: string;
  valueType: ChecklistValueType;
  isRequired: boolean;
  defaultValue?: string;
  options?: string[];
  helpText?: string;
  sortOrder: number;
}

export interface JobTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  jobTypeId?: string;
  jobType?: JobType;
  estimatedDuration: number;
  defaultPriority: JobPriority;
  defaultServices: string[];
  defaultMaterials: string[];
  checklistTemplateId?: string;
  checklistTemplate?: ChecklistTemplate;
  instructions?: string;
  isOnlineBookable: boolean;
  colorHex?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface EstimateTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category?: string;
  validDays: number;
  defaultMessage?: string;
  termsAndConditions?: string;
  isActive: boolean;
  options: EstimateTemplateOption[];
}

export interface EstimateTemplateOption {
  id: string;
  estimateTemplateId: string;
  name: string;
  description?: string;
  isRecommended: boolean;
  discountType: DiscountType;
  discountValue: number;
  sortOrder: number;
  lineItems: EstimateTemplateLineItem[];
}

export interface EstimateTemplateLineItem {
  id: string;
  estimateTemplateOptionId: string;
  type: LineItemType;
  serviceId?: string;
  service?: Service;
  materialId?: string;
  material?: Material;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  isOptional: boolean;
  sortOrder: number;
}

export interface MessageTemplate {
  id: string;
  tenantId: string;
  name: string;
  channel: MessageChannel;
  triggerType: MessageTrigger;
  subject?: string;
  body: string;
  variables: string[];
  delayMinutes: number;
  isActive: boolean;
}

// ============================================================================
// ESTIMATES
// ============================================================================

export interface Estimate {
  id: string;
  tenantId: string;
  estimateNumber: string;
  customerId: string;
  customer?: CustomerSummary;
  addressId: string;
  address?: AddressSummary;
  status: EstimateStatus;
  
  title?: string;
  message?: string;
  termsAndConditions?: string;
  
  validUntil?: string;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  declinedAt?: string;
  expiredAt?: string;
  
  approvedOptionId?: string;
  signatureUrl?: string;
  signedName?: string;
  signedAt?: string;
  
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  
  options: EstimateOption[];
  
  createdById?: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateOption {
  id: string;
  estimateId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isRecommended: boolean;
  
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  
  sortOrder: number;
  lineItems: EstimateLineItem[];
}

export interface EstimateLineItem {
  id: string;
  estimateOptionId: string;
  type: LineItemType;
  serviceId?: string;
  service?: Service;
  materialId?: string;
  material?: Material;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  isTaxable: boolean;
  isOptional: boolean;
  isSelected: boolean;
  sortOrder: number;
}

// ============================================================================
// INVOICES & PAYMENTS
// ============================================================================

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  customerId: string;
  customer?: CustomerSummary;
  jobId?: string;
  job?: JobSummary;
  status: InvoiceStatus;
  
  issueDate: string;
  dueDate: string;
  terms: PaymentTerms;
  
  poNumber?: string;
  message?: string;
  footerNotes?: string;
  
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number; // Computed: total - amountPaid
  
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  voidedAt?: string;
  voidReason?: string;
  
  qboInvoiceId?: string;
  stripeInvoiceId?: string;
  
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  
  createdById?: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  jobLineItemId?: string;
  type: LineItemType;
  serviceId?: string;
  service?: Service;
  materialId?: string;
  material?: Material;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  isTaxable: boolean;
  total: number; // Computed
  sortOrder: number;
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  
  transactionId?: string;
  authorizationCode?: string;
  cardBrand?: string;
  cardLastFour?: string;
  checkNumber?: string;
  
  processedAt?: string;
  failedAt?: string;
  failureReason?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  
  collectedById?: string;
  collectedBy?: User;
  notes?: string;
  
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SERVICE AGREEMENTS
// ============================================================================

export interface ServicePlan {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  billingFrequency: BillingFrequency;
  durationMonths: number;
  includedVisits: number;
  discountPercent: number;
  priorityScheduling: boolean;
  coveredServices: string[];
  addOns: ServicePlanAddOn[];
  termsAndConditions?: string;
  isActive: boolean;
}

export interface ServicePlanAddOn {
  name: string;
  price: number;
  description?: string;
}

export interface ServiceAgreement {
  id: string;
  tenantId: string;
  agreementNumber: string;
  customerId: string;
  customer?: CustomerSummary;
  addressId: string;
  address?: AddressSummary;
  planId: string;
  plan?: ServicePlan;
  status: AgreementStatus;
  
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  autoRenew: boolean;
  
  monthlyAmount: number;
  visitsIncluded: number;
  visitsUsed: number;
  visitsRemaining: number; // Computed
  
  coveredEquipment: CoveredEquipment[];
  addOns: string[];
  
  signedAt?: string;
  signatureUrl?: string;
  signedName?: string;
  
  cancelledAt?: string;
  cancellationReason?: string;
  
  stripeSubscriptionId?: string;
  
  notes?: string;
  createdById?: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CoveredEquipment {
  propertyId?: string;
  name: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
}

// ============================================================================
// COMMUNICATION
// ============================================================================

export interface Message {
  id: string;
  tenantId: string;
  customerId?: string;
  customer?: CustomerSummary;
  jobId?: string;
  job?: JobSummary;
  templateId?: string;
  template?: MessageTemplate;
  
  channel: MessageChannel;
  direction: 'INBOUND' | 'OUTBOUND';
  status: MessageStatus;
  
  fromAddress?: string;
  toAddress: string;
  subject?: string;
  body: string;
  
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  failureReason?: string;
  
  externalId?: string;
  metadata: Record<string, any>;
  
  createdById?: string;
  createdBy?: User;
  createdAt: string;
}

// ============================================================================
// SUMMARY TYPES (for embedded relations)
// ============================================================================

export interface CustomerSummary {
  id: string;
  customerNumber?: string;
  type: CustomerType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  displayName: string;
  email?: string;
  mobilePhone?: string;
}

export interface AddressSummary {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string; // Computed: street, city, state zip
}

export interface EmployeeSummary {
  id: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  colorHex: string;
  jobTitle?: string;
}

export interface JobSummary {
  id: string;
  jobNumber: string;
  title: string;
  status: JobStatus;
  scheduledStart?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateCustomerRequest {
  type?: CustomerType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  mobilePhone?: string;
  homePhone?: string;
  workPhone?: string;
  preferredContactMethod?: MessageChannel;
  notificationsEnabled?: boolean;
  notes?: string;
  // Primary address
  street?: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface UpdateCustomerRequest {
  type?: CustomerType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  mobilePhone?: string;
  homePhone?: string;
  workPhone?: string;
  preferredContactMethod?: MessageChannel;
  notificationsEnabled?: boolean;
  doNotService?: boolean;
  doNotServiceReason?: string;
  notes?: string;
  verificationStatus?: CustomerVerificationStatus;
}

export interface CreateJobRequest {
  customerId: string;
  addressId?: string;
  jobTypeId?: string;
  title: string;
  description?: string;
  internalNotes?: string;
  priority?: JobPriority;
  source?: JobSource;
  scheduledStart?: string;
  scheduledEnd?: string;
  estimatedDuration?: number;
  estimateId?: string;
  serviceAgreementId?: string;
  assignedEmployeeIds?: string[];
  lineItems?: CreateJobLineItemRequest[];
}

export interface CreateJobLineItemRequest {
  type: LineItemType;
  serviceId?: string;
  materialId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  isTaxable?: boolean;
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  internalNotes?: string;
  status?: JobStatus;
  priority?: JobPriority;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  cancellationReason?: string;
}

export interface CreateInvoiceRequest {
  customerId: string;
  jobId?: string;
  dueDate: string;
  terms?: PaymentTerms;
  poNumber?: string;
  message?: string;
  footerNotes?: string;
  taxRate?: number;
  lineItems?: CreateInvoiceLineItemRequest[];
}

export interface CreateInvoiceLineItemRequest {
  type: LineItemType;
  serviceId?: string;
  materialId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  isTaxable?: boolean;
}

export interface CreatePaymentRequest {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  authorizationCode?: string;
  cardBrand?: string;
  cardLastFour?: string;
  checkNumber?: string;
  notes?: string;
}

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CustomerFilters {
  search?: string;
  type?: CustomerType;
  includeArchived?: boolean;
}

export interface JobFilters {
  search?: string;
  status?: JobStatus | JobStatus[];
  priority?: JobPriority | JobPriority[];
  customerId?: string;
  employeeId?: string;
  jobTypeId?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
}

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus | InvoiceStatus[];
  customerId?: string;
  jobId?: string;
  dueBefore?: string;
  dueAfter?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

