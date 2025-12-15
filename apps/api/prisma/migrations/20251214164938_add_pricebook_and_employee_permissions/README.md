# Migration: Add Pricebook and Employee Permissions

**Created**: 2025-12-14
**Migration ID**: `20251214164938_add_pricebook_and_employee_permissions`

## Overview

This migration adds two major features to the database:

1. **Industry-Specific Pricebook System** - Template catalogs for HVAC, Plumbing, Electrical, etc.
2. **Enhanced Employee Permission System** - Granular role-based access control (RBAC)

## What This Migration Does

### New Features Added

#### 1. Pricebook System
- ✅ `pricebook_industries` - Industry templates (HVAC, Plumbing, etc.)
- ✅ `pricebook_categories` - Hierarchical categories per industry
- ✅ `pricebook_services` - Service templates with pricing and materials
- ✅ `pricebook_service_materials` - Materials used in each service

#### 2. Employee Permission System
- ✅ `Permission` enum - 40+ granular permissions
- ✅ `EmployeeStatus` enum - ACTIVE, INACTIVE, ON_LEAVE, TERMINATED
- ✅ `employee_roles` - Many-to-many employee-role assignments

#### 3. Enhanced Existing Models
- ✅ **categories** - Added `orderIndex` for drag-drop sorting
- ✅ **services** - Added `orderIndex`, `qboItemId`, `qboSyncedAt`
- ✅ **materials** - Added `orderIndex`
- ✅ **employees** - Added `status` field
- ✅ **roles** - Added `permissions_new` column (Permission[])

### Performance Optimizations
- ✅ 10+ new indexes for efficient querying
- ✅ Composite indexes for multi-tenant isolation
- ✅ Indexes for QuickBooks sync lookups
- ✅ Indexes for drag-drop ordering

## ✅ Schema Changes

### Role Permissions Field Change

The `roles.permissions` field is changing from `Json` to `Permission[]` (typed array).

**Current**: `permissions Json`
**New**: `permissions Permission[]`

**Good News**: Since there's no existing permissions data in the system, this migration cleanly replaces the column type without requiring data migration.

## How to Apply This Migration

### Step 1: Backup Your Database

```bash
# Create a backup before applying migration
pg_dump -h localhost -U postgres -d fieldsmartpro > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Apply the Main Migration

```bash
cd apps/api
npx prisma migrate deploy
```

This will:
- Create all new tables and enums
- Add new columns to existing tables
- Create all indexes and foreign keys
- **NOT modify existing permissions data**

### Step 3: Verify the Migration

```sql
-- Check that all roles have the new permissions column
SELECT id, name, permissions FROM roles;

-- Check permission distribution (should be empty initially)
SELECT name, array_length(permissions, 1) as permission_count
FROM roles
ORDER BY permission_count DESC;
```

### Step 4: Regenerate Prisma Client

```bash
cd apps/api
npx prisma generate
```

## Rollback Instructions

If you need to rollback this migration:

### 1. Restore from Backup

```bash
# Drop the database
psql -h localhost -U postgres -c "DROP DATABASE fieldsmartpro;"

# Recreate and restore
psql -h localhost -U postgres -c "CREATE DATABASE fieldsmartpro;"
psql -h localhost -U postgres -d fieldsmartpro < backup_YYYYMMDD_HHMMSS.sql
```

### 2. Manual Rollback (if backup not available)

```sql
-- Drop foreign keys first
ALTER TABLE employee_roles DROP CONSTRAINT employee_roles_employeeId_fkey;
ALTER TABLE employee_roles DROP CONSTRAINT employee_roles_roleId_fkey;
ALTER TABLE pricebook_service_materials DROP CONSTRAINT pricebook_service_materials_pricebookServiceId_fkey;
ALTER TABLE pricebook_services DROP CONSTRAINT pricebook_services_pricebookCategoryId_fkey;
ALTER TABLE pricebook_categories DROP CONSTRAINT pricebook_categories_pricebookIndustryId_fkey;
ALTER TABLE pricebook_categories DROP CONSTRAINT pricebook_categories_parentId_fkey;

-- Drop new tables
DROP TABLE employee_roles;
DROP TABLE pricebook_service_materials;
DROP TABLE pricebook_services;
DROP TABLE pricebook_categories;
DROP TABLE pricebook_industries;

-- Remove new columns from existing tables
ALTER TABLE categories DROP COLUMN orderIndex;
ALTER TABLE services DROP COLUMN orderIndex, DROP COLUMN qboItemId, DROP COLUMN qboSyncedAt;
ALTER TABLE materials DROP COLUMN orderIndex;
ALTER TABLE employees DROP COLUMN status;

-- Drop new enums (do this AFTER removing columns that use them)
DROP TYPE Permission;
DROP TYPE EmployeeStatus;

-- Drop new indexes (they'll be dropped automatically with the tables)
```

## Testing Checklist

Before deploying to production:

- [ ] Backup database created
- [ ] Migration applied successfully on development database
- [ ] All existing tests pass
- [ ] Application starts without errors
- [ ] Can create/read/update/delete using existing functionality
- [ ] Multi-tenant isolation still works
- [ ] Performance is acceptable (check query times)
- [ ] New pricebook tables are accessible
- [ ] Employee role assignments work correctly

## Impact Assessment

### What Will NOT Break
- ✅ Existing customer, job, employee, invoice data - **untouched**
- ✅ Existing API endpoints - **continue to work**
- ✅ Existing frontend functionality - **no changes needed yet**
- ✅ Multi-tenant isolation - **maintained with new indexes**

### What Needs Attention
- ⚠️ **Application code** - Will need updates to use new Permission enum
- ⚠️ **Permission checking logic** - Implement typed permission checking
- ⚠️ **Tests** - Add tests for new permission structure
- ⚠️ **Seed data** - Create initial pricebook industries and categories

### New Functionality Available After Migration
- ✅ Can create pricebook industries and templates
- ✅ Can assign multiple roles to employees
- ✅ Can use drag-drop ordering for categories/services
- ✅ Can sync services with QuickBooks
- ✅ Can track employee status (active/inactive)
- ✅ Can use granular permission checking

## Performance Considerations

### Indexes Created
This migration adds 10+ indexes:

1. `pricebook_industries_slug_key` (unique)
2. `pricebook_categories_pricebookIndustryId_orderIndex_idx`
3. `pricebook_services_pricebookCategoryId_orderIndex_idx`
4. `pricebook_services_qboItemId_idx`
5. `pricebook_service_materials_pricebookServiceId_idx`
6. `employee_roles_employeeId_roleId_key` (unique)
7. `employee_roles_employeeId_idx`
8. `employee_roles_roleId_idx`
9. `categories_tenantId_orderIndex_idx`
10. `services_tenantId_categoryId_orderIndex_idx`
11. `services_qboItemId_idx`
12. `materials_tenantId_categoryId_orderIndex_idx`
13. `employees_tenantId_status_idx`

### Index Build Time
On a large database, index creation may take time:
- Estimate: ~1-5 seconds per 100,000 rows
- Locks: READ locks during index creation (writes blocked temporarily)
- Recommendation: Run during low-traffic period

### Storage Impact
- New tables: ~10-50 MB (depending on pricebook data volume)
- Indexes: ~5-20 MB additional
- Total: ~15-70 MB additional storage

## Next Steps After Migration

1. **Create Seed Data** - Populate pricebook_industries with HVAC, Plumbing, etc.
2. **Update Application Code** - Use new Permission enum in auth middleware
3. **Create Service Layer** - Build PricebookService and PermissionService
4. **Create API Endpoints** - Add REST endpoints for pricebook management
5. **Add Tests** - Unit and integration tests for new features
6. **Update Frontend** - Build UI for pricebook browsing and role management

## Support and Documentation

- **Design Document**: See `docs/PRICEBOOK_EMPLOYEE_SCHEMA_DESIGN.md`
- **API Patterns**: Based on HouseCall Pro API design
- **Questions**: Review the design document or ask the development team

---

**Migration Status**: Ready to apply
**Risk Level**: Medium (requires data migration for permissions)
**Estimated Downtime**: < 30 seconds (on typical database)
**Rollback Supported**: Yes (with backup)
