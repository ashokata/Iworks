# HouseCallPro Integration Plan for Field Smart Pro

## Overview

This document outlines a comprehensive plan for implementing the HouseCallPro features and data model into our Field Smart Pro multi-tenant application. Based on the analysis of the Pet folder containing HouseCallPro's data model and UI screenshots, we've identified several key areas where we can enhance our platform.

## 1. Core Data Model Enhancements

### 1.1 Job Management System

HouseCallPro has a robust job management system with templates, checklists, and service items. Let's implement these features in Field Smart Pro.

#### Implementation Details:

```typescript
// src/types/index.ts - Add these interfaces

// Enhanced Job type
interface EnhancedJob extends Job {
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

interface ChecklistItem {
  id: string;
  subject: string;
  valueType: 'boolean' | 'stop_light' | 'text';
  value: any;
  required: boolean;
  completed: boolean;
  orderIndex: number;
}

interface Material {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  taxable: boolean;
}

interface JobTemplate {
  id: string;
  name: string;
  description: string;
  jobType: string;
  checklistTemplateIds: string[];
  materialIds: string[];
  serviceIds: string[];
}
```

### 1.2 Customer Management

HouseCallPro's customer management system includes detailed customer profiles, multiple address management, service history, and communication preferences.

#### Implementation Details:

```typescript
// src/types/index.ts - Add these interfaces

interface EnhancedCustomer {
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

interface Address {
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
```

### 1.3 Price Book and Service Catalog

HouseCallPro features a detailed service catalog with rich descriptions, pricing, and material tracking.

#### Implementation Details:

```typescript
// src/types/index.ts - Add these interfaces

interface ServiceItem {
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

interface PriceBookCategory {
  id: string;
  name: string;
  industryId: string;
  orderIndex: number;
}

interface Industry {
  id: string;
  name: string;
  active: boolean;
}
```

### 1.4 Enhanced Employee Management and Permissions

HouseCallPro implements a detailed role-based permission system for different employee types.

#### Implementation Details:

```typescript
// src/types/index.ts - Add these interfaces

interface EnhancedEmployee {
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

interface EmployeePermissions {
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
```

## 2. UI Enhancements Based on HouseCallPro Screenshots

### 2.1 Calendar and Scheduling Interface

Based on the Calendar1.png, Calendar2.png, and Calendar3.png images, we should implement:

- A weekly calendar view with color-coded jobs by status or employee
- Drag-and-drop job scheduling
- Different views (day, week, month)
- Job details on hover
- Time slots clearly defined

### 2.2 Customer View

Based on CustomerPage.png and CustomerView_Invoice.png:

- Tabbed interface for customer details
- Service history section
- Equipment/Assets tracking
- Invoice history with status indicators
- Communication timeline

### 2.3 Job Templates and Checklists

Based on Estimate_Template*.png images:

- Customizable estimate templates
- Multi-section job checklists
- Before/after photo attachments
- Digital signature capture
- Material tracking with inventory integration

### 2.4 Permission Management

Based on FieldTech_Permissions.png, OfficeStaff_Permissions.png, and AdminPermissions.png:

- Granular role-based permission settings
- Permission templates for common roles
- Visual indicators for permission levels
- Bulk permission management

## 3. Implementation Plan

### Phase 1: Data Model Enhancement (2 weeks)

1. Update database schema and TypeScript interfaces
2. Create migration scripts for existing data
3. Set up mock data for testing

### Phase 2: Core Feature Implementation (4 weeks)

1. Job Management System
   - Job templates
   - Checklists
   - Job status workflow

2. Service Catalog
   - Price book management
   - Service descriptions
   - Material tracking

3. Customer Management
   - Enhanced customer profiles
   - Multiple addresses
   - Service history

### Phase 3: UI Development (3 weeks)

1. Calendar and scheduling interface
2. Customer view enhancements
3. Mobile-friendly job management interfaces
4. Permission management screens

### Phase 4: Testing and Refinement (2 weeks)

1. User acceptance testing
2. Performance optimization
3. Bug fixes and refinements

## 4. Key Features from HouseCallPro's Business Model

### 4.1 Checklists and Quality Control

The `ChecklistTemplates.json` file reveals how HouseCallPro ensures consistent service quality:

- Pre-defined checklists for common job types
- Different input types (boolean, stoplight, text)
- Required vs. optional checklist items
- Order-specific checklist items

### 4.2 Industry-Specific Content

From the `Industry.json` and `IndustryServiceItem.json` files, we see that HouseCallPro tailors content by industry:

- Industry-specific service items
- Pricing templates by industry
- Custom fields relevant to specific industries

### 4.3 Permission Structure

The `Permissionmessages.json` file shows HouseCallPro's approach to role-based security:

- Detailed explanations for each permission
- Grouped by role type (Admin, Field Tech, Office Staff)
- Fine-grained control over feature access

### 4.4 Business Rules

From various files including `BusinessHours.json` and `Features.json`:

- Configurable business hours
- Feature flags for different subscription tiers
- Booking rules and availability management

## 5. UI Mockups

Below are references to key UI elements from HouseCallPro we should implement:

### Calendar Interface
The calendar interface shown in Calendar1.png provides a clean, intuitive scheduling system with:
- Color-coded appointments
- Clear time slots
- Employee assignment visibility
- Status indicators

### Customer Management
CustomerPage.png demonstrates a comprehensive customer view with:
- Contact information
- Service history
- Equipment owned
- Notes and communication history

### Invoicing
CustomerView_Invoice.png and CustomerView_Invoice2.png show detailed invoicing with:
- Line-item breakdown
- Payment status
- Service details
- Customer-facing presentation

### Employee Management
CommissionRate_Employee.png shows how to handle employee compensation:
- Commission structures
- Performance tracking
- Role-specific settings

## 6. Integration with Existing Code

To integrate these features with our current codebase, we'll need to:

1. Expand our current Job model in `src/types/index.ts`
2. Update our API client in `src/services/apiClient.ts` to handle new endpoints
3. Create new components for checklists, service catalog, and enhanced job management
4. Update our authentication and permission system to support the granular permissions

## 7. Next Steps

1. Review this implementation plan with the team
2. Prioritize features based on business impact
3. Create detailed technical specifications for each component
4. Begin development with the core data model enhancements

## 8. Appendix: Reference Files

Key reference files from the HouseCallPro Pet folder:
- Organization.json - Tenant structure
- Customer.json - Customer data model
- Employees.json - Employee structure and permissions
- service.json - Service catalog structure
- Job Templates.json - Job template structure
- ChecklistTemplates.json - Checklist implementation
- PriceBook.json - Pricing structure
- Permissionmessages.json - Detailed permission descriptions

UI references:
- Calendar1.png, Calendar2.png, Calendar3.png - Scheduling interface
- CustomerPage.png - Customer management
- CustomerView_Invoice.png, CustomerView_Invoice2.png - Invoicing
- Estimate_Template*.png - Estimate creation
- FieldTech_Permissions.png, AdminPermissions.png - Permission management
- Job_Inbox.png - Job management
- MyMoney.png - Financial reporting
