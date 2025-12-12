# Database Migration Plan: DynamoDB → PostgreSQL

## Overview

This document outlines the incremental migration strategy from the current DynamoDB-based storage to the full PostgreSQL relational database schema defined in `infield_works_schema.sql`.

## Current State Analysis

### What's Working (Don't Break)
| Feature | Current Storage | Frontend Fields | Status |
|---------|-----------------|-----------------|--------|
| Customer CRUD | DynamoDB | firstName, lastName, email, phone, address, city, state, zipCode, notes | ✅ Working |
| Customer List | DynamoDB via Lambda | Same as above | ✅ Working |
| LLM Chat | AWS Bedrock | query, history, context | ✅ Working |
| LLM Function Calling | DynamoDB (customers) | createCustomer, searchCustomer | ✅ Working |

### What's Using Mock/OData (Not Working)
| Feature | Attempted Endpoint | Status |
|---------|-------------------|--------|
| Jobs List | /odata/iworks/v1/Jobs | ❌ Returns empty (gracefully) |
| Invoices | /odata/iworks/v1/Invoices | ❌ Returns empty (gracefully) |
| Job Create | /jobs (POST) | ⚠️ Lambda exists but limited |

---

## Migration Phases

### Phase 1: Customer Enhancement (Week 1-2)
**Goal:** Add missing customer fields without breaking existing functionality

#### 1.1 DynamoDB Schema Update
Add new fields to existing Customer interface:
```typescript
interface Customer {
  // Existing (keep)
  customerId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;  // maps to mobile_phone
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  
  // NEW - Phase 1.1
  customerNumber?: string;        // Auto-generated: CUST000001
  type?: 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR';
  companyName?: string;
  displayName?: string;           // Computed: companyName || firstName + lastName
  homePhone?: string;
  workPhone?: string;
  notificationsEnabled?: boolean;
  tags?: string[];
}
```

#### 1.2 Frontend Updates
- Update `customerService.ts` to send/receive new fields
- Update `customers/new/page.tsx` to include new fields
- Update `customers/edit/[id]/page.tsx` to display new fields
- **Backward compatible:** New fields are optional

#### 1.3 Lambda Handler Updates
- Update `create-dynamodb.ts` validation schema
- Update `update-dynamodb.ts` validation schema
- Add customer number generation logic

---

### Phase 2: Addresses Separation (Week 2-3)
**Goal:** Move addresses to separate table/collection for multiple addresses per customer

#### 2.1 New DynamoDB Table: Addresses
```typescript
interface Address {
  addressId: string;
  customerId: string;
  tenantId: string;
  type: 'SERVICE' | 'BILLING' | 'BOTH';
  name?: string;
  street: string;
  streetLine2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude?: number;
  longitude?: number;
  accessNotes?: string;
  gateCode?: string;
  isPrimary: boolean;
  createdAt: number;
  updatedAt: number;
}
```

#### 2.2 Migration Script
1. Read all customers with address fields
2. Create Address record for each customer
3. Link via customerId
4. Keep address fields in Customer for backward compatibility (deprecated)

#### 2.3 Frontend Updates
- Add address management UI in customer edit
- Support multiple addresses
- Primary address selection

---

### Phase 3: Jobs Implementation (Week 3-4)
**Goal:** Implement full Jobs functionality with DynamoDB

#### 3.1 New DynamoDB Table: Jobs
```typescript
interface Job {
  jobId: string;
  tenantId: string;
  jobNumber: string;           // Auto-generated: JOB000001
  customerId: string;
  addressId: string;
  status: 'UNSCHEDULED' | 'SCHEDULED' | 'DISPATCHED' | 'EN_ROUTE' | 
          'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'INVOICED' | 'PAID' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  source: 'MANUAL' | 'ONLINE_BOOKING' | 'PHONE' | 'API' | 'RECURRING';
  title: string;
  description?: string;
  internalNotes?: string;
  scheduledStart?: number;
  scheduledEnd?: number;
  actualStart?: number;
  actualEnd?: number;
  estimatedDuration: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
}
```

#### 3.2 New Lambda Handlers
- `jobs/create-dynamodb.ts`
- `jobs/list-dynamodb.ts`
- `jobs/get-dynamodb.ts`
- `jobs/update-dynamodb.ts`
- `jobs/delete-dynamodb.ts`

#### 3.3 CDK Stack Updates
- Add JobsTable DynamoDB
- Add Lambda functions
- Add API Gateway routes

#### 3.4 Frontend Updates
- Update `jobService.ts` to use new endpoints
- Remove OData dependency
- Update job list/create/edit pages

---

### Phase 4: Templates & Price Book (Week 4-5)
**Goal:** Implement templates system for checklists, jobs, estimates, and messages

#### 4.1 Checklist Templates
```typescript
interface ChecklistTemplate {
  templateId: string;
  tenantId: string;
  name: string;
  description?: string;
  category?: string;
  isRequiredForCompletion: boolean;
  sortOrder: number;
  isActive: boolean;
  items: ChecklistTemplateItem[];
  createdAt: number;
  updatedAt: number;
}

interface ChecklistTemplateItem {
  itemId: string;
  templateId: string;
  label: string;
  valueType: 'BOOLEAN' | 'TEXT' | 'NUMBER' | 'STOPLIGHT' | 'PHOTO' | 'SIGNATURE' | 'SELECT' | 'MULTI_SELECT';
  isRequired: boolean;
  defaultValue?: string;
  options?: string[];  // For SELECT/MULTI_SELECT
  helpText?: string;
  sortOrder: number;
}
```

#### 4.2 Job Templates
```typescript
interface JobTemplate {
  templateId: string;
  tenantId: string;
  name: string;
  description?: string;
  jobTypeId?: string;
  estimatedDuration: number;
  defaultPriority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  defaultServices: string[];  // Service IDs
  defaultMaterials: string[]; // Material IDs
  checklistTemplateId?: string;
  instructions?: string;
  isOnlineBookable: boolean;
  colorHex?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
```

#### 4.3 Estimate Templates (Good/Better/Best)
```typescript
interface EstimateTemplate {
  templateId: string;
  tenantId: string;
  name: string;
  description?: string;
  category?: string;
  validDays: number;
  defaultMessage?: string;
  termsAndConditions?: string;
  options: EstimateTemplateOption[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface EstimateTemplateOption {
  optionId: string;
  name: string;  // "Good", "Better", "Best"
  description?: string;
  isRecommended: boolean;
  discountType: 'NONE' | 'PERCENT' | 'FIXED';
  discountValue: number;
  lineItems: EstimateTemplateLineItem[];
  sortOrder: number;
}
```

#### 4.4 Message Templates
```typescript
interface MessageTemplate {
  templateId: string;
  tenantId: string;
  name: string;
  channel: 'SMS' | 'EMAIL' | 'PUSH' | 'VOICE' | 'IN_APP';
  triggerType: 'MANUAL' | 'JOB_SCHEDULED' | 'JOB_DISPATCHED' | 'TECH_EN_ROUTE' | 
               'JOB_COMPLETED' | 'INVOICE_SENT' | 'PAYMENT_RECEIVED' | 'ESTIMATE_SENT' |
               'APPOINTMENT_REMINDER' | 'REVIEW_REQUEST' | 'MEMBERSHIP_RENEWAL';
  subject?: string;
  body: string;
  variables: string[];  // Available merge fields like {{customer_name}}, {{job_date}}
  delayMinutes: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
```

#### 4.5 Services & Materials (Price Book)
```typescript
interface Service {
  serviceId: string;
  tenantId: string;
  categoryId?: string;
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
  createdAt: number;
  updatedAt: number;
}

interface Material {
  materialId: string;
  tenantId: string;
  categoryId?: string;
  sku?: string;
  name: string;
  description?: string;
  unitCost: number;
  markupPercent: number;
  unitPrice: number;  // Calculated: unitCost * (1 + markupPercent/100)
  unitOfMeasure: string;
  manufacturer?: string;
  manufacturerPartNumber?: string;
  isTaxable: boolean;
  qtyOnHand: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
```

---

### Phase 5: Employees & Assignments (Week 5-6)
**Goal:** Implement employee management and job assignments

#### 5.1 New Tables
- Employees (DynamoDB)
- JobAssignments (DynamoDB)
- EmployeeSchedules (DynamoDB)
- Skills (DynamoDB)

#### 5.2 Features
- Employee CRUD
- Skill tracking
- Schedule management
- Job assignment with roles (PRIMARY, SECONDARY, HELPER)

---

### Phase 6: PostgreSQL Migration (Week 7-9)
**Goal:** Migrate from DynamoDB to PostgreSQL for relational features

#### 5.1 Infrastructure
- Set up Aurora PostgreSQL (already in CDK)
- Run schema migration script
- Set up Prisma ORM

#### 5.2 Data Migration
1. Export DynamoDB data to JSON
2. Transform to PostgreSQL format
3. Import with foreign key relationships
4. Verify data integrity

#### 5.3 Lambda Updates
- Switch from DynamoDB SDK to Prisma
- Update all handlers
- Add transaction support

#### 5.4 Benefits of PostgreSQL
- Full-text search (pg_trgm)
- Complex queries with JOINs
- Row-Level Security (RLS) for multi-tenancy
- ACID transactions
- Generated columns
- Triggers for business logic

---

## Enum Mappings

### Customer Type
| Frontend | DynamoDB | PostgreSQL |
|----------|----------|------------|
| homeowner | homeowner | RESIDENTIAL |
| business | business | COMMERCIAL |
| contractor | contractor | CONTRACTOR |

### Job Status
| Frontend | PostgreSQL |
|----------|------------|
| Scheduled | SCHEDULED |
| In_Progress | IN_PROGRESS |
| Completed | COMPLETED |
| Canceled | CANCELLED |
| (new) | UNSCHEDULED |
| (new) | DISPATCHED |
| (new) | EN_ROUTE |
| (new) | ON_HOLD |
| (new) | INVOICED |
| (new) | PAID |

### Job Priority
| Frontend | PostgreSQL |
|----------|------------|
| Low | LOW |
| Medium | NORMAL |
| High | HIGH |
| Critical | EMERGENCY |

### User Role
| Frontend | PostgreSQL |
|----------|------------|
| Admin | ADMIN |
| Manager | DISPATCHER |
| Technician | FIELD_TECH |
| admin | ADMIN |
| technician | FIELD_TECH |
| user | OFFICE_STAFF |
| (new) | OWNER |
| (new) | SALES_REP |

---

## Testing Strategy

### For Each Phase:
1. **Unit Tests:** New service methods
2. **Integration Tests:** API endpoints
3. **E2E Tests:** Full user flows
4. **Regression Tests:** Existing functionality

### Rollback Plan:
- Keep DynamoDB tables during migration
- Feature flags to switch between backends
- Data sync during transition period

---

## Files to Modify (By Phase)

### Phase 1 (Customer Enhancement)
```
apps/api/src/services/customer.dynamodb.service.ts
apps/api/src/handlers/customers/create-dynamodb.ts
apps/api/src/handlers/customers/update-dynamodb.ts
apps/web/src/types/index.ts
apps/web/src/services/customerService.ts
apps/web/src/app/customers/new/page.tsx
apps/web/src/app/customers/edit/[id]/page.tsx
```

### Phase 2 (Addresses)
```
apps/api/src/services/address.dynamodb.service.ts (new)
apps/api/src/handlers/addresses/*.ts (new)
infrastructure/lib/fieldsmartpro-stack.ts
apps/web/src/services/addressService.ts (new)
apps/web/src/components/AddressManager.tsx (new)
```

### Phase 3 (Jobs)
```
apps/api/src/services/job.dynamodb.service.ts (new)
apps/api/src/handlers/jobs/*.ts (new)
infrastructure/lib/fieldsmartpro-stack.ts
apps/web/src/services/jobService.ts (update)
apps/web/src/app/jobs/*.tsx (update)
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Backup before each phase, dual-write period |
| Breaking existing features | High | Feature flags, comprehensive testing |
| Performance degradation | Medium | Load testing, index optimization |
| Downtime | Medium | Blue-green deployment, gradual rollout |

---

## Success Criteria

### Phase 1
- [ ] All new customer fields saved to DynamoDB
- [ ] Existing customer CRUD still works
- [ ] LLM function calling still works

### Phase 2
- [ ] Multiple addresses per customer
- [ ] Primary address selection
- [ ] Backward compatible API

### Phase 3
- [ ] Jobs CRUD fully functional
- [ ] No more OData errors in console
- [ ] Job scheduling works

### Phase 4
- [ ] Checklist templates CRUD
- [ ] Job templates CRUD
- [ ] Estimate templates with Good/Better/Best options
- [ ] Message templates with trigger types
- [ ] Services & Materials (Price Book)

### Phase 5
- [ ] Employee management
- [ ] Job assignments
- [ ] Dispatch features
- [ ] Skills tracking

### Phase 6
- [ ] All data in PostgreSQL
- [ ] RLS working for multi-tenancy
- [ ] Full-text search working
- [ ] All frontend features working

