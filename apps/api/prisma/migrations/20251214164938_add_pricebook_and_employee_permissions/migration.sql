-- CreateEnum: EmployeeStatus
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum: Permission (Granular permissions for RBAC)
CREATE TYPE "Permission" AS ENUM (
  'CUSTOMERS_VIEW',
  'CUSTOMERS_CREATE',
  'CUSTOMERS_EDIT',
  'CUSTOMERS_DELETE',
  'CUSTOMERS_EXPORT',
  'JOBS_VIEW',
  'JOBS_CREATE',
  'JOBS_EDIT',
  'JOBS_DELETE',
  'JOBS_ASSIGN',
  'JOBS_COMPLETE',
  'ESTIMATES_VIEW',
  'ESTIMATES_CREATE',
  'ESTIMATES_EDIT',
  'ESTIMATES_DELETE',
  'ESTIMATES_APPROVE',
  'INVOICES_VIEW',
  'INVOICES_CREATE',
  'INVOICES_EDIT',
  'INVOICES_DELETE',
  'INVOICES_SEND',
  'PAYMENTS_VIEW',
  'PAYMENTS_COLLECT',
  'PAYMENTS_REFUND',
  'SCHEDULE_VIEW',
  'SCHEDULE_MANAGE',
  'DISPATCH_JOBS',
  'EMPLOYEES_VIEW',
  'EMPLOYEES_MANAGE',
  'PERMISSIONS_MANAGE',
  'PRICEBOOK_VIEW',
  'PRICEBOOK_EDIT',
  'REPORTS_VIEW',
  'REPORTS_EXPORT',
  'SETTINGS_VIEW',
  'SETTINGS_MANAGE',
  'INTEGRATIONS_MANAGE'
);

-- CreateTable: pricebook_industries (Industry-specific pricebook templates)
CREATE TABLE "pricebook_industries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricebook_industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pricebook_categories (Hierarchical categories for each industry)
CREATE TABLE "pricebook_categories" (
    "id" TEXT NOT NULL,
    "pricebookIndustryId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricebook_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pricebook_services (Service templates for each category)
CREATE TABLE "pricebook_services" (
    "id" TEXT NOT NULL,
    "pricebookCategoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estimatedDuration" INTEGER NOT NULL DEFAULT 60,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "qboItemId" TEXT,
    "qboSyncedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hasDiscardedMaterials" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricebook_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pricebook_service_materials (Materials used in services)
CREATE TABLE "pricebook_service_materials" (
    "id" TEXT NOT NULL,
    "pricebookServiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isDiscarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricebook_service_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable: employee_roles (Many-to-many mapping between employees and roles)
CREATE TABLE "employee_roles" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "employee_roles_pkey" PRIMARY KEY ("id")
);

-- AlterTable: categories (Add orderIndex for drag-drop sorting)
ALTER TABLE "categories" ADD COLUMN "orderIndex" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: services (Add orderIndex and QuickBooks sync fields)
ALTER TABLE "services" ADD COLUMN "orderIndex" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "services" ADD COLUMN "qboItemId" TEXT;
ALTER TABLE "services" ADD COLUMN "qboSyncedAt" TIMESTAMP(3);

-- AlterTable: materials (Add orderIndex for drag-drop sorting)
ALTER TABLE "materials" ADD COLUMN "orderIndex" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: employees (Add status field)
ALTER TABLE "employees" ADD COLUMN "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable: roles (Change permissions from Json to Permission[] array)
-- Since there's no existing permissions data, we can safely modify the column type
ALTER TABLE "roles" DROP COLUMN "permissions";
ALTER TABLE "roles" ADD COLUMN "permissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[];

-- CreateIndex: Unique constraint on pricebook industry slug
CREATE UNIQUE INDEX "pricebook_industries_slug_key" ON "pricebook_industries"("slug");

-- CreateIndex: Composite index for pricebook categories (for efficient sorting)
CREATE INDEX "pricebook_categories_pricebookIndustryId_orderIndex_idx" ON "pricebook_categories"("pricebookIndustryId", "orderIndex");

-- CreateIndex: Composite index for pricebook services (for efficient sorting)
CREATE INDEX "pricebook_services_pricebookCategoryId_orderIndex_idx" ON "pricebook_services"("pricebookCategoryId", "orderIndex");

-- CreateIndex: Index for QuickBooks sync lookups
CREATE INDEX "pricebook_services_qboItemId_idx" ON "pricebook_services"("qboItemId");

-- CreateIndex: Index for service materials lookups
CREATE INDEX "pricebook_service_materials_pricebookServiceId_idx" ON "pricebook_service_materials"("pricebookServiceId");

-- CreateIndex: Unique constraint for employee-role assignments
CREATE UNIQUE INDEX "employee_roles_employeeId_roleId_key" ON "employee_roles"("employeeId", "roleId");

-- CreateIndex: Index for employee lookups
CREATE INDEX "employee_roles_employeeId_idx" ON "employee_roles"("employeeId");

-- CreateIndex: Index for role lookups
CREATE INDEX "employee_roles_roleId_idx" ON "employee_roles"("roleId");

-- CreateIndex: Composite index for categories (for efficient sorting by tenant)
CREATE INDEX "categories_tenantId_orderIndex_idx" ON "categories"("tenantId", "orderIndex");

-- CreateIndex: Composite index for services (for efficient sorting by tenant and category)
CREATE INDEX "services_tenantId_categoryId_orderIndex_idx" ON "services"("tenantId", "categoryId", "orderIndex");

-- CreateIndex: Index for QuickBooks sync lookups on services
CREATE INDEX "services_qboItemId_idx" ON "services"("qboItemId");

-- CreateIndex: Composite index for materials (for efficient sorting by tenant and category)
CREATE INDEX "materials_tenantId_categoryId_orderIndex_idx" ON "materials"("tenantId", "categoryId", "orderIndex");

-- CreateIndex: Composite index for employees (for efficient filtering by tenant and status)
CREATE INDEX "employees_tenantId_status_idx" ON "employees"("tenantId", "status");

-- AddForeignKey: Link pricebook categories to industries
ALTER TABLE "pricebook_categories" ADD CONSTRAINT "pricebook_categories_pricebookIndustryId_fkey" FOREIGN KEY ("pricebookIndustryId") REFERENCES "pricebook_industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Self-referential foreign key for hierarchical categories
ALTER TABLE "pricebook_categories" ADD CONSTRAINT "pricebook_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "pricebook_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Link pricebook services to categories
ALTER TABLE "pricebook_services" ADD CONSTRAINT "pricebook_services_pricebookCategoryId_fkey" FOREIGN KEY ("pricebookCategoryId") REFERENCES "pricebook_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Link service materials to services
ALTER TABLE "pricebook_service_materials" ADD CONSTRAINT "pricebook_service_materials_pricebookServiceId_fkey" FOREIGN KEY ("pricebookServiceId") REFERENCES "pricebook_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Link employee role assignments to employees
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Link employee role assignments to roles
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- NOTE: No data migration required for permissions column
-- The permissions column has been cleanly changed from Json to Permission[]
-- since there was no existing permissions data in the system.
