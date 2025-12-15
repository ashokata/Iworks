# Pricebook & Employee Management Schema Design

## Overview
This document outlines the database schema enhancements for implementing:
1. **Industry-specific Pricebook Catalog** (like HouseCall Pro)
2. **Enhanced Employee Management** with granular permissions

## Current State Analysis

### Existing Models (Good Foundation)
- ✅ `Industry` - Tenant's industry selection
- ✅ `Category` - Hierarchical categories (SERVICE/MATERIAL)
- ✅ `Service` - Service catalog with pricing
- ✅ `Material` - Material/product catalog
- ✅ `Employee` - Employee records
- ✅ `User` - User authentication with basic roles
- ✅ `Role` - Custom roles with permissions JSON

### What's Missing

#### For Pricebook System:
- ❌ Industry-specific pricebook templates
- ❌ Drag-drop ordering (`orderIndex`)
- ❌ Service materials relationship (materials used in services)
- ❌ QuickBooks sync fields
- ❌ Multi-industry support for larger orgs

#### For Employee Permissions:
- ❌ Employee-to-Role mapping
- ❌ Granular permissions (currently just JSON blob)
- ❌ Permission inheritance
- ❌ Active/inactive status filtering
- ❌ Department/team structure

---

## Proposed Schema Changes

### 1. Pricebook Industry Templates

```prisma
// New model for industry-specific pricebook templates
model PricebookIndustry {
  id              String   @id @default(uuid())
  name            String   // "HVAC", "Plumbing", "Electrical", "Landscaping"
  slug            String   @unique
  description     String?
  icon            String?  // Icon name for UI
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  categories      PricebookCategory[]

  @@map("pricebook_industries")
}

// Industry-specific categories (separate from tenant categories)
model PricebookCategory {
  id                    String             @id @default(uuid())
  pricebookIndustryId   String
  pricebookIndustry     PricebookIndustry @relation(fields: [pricebookIndustryId], references: [id], onDelete: Cascade)
  parentId              String?
  parent                PricebookCategory? @relation("PricebookCategoryHierarchy", fields: [parentId], references: [id])
  name                  String
  description           String?
  orderIndex            Int                @default(0)  // For drag-drop
  isActive              Boolean            @default(true)
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  // Relations
  children              PricebookCategory[] @relation("PricebookCategoryHierarchy")
  services              PricebookService[]

  @@index([pricebookIndustryId, orderIndex])
  @@map("pricebook_categories")
}

// Industry-specific service templates
model PricebookService {
  id                    String             @id @default(uuid())
  pricebookCategoryId   String
  pricebookCategory     PricebookCategory  @relation(fields: [pricebookCategoryId], references: [id], onDelete: Cascade)
  name                  String
  description           String?
  sku                   String?
  unitPrice             Decimal            @db.Decimal(10, 2)
  unitCost              Decimal            @default(0) @db.Decimal(10, 2)
  estimatedDuration     Int                @default(60)  // minutes
  orderIndex            Int                @default(0)   // For drag-drop
  qboItemId             String?            // QuickBooks Online sync
  qboSyncedAt           DateTime?
  isActive              Boolean            @default(true)
  hasDiscardedMaterials Boolean            @default(false)
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  // Relations
  materials             PricebookServiceMaterial[]

  @@index([pricebookCategoryId, orderIndex])
  @@index([qboItemId])
  @@map("pricebook_services")
}

// Materials used in services (many-to-many)
model PricebookServiceMaterial {
  id                  String           @id @default(uuid())
  pricebookServiceId  String
  pricebookService    PricebookService @relation(fields: [pricebookServiceId], references: [id], onDelete: Cascade)
  name                String
  description         String?
  quantity            Decimal          @db.Decimal(10, 3)
  unitCost            Decimal          @db.Decimal(10, 2)
  isOptional          Boolean          @default(false)
  isDiscarded         Boolean          @default(false)  // Soft delete
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  @@index([pricebookServiceId])
  @@map("pricebook_service_materials")
}
```

### 2. Enhanced Category Model

```prisma
// Add orderIndex to existing Category model
model Category {
  // ... existing fields ...
  orderIndex   Int      @default(0)  // NEW: For drag-drop ordering

  @@index([tenantId, orderIndex])  // NEW: Index for sorting
}
```

### 3. Enhanced Service Model

```prisma
// Add orderIndex and QBO fields to existing Service model
model Service {
  // ... existing fields ...
  orderIndex          Int      @default(0)  // NEW: For drag-drop
  qboItemId           String?               // NEW: QuickBooks Online Item ID
  qboSyncedAt         DateTime?             // NEW: Last sync timestamp

  @@index([tenantId, categoryId, orderIndex])  // NEW: Index for sorting
  @@index([qboItemId])                         // NEW: QBO lookup
}
```

### 4. Enhanced Material Model

```prisma
// Add orderIndex to existing Material model
model Material {
  // ... existing fields ...
  orderIndex   Int      @default(0)  // NEW: For drag-drop ordering

  @@index([tenantId, categoryId, orderIndex])  // NEW: Index for sorting
}
```

### 5. Employee Permissions System

```prisma
// New enum for granular permissions
enum Permission {
  // Customer permissions
  CUSTOMERS_VIEW
  CUSTOMERS_CREATE
  CUSTOMERS_EDIT
  CUSTOMERS_DELETE
  CUSTOMERS_EXPORT

  // Job permissions
  JOBS_VIEW
  JOBS_CREATE
  JOBS_EDIT
  JOBS_DELETE
  JOBS_ASSIGN
  JOBS_COMPLETE

  // Estimate permissions
  ESTIMATES_VIEW
  ESTIMATES_CREATE
  ESTIMATES_EDIT
  ESTIMATES_DELETE
  ESTIMATES_APPROVE

  // Invoice permissions
  INVOICES_VIEW
  INVOICES_CREATE
  INVOICES_EDIT
  INVOICES_DELETE
  INVOICES_SEND

  // Payment permissions
  PAYMENTS_VIEW
  PAYMENTS_COLLECT
  PAYMENTS_REFUND

  // Schedule permissions
  SCHEDULE_VIEW
  SCHEDULE_MANAGE
  DISPATCH_JOBS

  // Employee permissions
  EMPLOYEES_VIEW
  EMPLOYEES_MANAGE
  PERMISSIONS_MANAGE

  // Pricebook permissions
  PRICEBOOK_VIEW
  PRICEBOOK_EDIT

  // Reports permissions
  REPORTS_VIEW
  REPORTS_EXPORT

  // Settings permissions
  SETTINGS_VIEW
  SETTINGS_MANAGE
  INTEGRATIONS_MANAGE
}

// Enhanced Role model with typed permissions
model Role {
  // ... existing fields ...
  permissions  Permission[]  // CHANGED: From Json to typed array

  // NEW: Relations
  employeeRoles EmployeeRole[]
}

// New: Employee-to-Role mapping (many-to-many)
model EmployeeRole {
  id          String    @id @default(uuid())
  employeeId  String
  employee    Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  roleId      String
  role        Role      @relation(fields: [roleId], references: [id], onDelete: Cascade)
  assignedAt  DateTime  @default(now())
  assignedBy  String?   // userId who assigned

  @@unique([employeeId, roleId])
  @@index([employeeId])
  @@index([roleId])
  @@map("employee_roles")
}

// Enhanced Employee model
model Employee {
  // ... existing fields ...
  status            EmployeeStatus  @default(ACTIVE)  // NEW: Active/Inactive status
  department        String?         // EXISTING: Already there

  // NEW: Relations
  roles             EmployeeRole[]   // NEW: Multiple roles per employee

  @@index([tenantId, status])  // NEW: Filter by status
}

// New enum for employee status
enum EmployeeStatus {
  ACTIVE
  INACTIVE
  ON_LEAVE
  TERMINATED
}
```

---

## Implementation Plan

### Phase 1: Database Schema (Current)
1. ✅ Design schema changes
2. ⏳ Create Prisma migrations
3. ⏳ Add seed data for pricebook industries

### Phase 2: Service Layer
1. ⏳ Pricebook Industry service
2. ⏳ Pricebook Category service
3. ⏳ Pricebook Service service
4. ⏳ Employee Permission service
5. ⏳ Role management service

### Phase 3: API Endpoints
1. ⏳ GET/POST/PUT/DELETE `/api/pricebook/industries`
2. ⏳ GET/POST/PUT/DELETE `/api/pricebook/categories`
3. ⏳ GET/POST/PUT/DELETE `/api/pricebook/services`
4. ⏳ GET/PUT `/api/employees/:id/permissions`
5. ⏳ GET/POST/PUT/DELETE `/api/roles`
6. ⏳ Support `expand[]` parameter for related data

### Phase 4: Frontend Components
1. ⏳ Pricebook industry selector
2. ⏳ Category management UI (drag-drop)
3. ⏳ Service catalog browser
4. ⏳ Service editor with materials
5. ⏳ Employee permissions matrix
6. ⏳ Role management UI

### Phase 5: Integration
1. ⏳ Import pricebook into tenant catalog
2. ⏳ QuickBooks sync for services
3. ⏳ Job creation from pricebook services
4. ⏳ Permission enforcement middleware

---

## API Endpoint Design (HouseCall Pro Pattern)

### Pricebook APIs

```typescript
// Industries
GET    /api/pricebook/industries
GET    /api/pricebook/industries/:id

// Categories
GET    /api/pricebook/categories?industry_id=xxx&page=1&page_size=100&sort_column=orderIndex&sort_direction=asc
POST   /api/pricebook/categories
PUT    /api/pricebook/categories/:id
DELETE /api/pricebook/categories/:id
PUT    /api/pricebook/categories/:id/reorder

// Services
GET    /api/pricebook/services?category_id=xxx&expand[]=materials&expand[]=quickbooks&page=1&page_size=100
POST   /api/pricebook/services
PUT    /api/pricebook/services/:id
DELETE /api/pricebook/services/:id
PUT    /api/pricebook/services/:id/reorder

// Import to Tenant
POST   /api/pricebook/import  // Import industry pricebook to tenant catalog
```

### Employee Permission APIs

```typescript
// Employees with permissions
GET    /api/employees?expand[]=permissions&expand[]=roles&status[]=active
GET    /api/employees/:id?expand[]=permissions&expand[]=roles
PUT    /api/employees/:id/roles
POST   /api/employees/:id/roles/:roleId
DELETE /api/employees/:id/roles/:roleId

// Roles
GET    /api/roles
POST   /api/roles
PUT    /api/roles/:id
DELETE /api/roles/:id

// Permissions (list available permissions)
GET    /api/permissions
```

---

## Benefits

### Pricebook System
- ✅ Industry-standard service catalogs
- ✅ Easy onboarding (import HVAC/Plumbing/etc. templates)
- ✅ Consistent pricing across industry
- ✅ Drag-drop category organization
- ✅ QuickBooks integration ready
- ✅ Material tracking per service

### Employee Permissions
- ✅ Granular access control
- ✅ Role-based permissions (Admin, Manager, Tech)
- ✅ Multiple roles per employee
- ✅ Easy permission auditing
- ✅ Status filtering (active/inactive)
- ✅ Department organization

---

## Next Steps

1. **Review this design** with stakeholders
2. **Create Prisma migrations** for schema changes
3. **Seed pricebook data** for common industries (HVAC, Plumbing, Electrical)
4. **Build service layer** with TypeScript interfaces
5. **Create API endpoints** matching HouseCall Pro patterns
6. **Build frontend components** with drag-drop support
7. **Add tests** for all new features

---

**Estimated Implementation Time**: 2-3 weeks (not including time estimates per your preference)

**Priority Order**:
1. Pricebook schema + basic CRUD
2. Employee permissions
3. Frontend UI
4. QuickBooks integration
5. Advanced features (import, bulk operations)
