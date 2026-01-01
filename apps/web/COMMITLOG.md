# Commit Log

All commits to this project are documented in this file.

---

## 📦 Commit #39 - 2026-01-01 2:14 PM (IST)

**Developer:** Logeshwaran S
**Type:** Feature / UI Enhancement

### 📝 Commit Message
```
feat: implement drag-and-drop dispatch calendar with inline filtering

Implemented a comprehensive drag-and-drop dispatch system for job assignment
with bi-directional task movement, backend API support, and optimized UI.

Features:
- Drag tasks from task table to calendar cells to assign employees
- Drag tasks from calendar back to task table to unassign
- Drag tasks between employees to reassign
- Custom drag preview showing job title and customer name
- Toast notifications for success/error feedback with auto-dismiss

Backend API:
- PUT /jobs/:id - Update job schedule and status
- POST /jobs/:id/assignments - Create employee assignments
- DELETE /jobs/:id/assignments/:employeeId - Remove assignments
- Auto-update dispatchedAt, actualStart, completedAt timestamps

UI Enhancements:
- Replaced top search bar with inline filter toggle system
- Added column-specific filters (Task, Status, Customer, Created by, etc.)
- Real-time filtering with reset on close
- Replaced "Assigned to" column with "Customer" column
- Removed selection checkboxes from task table
- Optimized spacing throughout (calendar 40vh, task table 30vh)
- Compact padding and responsive layout

Database Updates:
- Job: scheduledStart/End, status, dispatchedAt
- JobAssignment: INSERT/DELETE for employee assignments
```

### ✨ Changes

**Frontend:**
- ✅ `apps/web/src/app/dispatch/page.tsx` - Complete drag-and-drop implementation with custom preview
- ✅ `apps/web/src/app/dispatch/page.tsx` - Inline filter system with toggle and reset functionality
- ✅ `apps/web/src/app/dispatch/page.tsx` - Replaced "Assigned to" column with "Customer" column
- ✅ `apps/web/src/app/dispatch/page.tsx` - Toast notification system (success/error)
- ✅ `apps/web/src/app/dispatch/page.tsx` - Optimized layout spacing (calendar 40vh, task table 30vh)

**Backend:**
- ✅ `apps/api/src/index.ts` - PUT /jobs/:id endpoint for job updates
- ✅ `apps/api/src/index.ts` - POST /jobs/:id/assignments endpoint for employee assignments
- ✅ `apps/api/src/index.ts` - DELETE /jobs/:id/assignments/:employeeId endpoint to remove assignments

**Services:**
- ✅ `apps/web/src/services/jobService.ts` - Added updateJob, assignEmployee, unassignEmployee methods

**Problem Solved:**
- Enabled drag-and-drop job assignment between task table and calendar
- Provided visual feedback with toast notifications
- Implemented bi-directional task movement (calendar ↔ task table)
- Added flexible inline filtering system
- Optimized UI for better space utilization

**Technical Details:**
- Uses native HTML5 drag-and-drop API with custom drag image
- Updates Job table (scheduledStart/End, status, dispatchedAt)
- Creates/deletes JobAssignment records for employee assignments
- Real-time filtering with debounced inputs
- Responsive grid layout with scroll containers

---

## 📦 Commit #38 - 2025-12-31 11:15 PM (IST)

**Developer:** Veera Kuppili
**Type:** Fix / Configuration

### 📝 Commit Message
```
fix: add API proxy rewrites for local development

Configure Next.js rewrites to proxy /api-proxy requests to Express 
server on localhost:4000 in development mode. Resolves 404 errors 
for /api/estimates and /api/tenants endpoints.
```

### ✨ Changes

**Configuration:**
- ✅ `apps/web/next.config.js` - Added rewrites configuration to proxy /api-proxy/* requests to localhost:4000 in development

**Problem Solved:**
- Fixed 404 errors when accessing /api-proxy/api/estimates endpoint
- Fixed 404 errors when accessing /api-proxy/api/tenants endpoint
- Enabled proper communication between Next.js frontend (port 3000) and Express API (port 4000) in local development

**Technical Details:**
- Added async rewrites() function to Next.js config
- Proxy only active in NODE_ENV === 'development'
- Routes /api-proxy/:path* to http://localhost:4000/:path*

---

## 📦 Commit #37 - 2025-12-31 00:49 AM (IST)

**Developer:** Veera Kuppili
**Type:** Fix / UI Enhancement

### 📝 Commit Message
```
fix(web): improve estimate form UX and fix customerCanApprove default

- Change customerCanApprove default from true to false for better security
- Restructure line item layout to 12-column grid for better responsiveness
- Move description field below main inputs for cleaner layout
- Improve taxable checkbox alignment and styling
- Apply consistent formatting across new and edit estimate pages
```

### ✨ Changes

**Frontend Pages:**
- ✅ `apps/web/src/app/estimates/new/page.tsx` - Updated customerCanApprove default to false, improved line item grid layout
- ✅ `apps/web/src/app/estimates/edit/[id]/page.tsx` - Applied same UX improvements for consistency

**UI Improvements:**
- Grid layout changed from 2-column to 12-column system for better control
- Service name, quantity, unit price, and taxable checkbox now in single row
- Description field moved to separate row below for better readability
- Taxable checkbox properly aligned with consistent styling
- Enhanced responsive behavior across all screen sizes

---

## 📦 Commit #36 - 2025-12-30 11:30 PM (IST)

**Developer:** Veera Kuppili
**Type:** Feature / Refactor

### 📝 Commit Message
```
feat(estimates): simplify structure and add UI enhancements

- Simplified estimates from multi-option to direct line items structure
- Removed EstimateOption model, lineItems now belong directly to Estimate
- Added blue gradient header theme matching jobs page UI
- Implemented "Use Same as Primary Address" checkbox functionality
- Added useSameAsPrimary boolean field to Estimate model
- Restructured layout with checkboxes in two-column row (Use Same as Primary Address on left, Customer Can Approve on right)
- Added customerCanApprove, multipleOptionsAllowed, expirationDate, and taxRate fields to Estimate model
- Updated API handlers (create-postgres.ts, update-postgres.ts) to handle useSameAsPrimary field
- Updated TypeScript interfaces in estimateService.ts to match new structure
- Updated estimates list page to display lineItems instead of options
- Updated service request pages (new/edit) to handle simplified estimate structure
- Applied consistent blue theme styling (#1e3a8a) across all estimate pages
- Organized line items by type (Services, Materials, Labor, Equipment, Other)

Database changes:
- Added useSameAsPrimary, customerCanApprove, multipleOptionsAllowed, expirationDate, taxRate to estimates table
- Migrated line items from estimate_options to direct estimate relationship
- Removed estimate_options table and approvedOptionId field

BREAKING CHANGE: Estimates API structure changed from nested options to flat lineItems array
```

### ✨ Changes

**Database Schema:**
- ✅ `apps/api/prisma/schema.prisma` - Added useSameAsPrimary, customerCanApprove, multipleOptionsAllowed, expirationDate, taxRate fields
- ✅ Removed EstimateOption model, lineItems now directly reference Estimate
- ✅ Database migrations created for structure simplification

**API Handlers:**
- ✅ `apps/api/src/handlers/estimates/create-postgres.ts` - Extract and save useSameAsPrimary field
- ✅ `apps/api/src/handlers/estimates/update-postgres.ts` - Handle useSameAsPrimary in updates

**Frontend Services:**
- ✅ `apps/web/src/services/estimateService.ts` - Updated interfaces to match simplified structure
- ✅ Removed EstimateOption interface, added useSameAsPrimary to Create/Update interfaces

**UI Pages:**
- ✅ `apps/web/src/app/estimates/new/page.tsx` - Complete UI overhaul with blue gradient header
- ✅ `apps/web/src/app/estimates/edit/[id]/page.tsx` - Matching UI updates and useSameAsPrimary initialization
- ✅ `apps/web/src/app/estimates/page.tsx` - Updated to display lineItems instead of options
- ✅ `apps/web/src/app/service-requests/new/page.tsx` - Handle simplified estimate structure
- ✅ `apps/web/src/app/service-requests/edit/[id]/page.tsx` - Handle simplified estimate structure

### 🎨 UI Enhancements
- Blue gradient header theme (#1a2a6c to #1e40af) matching jobs page
- Organized line items by type with separate sections (Services, Materials, Labor, Equipment, Other)
- Two-column checkbox layout: "Use Same as Primary Address" (left), "Customer Can Approve" (right)
- Improved form validation and error messaging
- Enhanced visual hierarchy with blue theme (#1e3a8a)

### 🔧 Architecture Changes
- **Simplified Data Model:** Removed complex multi-option structure in favor of flat line items
- **Better UX:** Direct line item management instead of nested option groups
- **Improved Performance:** Fewer database queries without option layer
- **Enhanced Flexibility:** Line items directly linked to estimates

### 📊 Files Changed: 10

---

## 📦 Commit #35 - 2025-12-29 11:45 PM (IST)

**Developer:** Veera Kuppili
**Type:** Bug Fix

### 📝 Commit Message
```
fix(schema): Add EQUIPMENT and OTHER to LineItemType enum

- Extended LineItemType enum with EQUIPMENT and OTHER values
- Fixed Prisma validation error preventing estimate creation
- Enhanced estimateService error logging for better debugging
- Applied schema changes to database with `npx prisma db push`

This resolves the "Invalid value for argument `type`" error that occurred
when users tried to create estimates with EQUIPMENT or OTHER line items.
```

### ✨ Changes

**Schema Updates:**
- ✅ `apps/api/prisma/schema.prisma` - Added EQUIPMENT and OTHER to LineItemType enum

**Frontend Services:**
- ✅ `apps/web/src/services/estimateService.ts` - Enhanced error logging with full error text capture

### 🐛 Bug Fixes
- Fixed Prisma validation error: "Invalid value for argument `type`. Expected LineItemType"
- Frontend dropdown allowed EQUIPMENT and OTHER types but database enum didn't support them
- Added detailed error logging to capture full Prisma error messages for debugging
- Database schema synchronized with frontend expectations

### 📊 Files Changed: 2

---

## 📦 Commit #34 - 2025-12-29 11:20 PM (IST)

**Developer:** Veera Kuppili
**Type:** Feature

### 📝 Commit Message
```
feat: implement complete estimates CRUD functionality with full UI

- Backend handlers:
  * Add create, read, update, delete, and list estimate handlers
  * Implement Prisma queries for estimates with nested options/line items
  * Add validation for linked service requests and jobs before deletion
  * Support status transitions (DRAFT → SENT → APPROVED/DECLINED)
  * Handle automatic timestamps for status changes (sentAt, approvedAt, etc.)

- API routes:
  * Create /api/estimates routes with GET, POST, PUT, DELETE methods
  * Add /api/estimates/:id/send, /approve, /decline convenience endpoints
  * Implement Express middleware for Lambda handler integration

- Frontend pages:
  * Build estimates list page with table/card views and filtering
  * Create new estimate form with customer/address selection
  * Add estimate details page with options, line items, and status actions
  * Implement edit estimate page with full form validation

- Frontend services:
  * Create estimateService with TypeScript interfaces
  * Add methods for create, update, delete, send, approve, decline
  * Implement enhanced error logging for debugging
  * Support tenant-based API calls

- Features:
  * Multi-option estimates with recommended flags
  * Line items with type, quantity, pricing, and taxable flags
  * Discount support (percentage or fixed amount)
  * Tax calculation per option and estimate total
  * Address creation during estimate flow
  * Duplicate validation for options and line items
  * Real-time total calculations

- Bug fixes:
  * Fix Prisma deleteMany query (remove nested relation filters)
  * Remove tenantId from EstimateLineItem creation (schema mismatch)
  * Fix import syntax error in edit page (@tanstack/react-query)
  * Remove duplicate edit button in details page
  * Correct Decimal type handling for currency values
```

### ✨ Changes

**Backend Handlers:**
- ✅ `apps/api/src/handlers/estimates/create-postgres.ts` - Create estimate with options and line items
- ✅ `apps/api/src/handlers/estimates/list-postgres.ts` - List all estimates for tenant
- ✅ `apps/api/src/handlers/estimates/get-postgres.ts` - Get estimate by ID with full details
- ✅ `apps/api/src/handlers/estimates/update-postgres.ts` - Update estimate with cascade operations
- ✅ `apps/api/src/handlers/estimates/delete-postgres.ts` - Delete estimate with validation checks

**API Routes:**
- ✅ `apps/api/src/routes/estimates.routes.ts` - Complete REST API routes for estimates

**Frontend Pages:**
- ✅ `apps/web/src/app/estimates/page.tsx` - Estimates list with statistics, filtering, and pagination
- ✅ `apps/web/src/app/estimates/new/page.tsx` - Create new estimate form with multi-option support
- ✅ `apps/web/src/app/estimates/[id]/page.tsx` - Estimate details view with status actions
- ✅ `apps/web/src/app/estimates/edit/[id]/page.tsx` - Edit estimate with full form validation

**Frontend Services:**
- ✅ `apps/web/src/services/estimateService.ts` - Complete estimate API client with TypeScript types

### 🎯 Features Implemented
- Full CRUD operations for estimates with nested options and line items
- Multi-option estimates support (Option 1, Option 2, etc.)
- Line item types: SERVICE, MATERIAL, LABOR, EQUIPMENT, OTHER
- Discount support: NONE, PERCENTAGE, FIXED_AMOUNT
- Tax calculation with taxable/non-taxable line items
- Status workflow: DRAFT → SENT → VIEWED → APPROVED/DECLINED/EXPIRED
- Automatic timestamp tracking for status transitions
- Validation for linked service requests/jobs before deletion
- Duplicate validation for option names and line item names
- Real-time subtotal, discount, tax, and total calculations
- Address creation during estimate flow (pending addresses)
- Table and card view modes with search and filtering
- Statistics dashboard (total, draft, sent, approved, declined, total value)

### 🐛 Bug Fixes
- Fixed Prisma deleteMany query by removing nested relation filters (option.estimateId)
- Removed tenantId from EstimateLineItem creation (schema doesn't have this field)
- Fixed import syntax error in edit page (@tanstack/react-query)
- Removed duplicate edit button in details page
- Corrected Decimal type handling for currency values with formatCurrency helper

### 📊 Files Changed: 10

---

## 📦 Commit #33 - 2025-12-24 (IST)

**Developer:** Veera Kuppili
**Type:** Bug Fix

### 📝 Commit Message
```
feat: fix service requests list refresh after create/update operations

- Updated cache invalidation to use predicate function matching all related query keys
- Ensures list page refreshes properly after creating or updating service requests
- Invalidates service-requests, service-requests-voice-count, and service-requests-all-count queries
- Fixes issue where list wasn't updating due to queryKey mismatch (activeTab and currentPage params)
```

### ✨ Changes

**Frontend Pages:**
- ✅ `apps/web/src/app/service-requests/new/page.tsx` - Updated cache invalidation with predicate function
- ✅ `apps/web/src/app/service-requests/edit/[id]/page.tsx` - Updated cache invalidation with predicate function

### 🎯 Issue Fixed
- Service requests list page now properly refreshes after creating or updating records
- Fixed query key mismatch where list page uses `['service-requests', activeTab, currentPage]` but invalidation only used `['service-requests']`
- Predicate function now matches all queries starting with 'service-requests', 'service-requests-voice-count', or 'service-requests-all-count'

### 📊 Files Changed: 2

---

## 📦 Commit #32 - 2025-12-24 (IST)

**Developer:** Veera Kuppili
**Type:** Feature

### 📝 Commit Message
```
feat: add "Is Service Address Same as Primary Address" checkbox to service requests

Implement checkbox functionality in service request new/edit pages to automatically
populate service address from customer's primary address with smart duplicate prevention.

Database Changes:
- Add isServiceAddressSameAsPrimary boolean field to ServiceRequest model with default false
- Applied schema change via prisma db push

Backend Updates:
- Update create handler to extract and store isServiceAddressSameAsPrimary from request body
- Update update handler to handle isServiceAddressSameAsPrimary and customerId changes
- Add comprehensive logging for debugging field values

Frontend Features:
- Add checkbox with disabled state when no customer is selected
- Implement smart address matching to find existing SERVICE addresses matching primary
- Create pending SERVICE address only if no match exists (prevents duplicates)
- Disable service address dropdown when checkbox is checked
- Auto-populate service address when checkbox is checked
- Clear service address when checkbox is unchecked
- Reset checkbox and address when customer changes (not during initial load)
- Preserve loaded data during edit page initialization using prevCustomerIdRef
- Display primary address details when checkbox is checked

UI/UX Improvements:
- Remove confusing status badge from new/edit page headers
- Add disabled prop to SearchableSelect component with opacity-50 styling
- Show "Using Primary Address" info box with address details
- Graceful handling of customers without primary addresses

Technical Implementation:
- Use useRef to track customer changes vs initial load
- UseEffect depends only on useSameAsPrimary to prevent unwanted re-runs
- Validate existing serviceAddressId before overwriting during initial load
- Comprehensive console logging throughout for debugging
- Type-safe interfaces with isServiceAddressSameAsPrimary field

Fixes:
- Prevent duplicate SERVICE address creation when matching address exists
- Preserve checkbox and address state during page load
- Handle customer changes correctly without affecting initial data load
- Backend now updates customerId when changed in edit mode
```

### ✨ Changes

**Database Schema:**
- ✅ `apps/api/prisma/schema.prisma` - Added `isServiceAddressSameAsPrimary Boolean @default(false)` to ServiceRequest model

**Backend Handlers:**
- ✅ `apps/api/src/handlers/service-requests/create-postgres.ts` - Extract and store isServiceAddressSameAsPrimary
- ✅ `apps/api/src/handlers/service-requests/update-postgres.ts` - Handle isServiceAddressSameAsPrimary and customerId updates, added logging

**Frontend Pages:**
- ✅ `apps/web/src/app/service-requests/new/page.tsx` - Complete checkbox implementation with smart address matching
- ✅ `apps/web/src/app/service-requests/edit/[id]/page.tsx` - Checkbox with initial load preservation and customer change detection

**Components:**
- ✅ `apps/web/src/components/ui/SearchableSelect.tsx` - Added disabled prop support with opacity-50 styling

**Services:**
- ✅ `apps/web/src/services/serviceRequestService.ts` - Added isServiceAddressSameAsPrimary to TypeScript interfaces

### 🎯 Features Delivered
- Checkbox automatically finds matching SERVICE addresses from customer's address list
- Creates pending SERVICE address only when no match exists (prevents duplicates)
- Smart initial load handling preserves data without triggering address re-creation
- Customer change detection resets checkbox appropriately
- Comprehensive logging for debugging throughout the flow

### 📊 Files Changed: 7

---

## 📦 Commit #31 - 2025-12-21 (IST)

**Developer:** Veera Kuppili
**Type:** Feature

### 📝 Commit Message
```
feat: Implement comprehensive appointment calendar system with full CRUD operations

Major Features:
- Complete calendar UI with day, week, and month views
- Full appointment management (create, read, update, delete)
- Single-click to edit appointments, double-click grid to create new
- Hover tooltips showing customer name and appointment time
- Smart appointment sizing with white space optimization
- Toast notifications for success/error feedback

Backend Implementation:
- RESTful API with 5 endpoints: POST, GET, GET/:id, PUT/:id, DELETE/:id
- Prisma-based appointment handlers with tenant isolation
- Foreign key validation for addressId and assignedToId
- Comprehensive error handling and logging

Frontend Implementation:
- Three calendar view modes (day/week/month)
- Appointment modal with all Prisma schema fields
- Customer and employee dropdowns from database
- Real-time appointment display on calendar grid
- Appointment blocks show title and customer name
- Blue-themed tooltips with customer and time info

UI/UX Enhancements:
- Reduced appointment block heights (50px single, 30px multiple)
- Renamed "Schedule" to "Calendar" in navigation
- Single-click interaction to open appointments
- Smart tooltip positioning (above appointments)
- Toast animations with slide-in-right effect

Technical Details:
- Backend: Express routes, Prisma ORM, PostgreSQL
- Frontend: Next.js 15, React Query, Tailwind CSS
- State Management: React Query for server state, useState for UI
- Validation: Optional foreign keys only included if non-empty
- Update Pattern: Checks selectedAppointment to branch create/update logic
```

### ✨ Changes

#### Backend Files
- **apps/api/src/index.ts** - Added appointment routes import
- **apps/api/src/handlers/appointments/index.ts** (NEW) - Complete CRUD handlers (335 lines)
  - createAppointment: Validates fields, handles optional foreign keys
  - getAllAppointments: Returns appointments with customer/assignedTo relations
  - getAppointmentById: Fetches single appointment
  - updateAppointment: Partial update with spread operator
  - deleteAppointment: Hard delete with tenant verification
- **apps/api/src/routes/appointments.routes.ts** (NEW) - Express routes (38 lines)
  - POST /appointments → createAppointment
  - GET /appointments → getAllAppointments
  - GET /appointments/:id → getAppointmentById
  - PUT /appointments/:id → updateAppointment
  - DELETE /appointments/:id → deleteAppointment

#### Frontend Files
- **apps/web/src/components/SidebarLayout.tsx** - Renamed "Schedule" to "Calendar"
- **apps/web/tailwind.config.ts** - Added slide-in-right animation for toasts
- **apps/web/src/app/calendar/page.tsx** (NEW) - Complete calendar UI (1097 lines)
  - Three view modes: day/week/month with navigation
  - Appointment modal with form validation
  - handleSaveAppointment: Branches to create or update based on selectedAppointment
  - handleAppointmentClick: Single-click loads appointment data
  - handleGridClick: Double-click creates new appointment
  - Appointment blocks: Wrapper div for tooltip, inner div for overflow control
  - Tooltips: Blue theme, positioned above, shows customer + time
- **apps/web/src/services/appointmentService.ts** (NEW) - API service layer (131 lines)
  - createAppointment: POST /appointments
  - updateAppointment: PUT /appointments/:id
  - getAllAppointments: GET /appointments
  - getAppointmentById: GET /appointments/:id
  - deleteAppointment: DELETE /appointments/:id

### 🐛 Bug Fixes
- Fixed foreign key constraint violations by only including addressId/assignedToId when non-empty
- Fixed update functionality by checking selectedAppointment state
- Fixed tooltip visibility by repositioning from right to top
- Fixed text overflow with two-div structure (wrapper + inner)

### 🎨 UI Improvements
- Reduced appointment height for better white space management
- Single-click to open appointments (more intuitive)
- Blue-themed tooltips matching application design
- Customer name always visible on appointments
- Smart appointment sizing based on number of appointments in slot

---

## 📦 Commit #30 - 2025-12-24 (IST)

**Developer:** Veera Kuppili
**Type:** Feature / Enhancement

### 📝 Commit Message
```
feat: Implement address type separation and pending address staging

Major Changes:
- Separate SERVICE addresses from customer management pages
- Add pending address staging system for service requests
- Filter address dropdowns by type (SERVICE for service requests, PRIMARY/BILLING for customers)

Customer Pages:
- Remove 'Service' address type from customer new/edit pages
- Filter out SERVICE addresses from display in customer pages
- Make Customer Type and Preferred Contact Method required fields
- Update validation to require at least one PRIMARY and one BILLING address
- Change default address type from 'Service' to 'Billing'

Service Request Pages:
- Add pending addresses state for local staging before save
- Filter Service Address dropdown to show only SERVICE type addresses
- Change "Add Address" button to stage addresses instead of immediate save
- Implement address saving on form submit (not on Add button click)
- Fix navigation to redirect to service requests overview instead of view page
- Add validation to prevent sending pending IDs to backend

Schema:
- Fix missing serviceLocations relation in Customer model

Mock Data:
- Add FieldSmartPro local development admin user

Technical Details:
- Pending addresses use temporary IDs (pending-{timestamp})
- Real address IDs replace pending IDs during form submission
- Console logging added for debugging service request data
- Improved user feedback with updated toast messages
```

### ✨ Changes

**Database & Schema:**
- ✅ `apps/api/prisma/schema.prisma` - Added serviceLocations relation to Customer model

**Frontend - Customer Pages:**
- ✅ `apps/web/src/app/customers/edit/[id]/page.tsx` - Removed SERVICE address type, added filtering, made fields required
- ✅ `apps/web/src/app/customers/new/page.tsx` - Removed SERVICE address type, changed default to Billing, added validation

**Frontend - Service Request Pages:**
- ✅ `apps/web/src/app/service-requests/new/page.tsx` - Added pending address staging system, SERVICE filtering
- ✅ `apps/web/src/app/service-requests/edit/[id]/page.tsx` - Added pending address staging system, fixed navigation

**Mock Data:**
- ✅ `apps/web/src/lib/mockData.ts` - Added local development admin user

### 🎯 Impact
- Better data organization with clear address type separation
- Improved UX with staged address creation (no accidental saves)
- Consistent navigation flow in service request workflows
- Enhanced form validation for required customer fields

### 📊 Files Changed: 6

---

## 📦 Commit #29 - 2025-12-23 (IST)

**Developer:** Veera Kuppili
**Type:** Refactor / Breaking Change

### 📝 Commit Message
```
refactor: Remove isPrimary attribute, use type field for address classification

BREAKING CHANGE: Removed isPrimary boolean field from addresses in favor of type enum

Changes:
- Database: Removed isPrimary column from Address model in Prisma schema
- Migration: Created migration to sync isPrimary → type='PRIMARY' before dropping column
- Backend: Updated customer.postgres.service to use type='PRIMARY' instead of isPrimary
- API: Removed isPrimary from all POST/PUT endpoints and handlers
- Frontend: Updated all customer pages (edit, new, list, view) to use type field
- Services: Removed isPrimary from customerService and simpleCustomerService
- Types: Removed isPrimary from all TypeScript interfaces (Address, database.types, etc)
- Tests: Updated all unit tests, integration tests, and visual tests
- Mobile: Removed is_primary from mobile app schema and interfaces
- Validation: Added mandatory billing address requirement
- UI: Added billing address badge (green) and protection for last billing address

Migration details:
1. Syncs existing data (sets type='PRIMARY' where isPrimary=true)
2. Handles duplicate primary addresses (keeps oldest)
3. Drops old isPrimary-based constraint
4. Creates new type-based unique constraint
5. Removes isPrimary column

Files changed: 28
- Backend: schema.prisma, seed.ts, services, handlers, index.ts
- Frontend: edit/new/list/view pages, services, types
- Mobile: db/schema.ts, customerService.ts
- Tests: unit, integration, visual
- Scripts: migration.sql, migrate-dynamodb-to-postgres.ts
```

### ✨ Changes

**Database & Schema:**
- ✅ `apps/api/prisma/schema.prisma` - Removed isPrimary from Address, Organization, ServiceLocation models
- ✅ `apps/api/prisma/migrations/20251223_remove_isprimary_use_type/migration.sql` - New 5-step migration
- ✅ `apps/api/prisma/seed.ts` - Changed to type='PRIMARY'

**Backend Services:**
- ✅ `apps/api/src/services/customer.postgres.service.ts` - Removed all isPrimary logic, now uses type='PRIMARY'
- ✅ `apps/api/src/services/llm-function-executor.ts` - Find primary by type='PRIMARY'
- ✅ `apps/api/src/services/vapi/vapi.tools.ts` - Changed to type='PRIMARY'
- ✅ `apps/api/src/index.ts` - Removed isPrimary from POST/PUT address endpoints

**API Handlers:**
- ✅ `apps/api/src/handlers/customers/create-postgres.ts` - Removed isPrimary from Zod schema
- ✅ `apps/api/src/handlers/customers/get-postgres.ts` - Find primary by type
- ✅ `apps/api/src/handlers/customers/list-postgres.ts` - Find primary by type
- ✅ `apps/api/src/handlers/customers/update-postgres.ts` - Find primary by type

**Frontend Pages:**
- ✅ `apps/web/src/app/customers/edit/[id]/page.tsx` - Removed isPrimary, added billing protection & badge
- ✅ `apps/web/src/app/customers/new/page.tsx` - Removed isPrimary, added billing validation & badge
- ✅ `apps/web/src/app/customers/page.tsx` - Find primary by type
- ✅ `apps/web/src/app/customers/view/[id]/page.tsx` - Find primary by type

**Frontend Services:**
- ✅ `apps/web/src/services/customerService.ts` - Removed all isPrimary references
- ✅ `apps/web/src/services/simpleCustomerService.ts` - Removed isPrimary from interfaces

**Type Definitions:**
- ✅ `apps/web/src/types/database.types.ts` - Removed isPrimary from Address & Organization
- ✅ `apps/web/src/types/enhancedTypes.ts` - Removed isPrimary from Address
- ✅ `apps/web/src/config/apiSchemas/customer.schema.ts` - Removed isPrimary logic

**Mobile App:**
- ✅ `apps/mobile/db/schema.ts` - Removed is_primary field
- ✅ `apps/mobile/services/api/customerService.ts` - Removed isPrimary from interface

**Tests:**
- ✅ `apps/api/src/services/customer.postgres.service.unit.test.ts` - All tests use type='PRIMARY'
- ✅ `apps/api/tests/integration/customer-create.integration.test.ts` - Changed to type
- ✅ `apps/web/tests/visual/helpers.ts` - Visual test mock data
- ✅ `apps/web/tests/visual/pages.visual.spec.ts` - Visual test spec

**Scripts:**
- ✅ `apps/api/scripts/migrate-dynamodb-to-postgres.ts` - Uses type='PRIMARY'

**Impact:**
- **BREAKING:** isPrimary field completely removed from all address records
- Primary addresses now identified by `type='PRIMARY'` enum value
- Database constraint updated to enforce single primary per customer via type field
- Mandatory billing address requirement enforced (frontend & backend)
- Last billing address protected from deletion (similar to primary)
- UI improvements: Green billing badge, lock icon for protected addresses
- Migration handles existing data automatically with deduplication
- All test suites updated to reflect new architecture

**Migration Required:**
Run `npx prisma migrate deploy` to apply migration before deploying code changes

---

## 📦 Commit #28 - 2025-12-22 (IST)

**Developer:** Veera Kuppili
**Type:** Fix

### 📝 Commit Message
```
fix(service-requests): pre-populate serviceAddressId and assignedToId in edit form

- Check direct serviceAddressId field before nested serviceAddress.id
- Add fallback to direct assignedToId field alongside assignedTo.id
- Ensures edit form correctly displays previously selected address and technician
```

### ✨ Changes
**Files Modified:**
- ✅ `apps/web/src/app/service-requests/edit/[id]/page.tsx` - Fixed form pre-population logic

**Impact:**
- Edit form now correctly displays previously selected service address
- Assigned technician properly pre-populated in edit mode
- Improved data loading with multiple fallback strategies

---

## 📦 Commit #27 - 2025-12-22 (IST)

**Developer:** Veera Kuppili
**Type:** Feature / Enhancement

### 📝 Commit Message
```
feat: implement Service Requests CRUD and enhance customer address management

- Add Service Requests module with full CRUD operations
  * Create, read, update, delete handlers (Lambda/PostgreSQL)
  * New, edit, and view pages with modern UI
  * Form validation and unsaved changes tracking
  * Keyboard shortcuts (Ctrl+S save, Escape cancel)
  * Voice Agent request protection (cannot delete)
  * Support EMERGENCY urgency level

- Enhance customer address management
  * Support multiple addresses in single creation request
  * Maintain backward compatibility with flat field structure
  * Add addresses array with field name flexibility (camelCase/snake_case)

- Add primary address constraint enforcement
  * Database: partial unique index on (customerId, isPrimary)
  * Backend: automatic primary address management
  * Frontend: validation preventing multiple/no primary addresses

- UI improvements
  * Add Service Request to main navigation sidebar
  * Fix SearchableSelect dropdown positioning (opens upward near bottom)
  * Add service address modal for quick address creation
  * Modern card layouts with gradient headers and toast notifications

- Database migrations
  * Rename email constraint to Prisma convention (customers_tenantId_email_key)
  * Add single primary address constraint

- Update services
  * customerService: addresses array support with logging
  * serviceRequestService: complete CRUD methods with timeout handling
  * Resolve Technician schema conflict (use Employee schema)
```

### ✨ Changes
**Files Created:**
- ✅ `apps/api/prisma/migrations/20251220202504_init/migration.sql`
- ✅ `apps/api/prisma/migrations/20251221_add_single_primary_address_constraint/migration.sql`
- ✅ `apps/api/src/handlers/service-requests/create-postgres.ts`
- ✅ `apps/api/src/handlers/service-requests/delete-postgres.ts`
- ✅ `apps/api/src/handlers/service-requests/get-by-id-postgres.ts`
- ✅ `apps/api/src/handlers/service-requests/update-postgres.ts`
- ✅ `apps/web/src/app/service-requests/edit/[id]/page.tsx`
- ✅ `apps/web/src/app/service-requests/new/page.tsx`
- ✅ `apps/web/src/app/service-requests/view/[id]/page.tsx`

**Files Modified:**
- ✅ `apps/web/src/components/SidebarLayout.tsx` - Added Service Request nav item
- ✅ `apps/web/src/components/ui/SearchableSelect.tsx` - Upward dropdown positioning
- ✅ `apps/web/src/config/apiSchemas/index.ts` - Resolved Technician schema conflict
- ✅ `apps/web/src/services/customerService.ts` - Addresses array support
- ✅ `apps/web/src/services/serviceRequestService.ts` - Full CRUD operations

**Impact:**
- Complete Service Requests feature with CRUD operations
- Enhanced customer address management with constraint enforcement
- Improved UI/UX with better dropdown behavior and modern layouts
- Database integrity with primary address constraints

---

## 📦 Commit #26 - 2025-12-20 8:41 PM (IST)

**Developer:** Ghanshyam Patil
**Type:** Refactor / Cleanup

### 📝 Commit Message
```
refactor: Consolidate technician module into employee system

- Remove duplicate technician pages and components
  - Delete /technicians list, create, and detail pages
  - Remove technicianService.ts and related schemas
  - Clean up technician navigation menu items

- Fix backend and database issues
  - Resolve port conflicts and missing dependencies
  - Seed database with demo data (10 customers, 2 employees, 5 jobs)
  - Fix tenant ID validation and mock data alignment

- Consolidate to unified employee management
  - Update scheduler routing to use employees with filter
  - Add ?filter=technicians URL parameter support
  - Dynamic page titles based on filter state
  - Route technician role users to filtered employee view

- Resolve TypeScript compilation errors
  - Fix tsconfig.json rootDir configuration
  - Clean Next.js build cache
```

### ✨ Changes
**Files Deleted:**
- ❌ `apps/web/src/app/technicians/` - Entire directory
- ❌ `apps/web/src/services/technicianService.ts`
- ❌ `apps/web/src/config/apiSchemas/technician.schema.ts`
- ❌ `apps/web/src/components/technicians/` - Entire directory
- ❌ `apps/web/src/app/scheduler/technician/page.tsx`

**Files Modified:**
- ✅ `apps/web/src/components/SidebarLayout.tsx` - Removed Technicians nav item
- ✅ `apps/web/src/components/Navigation.tsx` - Removed Technicians nav item
- ✅ `apps/web/src/app/scheduler/admin/page.tsx` - Use employeeService
- ✅ `apps/web/src/app/scheduler/page.tsx` - Route technicians to employees
- ✅ `apps/web/src/app/employees/page.tsx` - Add technician filter support
- ✅ `apps/web/src/config/apiSchemas/employee.schema.ts` - Use Employee type
- ✅ `apps/web/src/services/entityModelService.ts` - Remove Technician entity
- ✅ `apps/api/src/services/customer.postgres.service.ts` - Remove UUID validation
- ✅ `apps/web/src/lib/mockData.ts` - Update tenant IDs to 'local-tenant'
- ✅ `apps/api/tsconfig.json` - Fix rootDir configuration

---

## 📦 Commit #25 - 2025-12-16 03:00 PM (IST)

**Developer:** Ghanshyam Patil
**Type:** Feature / Enhancement

### 📝 Commit Message
```
feat: Enhance UI consistency and responsiveness across all pages

- Update API configuration from port 8090 to 4000
  - Modified next.config.js proxy rewrites for all endpoints
  - Updated proxy route default URL in [...path]/route.ts

- Implement responsive table design with zoom support
  - Add responsive padding (px-3 sm:px-4 md:px-6) to all table cells
  - Update text sizes to be responsive (text-xs sm:text-sm)
  - Make icons responsive with size breakpoints
  - Add min-w-max wrapper for proper horizontal scrolling
  - Apply changes to customers, employees, and technicians tables

- Standardize page headers across the application
  - Add gradient blue header (from-[#0f118a] to-[#1e40af]) to customers and jobs pages
  - Match header style with employees and technicians pages
  - Move page titles and descriptions to header section
  - Add Dashboard button to all page headers

- Remove create/add action buttons from headers
  - Remove "Add Technician" button from technicians page
  - Remove "Add Employee" button from employees page
  - Remove "New Customer" button from customers page
  - Remove "Create Job" button from jobs page

- Improve empty state handling for jobs page
  - Display "No jobs found" message within table structure
  - Show table headers even when no data is present
  - Match empty state pattern with technicians page
  - Fix conditional rendering to always show table wrapper

- Fix JSX syntax errors in jobs page pagination and view mode conditionals
```

### ✨ Changes
**Files Modified:**
- ✅ `apps/web/next.config.js` - Updated API proxy ports from 8090 to 4000
- ✅ `apps/web/src/app/api/proxy/[...path]/route.ts` - Updated default API URL
- ✅ `apps/web/src/app/customers/page.tsx` - Responsive tables, standardized header
- ✅ `apps/web/src/app/employees/page.tsx` - Responsive tables, removed add button
- ✅ `apps/web/src/app/technicians/page.tsx` - Responsive tables, removed add button
- ✅ `apps/web/src/app/jobs/page.tsx` - Responsive tables, standardized header, empty state fix

**Impact:**
- Enhanced user experience with responsive design
- Consistent UI across all management pages
- Better zoom support for accessibility
- Cleaner header design with standardized actions

---

## 📦 Commit #24 - 2025-12-07 04:53 PM (EST)

**Developer:** Ashok kata
**Type:** Merge / Integration
**Commit Hash:** `b85cc59`

### 📝 Commit Message
```
Merge local changes with server updates

- Integrated server updates including new pricing management features
- Resolved merge conflicts in customer, job, and technician pages
- Kept server versions with enhanced filtering, sorting, and responsive design
- Preserved local changes for API client, contexts, and service configurations
```

### ✨ Changes
**Merge Strategy:**
- Pulled 4 commits from remote (pricing features, UI enhancements, schema updates)
- Resolved 4 merge conflicts prioritizing server versions
- Integrated local development changes with production updates

**Files Modified (25 files):**
- ✅ `src/app/customers/edit/[id]/page.tsx` - Kept server's comprehensive address deletion/update logic
- ✅ `src/app/customers/page.tsx` - Adopted server's modern UI with filter and view mode toggles
- ✅ `src/app/jobs/page.tsx` - Merged with server's responsive design and mobile support
- ✅ `src/app/technicians/page.tsx` - Integrated server's advanced filtering and sorting
- ✅ `.claude/settings.local.json` - Updated tool permissions
- ✅ `.env.local` - Environment configuration updates
- ✅ `package.json` & `package-lock.json` - Dependency updates
- ✅ `src/app/api/ai/chat/route.ts` - AI chat endpoint updates
- ✅ `src/app/api/ai/chat/stream/route.ts` - Streaming chat updates
- ✅ `src/app/api/proxy/[...path]/route.ts` - Proxy configuration updates
- ✅ `src/app/dashboard/page.tsx` - Dashboard enhancements
- ✅ `src/app/employees/create/page.tsx` - Employee creation updates
- ✅ `src/app/employees/page.tsx` - Employee management updates
- ✅ `src/app/invoices/[id]/page.tsx` - Invoice detail updates
- ✅ `src/app/invoices/create/page.tsx` - Invoice creation updates
- ✅ `src/app/invoices/page.tsx` - Invoice listing updates
- ✅ `src/app/jobs/[id]/edit/page.tsx` - Job edit updates
- ✅ `src/app/jobs/[id]/page.tsx` - Job detail updates
- ✅ `src/app/layout.tsx` - Root layout updates
- ✅ `src/app/settings/page.tsx` - Settings page updates
- ✅ `src/app/technicians/[id]/page.tsx` - Technician detail updates
- ✅ `src/components/SidebarLayout.tsx` - Sidebar component updates
- ✅ `src/contexts/TenantContext.tsx` - Tenant context updates
- ✅ `src/services/apiClient.ts` - API client enhancements
- ✅ `src/types/index.ts` - Type definition updates
- ✅ `tsconfig.json` - TypeScript configuration updates

### 🎯 Conflict Resolution
**Resolved 4 merge conflicts:**
1. **customers/edit/[id]/page.tsx** - Chose server's address management logic with proper deletion tracking
2. **customers/page.tsx** - Adopted server's Actions Bar with filter/view mode toggles over gradient header
3. **jobs/page.tsx** - Integrated server's responsive design with mobile breakpoints and sort clearing
4. **technicians/page.tsx** - Used `git checkout --ours` for server's comprehensive filtering (name, email, phone, role, status, skills)

### 🔄 Server Updates Integrated
**New Pricing Management:** (from server commits)
- New pricing module with CRUD operations
- Pricing schemas and services
- Pricing pages and UI components

**UI/UX Enhancements:** (from server commits)
- Enhanced customer management with cache optimization
- Improved address operations
- Modern gradient designs
- Toast notifications
- Responsive mobile-first layouts

### 📊 Statistics
- **25 files changed**
- **1,989 insertions(+)**
- **397 deletions(-)**
- **Net change:** +1,592 lines

---

## 📦 Commit #23 - 2025-12-08 01:55 AM (IST)

**Developer:** Veera Kuppili
**Type:** Feature

### 📝 Commit Message
```
feat: optimize customer management with caching, pagination, and UI enhancements

- Add cache-first strategy with 5min staleTime and pre-population from list
- Implement pagination (20/page) with table/card view toggle
- Redesign customer create page with live preview and modern UI
- Simplify deleteCustomer to single API call (backend cascade deletes)
- Add batch address creation with OData binding in POST payload
- Enhance address operations with centralized schema transformations
- Add toast notifications and collapsible filters
- Apply cache optimization to technician detail page
```

### ✨ Changes
**Files Modified:**
- ✅ `src/app/customers/page.tsx` - Added pagination, view modes, cache pre-population, enhanced filters
- ✅ `src/app/customers/new/page.tsx` - Complete redesign with live preview, toast notifications, removed address creation
- ✅ `src/app/technicians/[id]/page.tsx` - Applied cache-first strategy matching customer optimization
- ✅ `src/config/apiSchemas/customer.schema.ts` - Added transformCustomerAddressToApi, enhanced transformCustomerToApi with isCreate param
- ✅ `src/services/customerService.ts` - Simplified deleteCustomer, added addCustomerAddresses, improved address operations
- ✅ `src/app/globals.css` - Added animate-slide-in-right keyframe for toast notifications

### 🎨 UI/UX Improvements
**Customer List Page:**
- Scroll-based pagination (20 items/page) with top/bottom controls
- Table and Card (Matrix) view toggle
- Collapsible filter panel with active filter count badge
- Enhanced table styling with gradient header and hover effects
- Card view with customer preview cards showing contact info and tags

**Customer Create Page:**
- Two-column layout with live preview sidebar
- Customer preview card with dynamic name display and type badge
- Modern gradient design with glass effects
- Toast notifications with auto-dismiss
- Tags and notes management in sidebar
- Quick options checkboxes (notifications, card on file, contractor)
- Simplified flow - addresses added after customer creation

### ⚡ Performance Optimizations
**Cache Strategy:**
- React Query cache-first loading with 5min staleTime, 30min gcTime
- Pre-population: List page populates individual customer cache for zero-fetch navigation
- Disabled auto-refetch (refetchOnMount, refetchOnWindowFocus, refetchOnReconnect)
- Direct cache updates on save instead of invalidation

**API Optimization:**
- Reduced deleteCustomer from ~50 lines to ~15 lines (single API call)
- Backend handles cascading address deletes
- Address creation includes OData binding in POST payload (no separate binding call)
- Batch address creation with error handling

### 🔧 Technical Improvements
- Centralized schema transformations for addresses
- Job title mapping to OData enum values
- Comprehensive null/undefined handling in transforms
- isCreate parameter in transformCustomerToApi excludes CustomerID on creation
- Better error logging with full context
- 204 No Content response handling in address updates

---

## 📦 Commit #22 - 2025-12-08 1:20 PM (IST)

**Developer:** Ghanshyam Patil
**Type:** Feature

### 📝 Commit Message
```
feat(technicians,jobs): implement advanced UI with pagination and card redesign

- Redesigned Technicians page with Jobs-style advanced UI (Grid/Matrix views, filters, sorting, pagination)
- Updated pagination active button color to brand blue (#06118d) across Jobs and Technicians pages
- Implemented Matrix view cards with gradient headers, icon-based sections, and action button footer
- Added multi-column sorting with numbered badges in Grid view (table)
- Implemented scroll-based pagination visibility (top/bottom) for both Grid and Matrix views
- Enhanced MultiSearchableSelect to accept both string arrays and option objects
- Added comprehensive filtering (Name, Email, Phone, Role, Skills, Status) with active filter badges
- Implemented session storage persistence for all view states and filter criteria
- Fixed CalendarIcon import to resolve runtime errors
```

### ✨ Changes
**Files Modified:**
- ✅ `src/app/jobs/page.tsx` - Updated pagination active button color to #06118d (4 sections)
- ✅ `src/app/technicians/page.tsx` - Complete UI overhaul matching Jobs page design patterns
- ✅ `src/components/ui/MultiSearchableSelect.tsx` - Enhanced to accept string arrays or option objects

### 🎨 UI/UX Improvements
**Technicians Page Redesign:**
- Grid View (Table):
  - Gradient header background (gray-50 to gray-100)
  - Multi-column sorting with up/down arrow controls and numbered badges
  - Alternating row backgrounds for better readability
  - Action buttons (View/Edit/Delete) with brand color hover effects
  - Integrated pagination bar at top and bottom based on scroll position

- Matrix View (Cards):
  - Gradient header with title, ID, role badge, and status badge
  - Icon-based content sections (CalendarIcon for email and phone)
  - Skills displayed as compact blue badges (max 3 visible)
  - Footer with View/Edit/Delete buttons matching Jobs page styling
  - Hover effects with brand blue (#06118d) transitions

**Advanced Features:**
- Session storage for filters, view mode, sorting, pagination state
- 6 comprehensive filters with multi-select support
- Active filter badges display with count summary
- Show/Hide Filters toggle with brand color styling
- Pagination visible only when scrolling near top or bottom (300px threshold)
- Consistent brand blue (#06118d) for all primary actions

**Pagination Color Standardization:**
- Changed active pagination button from `bg-blue-600` to brand blue `#06118d`
- Applied to all 4 pagination sections in Jobs page (Grid top/bottom, Matrix top/bottom)
- Applied to all pagination sections in Technicians page
- Consistent inline style with `backgroundColor: '#06118d'` and `border-[#06118d]`

### 🔧 Technical Improvements
**Component Enhancement:**
- MultiSearchableSelect now handles both `string[]` and `Option[]` types
- Internal normalization ensures consistent behavior
- Maintains backward compatibility with existing implementations

**Import Fixes:**
- Added missing CalendarIcon import to prevent runtime errors
- All Heroicons properly imported and utilized

### 📊 State Management
- Session storage keys prefixed with `technicians_` and `jobs_`
- Persisted states: filters, view mode, current page, sort criteria, show filters
- Automatic restoration on page reload
- Independent state management for each page

---

## 📦 Commit #21 - 2025-12-08 11:45 PM (IST)

**Developer:** Logeshwaran S
**Type:** Feature

### 📝 Commit Message
```
feat(jobs): comprehensive UI improvements and state persistence

- Standardized button styling with #06118d color scheme across Show Filters, Grid View, and Add Job buttons
- Updated action buttons (View/Edit/Delete) with consistent border-based design and hover effects
- Fixed multi-select dropdowns to prevent width expansion with single-line layout and item limit
- Redesigned active filters display as compact single-line badges with filter count
- Enhanced Clear Filters button with blue background matching primary actions
- Compacted pagination controls in table view to match card view styling
- Implemented sessionStorage for state persistence (filters, view mode, pagination, sort criteria)
- Simplified card view to display only Date and Location fields for cleaner layout
- Made all components fully responsive across mobile, tablet, and desktop viewports
```

### ✨ Changes
**Files Modified:**
- ✅ `src/app/jobs/page.tsx` - Complete UI overhaul with standardized styling and state persistence
- ✅ `src/components/ui/MultiSearchableSelect.tsx` - Fixed width expansion with single-line layout and item limits

### 🎨 UI/UX Improvements
**Button Standardization:**
- Show Filters, Grid View, Add Job buttons now use #06118d color scheme
- Replaced Button components with native `<button>` elements for consistent styling
- Added interactive hover effects (background: #06118d, text: white)
- View/Edit buttons: #06118d border with white background, blue hover
- Delete button: Red (#dc2626) border with light red (#fee2e2) hover
- All buttons have rounded corners and consistent padding

**Multi-Select Dropdowns:**
- Fixed width to prevent horizontal expansion
- Display maximum 2 selected items with "+N" badge for additional items
- Single-line layout with `whitespace-nowrap` and overflow handling
- Label truncation at 80px width for long text

**Active Filters:**
- Changed from multi-line blocks to single-line compact badges
- Shows inline labels (Job ID:, Title:, Status:, Priority:)
- Filter count displayed on the right side
- Removed duplicate filter count line
- Excludes "All" selections from display

**Pagination:**
- Compacted table view pagination to match card view
- Reduced icon sizes (h-5→h-4, w-5→w-4)
- Smaller text (text-sm→text-xs)
- Consistent padding and backgrounds across views

**Card View:**
- Simplified to show only 2 fields: Date and Location
- Removed: Assigned To, Description, Estimated Duration, Created Date
- Cleaner, more focused card layout

### 💾 State Persistence
**SessionStorage Integration:**
- Persists filter values (Job ID, Title, Location, Assigned To, Status, Priority)
- Saves view mode preference (table/card)
- Remembers current page number
- Stores sort criteria
- Maintains show/hide filters state
- State restores automatically on page navigation return

### 📱 Responsive Design
- All buttons and controls adapt to mobile, tablet, and desktop
- Consistent behavior across all viewport sizes
- Touch-friendly tap targets on mobile devices

---

## 📦 Commit #20 - 2025-12-07 11:00 PM (IST)

**Developer:** Logeshwaran S
**Type:** Feature

### 📝 Commit Message
```
feat: Add pricing module with job integration and auto-calculation

- Create complete pricing CRUD module (list, create, view pages)
- Add Pricing entity with TypeScript interfaces and OData schema transformations
- Implement pricingService with all CRUD operations and calculatePricing helper
- Integrate pricing creation into job save workflow with automatic calculations
- Update job service to expand Pricing relation in GET requests
- Add pricing display to job details page with discount, tax, and total
- Implement OData binding pattern (Job@odata.bind) for job-pricing association
- Add comprehensive debug logging for pricing POST payload verification
- Support multi-tenant architecture with proper field mappings (PascalCase ↔ camelCase)
- Include pricing documentation with API endpoints, examples, and use cases
```

### ✨ Changes
**New Files Created:**
- ✅ `src/app/pricing/page.tsx` - Pricing list with filtering, sorting, pagination
- ✅ `src/app/pricing/create/page.tsx` - Create form with real-time auto-calculation
- ✅ `src/app/pricing/[id]/page.tsx` - Pricing details view with job association
- ✅ `src/services/pricingService.ts` - Complete CRUD service with calculatePricing helper
- ✅ `src/config/apiSchemas/pricing.schema.ts` - OData schema transformations
- ✅ `src/app/pricing/README.md` - Complete module documentation

**Files Modified:**
- ✅ `src/types/index.ts` - Added Pricing, CreatePricingRequest interfaces; updated Job with lineItems and pricing fields
- ✅ `src/services/jobService.ts` - Added Pricing to $expand in getAllJobs() and getJobById()
- ✅ `src/config/apiSchemas/job.schema.ts` - Transform Pricing from API response
- ✅ `src/app/jobs/create/page.tsx` - Auto-create pricing on job save with calculated tax/total
- ✅ `src/app/jobs/[id]/page.tsx` - Display pricing data (subtotal, discount, tax, total, county)

### 🔧 Technical Details
**Pricing Module Features:**
- Table view with sortable columns (ID, SubTotal, Discount, Tax, Total, County)
- Multi-column sorting with visual indicators
- Filtering by Pricing ID, County, search query
- Scroll-aware pagination (top/bottom controls)
- Real-time tax and total calculation using formula: Tax = (SubTotal - Discount) × TaxRate / 100
- Cache-first navigation with React Query
- Offline mode detection

**Job Integration:**
- Pricing automatically created when job is saved with line items
- POST payload: SubTotal, Discount, TaxRate, TaxAmount, Total, County, Job@odata.bind
- OData binding pattern establishes FK relationship
- Pricing data displayed in job details with discount shown in red
- Comprehensive console logging for debugging

**API Endpoints:**
- GET `/odata/iworks/v1/Pricing?$expand=Job`
- GET `/odata/iworks/v1/Pricing({id})?$expand=Job`
- POST `/odata/iworks/v1/Pricing`
- PATCH `/odata/iworks/v1/Pricing({id})`
- DELETE `/odata/iworks/v1/Pricing({id})`

**Field Mappings:**
- PriceID ↔ id
- SubTotal ↔ subTotal
- Discount ↔ discount
- TaxRate ↔ taxRate
- TaxAmount ↔ taxAmount
- Total ↔ total
- County ↔ county

---

## 📦 Commit #19 - 2025-12-07 9:22 PM (IST)

**Developer:** Ghanshyam Patil
**Type:** Feature

### 📝 Commit Message
```
Add Employee Management with IsTechnician field and Active/Inactive status

- Added IsTechnician boolean field to Employee/Technician interface
- Created employeeService.ts with full CRUD operations (GET, POST, PATCH, DELETE)
- Implemented employee create/edit page (/employees/create) with cache-first strategy
- Added IsTechnician field visible in employee form (defaults to false)
- Technician service now forces IsTechnician=true when creating/updating
- Updated employee management page to display all employees in grid
- Added edit and delete functionality with confirmation modal for employees
- Changed status display from Available/Busy/Off Duty to Active/Inactive
- Updated schema transformations to handle Active/Inactive status mapping
- Modified both technician and employee pages to show Active/Inactive consistently
- Connected "Add Employee" button to navigate to /employees/create
- Implemented cache-first data loading for employee edit (same as technician)
- Updated Quick Stats to show Total Employees, Active Employees, and Technicians
- Added "Is Technician" column in employee grid to distinguish employee types
```

### ✨ Changes
- ✅ Created `src/services/employeeService.ts` with full CRUD operations
- ✅ Created `src/app/employees/create/page.tsx` for employee add/edit
- ✅ Added IsTechnician boolean field to Employee and Technician interfaces
- ✅ Updated employee schema transformations for IsTechnician and Active/Inactive
- ✅ Refactored employee management page to use API with React Query
- ✅ Implemented cache-first strategy for employee edit (loads from cache before API)
- ✅ Added delete functionality with confirmation modal
- ✅ Changed status display to Active/Inactive across all pages
- ✅ Updated technician service to force isTechnician=true
- ✅ Modified employee grid to show all employees including technicians
- ✅ Added "Is Technician" column in employee table
- ✅ Updated Quick Stats with proper employee counts

### 🔧 Technical Details
**Files Modified:**
- `src/services/employeeService.ts` - New service for employee CRUD
- `src/app/employees/create/page.tsx` - New employee create/edit page
- `src/app/employees/page.tsx` - Refactored to use API
- `src/config/apiSchemas/employee.schema.ts` - Updated transformations
- `src/services/technicianService.ts` - Force isTechnician=true
- `src/app/technicians/page.tsx` - Updated status display
- `src/app/technicians/create/page.tsx` - Updated status handling

**API Integration:**
- Endpoint: `/odata/iworks/v1/Employees`
- Methods: GET (all), GET (by ID), POST, PATCH, DELETE
- Field Mapping: IsTechnician ↔ isTechnician, IsActive ↔ status (Active/Inactive)
- Cache Strategy: TanStack Query with cache-first approach

**UI Improvements:**
- Employee grid shows: Name, Email, Phone, Role, Is Technician, Status, Actions
- Status badges: Green for Active, Red for Inactive
- Delete confirmation modal matches technician page style
- Form includes "Is Technician" radio buttons (Yes/No)
- Handles both old (Available/Busy/Off Duty) and new (Active/Inactive) status values

### 🎯 Impact
- Unified employee management for both technicians and non-technician staff
- Clear distinction between employee types via IsTechnician field
- Consistent Active/Inactive status across entire application
- Improved user experience with cache-first data loading
- Same CRUD operations for both employees and technicians via shared endpoint

---

## 📦 Commit #18 - 2025-12-07 12:28 AM (IST)

**Developer:** Claude Sonnet 4.5 & Ashok
**Type:** Feature

### 📝 Commit Message
```
feat: add document upload capability and dedicated chat page

- Add file attachment support to AIRA chatbot (both floating and full-page)
- Create dedicated responsive chat page at /chat route
- Add AI Chat navigation item to sidebar with ChatBubbleLeftRightIcon
- Implement multiple file selection and preview functionality
- Add attachment display in message bubbles with file metadata
- Support PDF, DOC, DOCX, TXT, and image files
- Create full-page responsive chat interface with modern gradient header
- Enhance ChatBot component with file upload button and remove attachment feature
- Add ChatAttachment type definition for file metadata
- Implement file size formatter for human-readable display

Features:
- Document upload with paperclip icon
- Multiple file selection support
- File preview before sending (name and size)
- Remove attachment functionality
- Attachments displayed in message bubbles
- Full-page chat interface at /chat
- Responsive design for all screen sizes
- Three access methods: floating button, navigation menu, direct URL

UI/UX:
- Floating chat: Compact 400x600px window for quick questions
- Full-page chat: Spacious interface for longer conversations
- File size display in human-readable format (KB, MB, GB)
- Clean attachment cards with icon and metadata
- Optimized for desktop, tablet, and mobile devices
```

### ✨ Changes
- ✅ Added file attachment support to ChatBot component
- ✅ Implemented file upload button with paperclip icon
- ✅ Added multiple file selection capability
- ✅ Created file preview functionality (name and size display)
- ✅ Implemented remove attachment feature
- ✅ Added attachment display in message bubbles
- ✅ Created dedicated full-page chat interface at /chat
- ✅ Added AI Chat navigation item to sidebar
- ✅ Implemented responsive design for all screen sizes
- ✅ Added ChatAttachment type definition
- ✅ Created file size formatter utility
- ✅ Enhanced chat UI with gradient header
- ✅ Added clear chat functionality to full-page view
- ✅ Supported file formats: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF

### 📄 Files Created (1)
- `src/app/chat/page.tsx` - Full-page responsive chat interface with document upload

### 📄 Files Modified (3)
- `src/components/AIChat/ChatBot.tsx` - Added file upload functionality and attachment display
- `src/components/SidebarLayout.tsx` - Added AI Chat navigation item with ChatBubbleLeftRightIcon
- `src/types/index.ts` - Added ChatMessage.attachments and ChatAttachment interface

### 🎨 UI/UX Enhancements
- **Floating Chat Window**: Compact 400x600px interface for quick interactions
- **Full-Page Chat**: Spacious, distraction-free interface at /chat route
- **File Upload**: Paperclip button with multi-file selection
- **Attachment Preview**: Shows filename and size before sending
- **Message Attachments**: Clean cards displaying file metadata
- **Responsive Design**: Optimized for desktop, tablet, and mobile

### 📱 Access Methods
1. **Floating Button**: Click blue chat icon in bottom-right corner
2. **Navigation Menu**: Select "AI Chat" from sidebar
3. **Direct URL**: Navigate to `/chat` route

### 💡 Technical Details
- File input with multiple selection support
- File size formatter (Bytes, KB, MB, GB)
- Attachment metadata tracking (id, name, size, type)
- File removal before sending
- Integration with existing chat service
- Responsive layout with max-width containers

---

## 📦 Commit #17 - 2025-12-06 11:35 PM (IST)

**Developer:** Claude Sonnet 4.5 & Ashok
**Type:** Feature

### 📝 Commit Message
```
feat: add AIRA AI chatbot with Mendix/Bedrock integration and update brand colors

- Implement AIRA (AI Resource Assistant) conversational chatbot
- Create modern chat UI with gradient header and message bubbles
- Add floating chat button with tooltip and animations
- Integrate with Mendix/Bedrock LLM APIs (streaming and regular)
- Update brand color scheme from #1e40af to #0f118a across sidebar and chatbot
- Add mock API endpoints for testing AI responses
- Include comprehensive documentation for Mendix integration

Components:
- ChatBot: Main chat interface with streaming support and typing indicators
- ChatButton: Floating action button with notification badge
- AI Chat Service: API communication layer with conversation management
- Mock API: Test endpoints simulating Mendix/Bedrock responses

Features:
- Real-time message streaming with Server-Sent Events (SSE)
- Conversation context management with conversationId
- Auto-scroll to latest messages
- Clear chat functionality
- Field service-focused responses (jobs, customers, scheduling, etc.)
- Responsive design with smooth animations
- Custom brand colors (#0f118a) applied consistently
```

### ✨ Changes
- ✅ Created AIRA (AI Resource Assistant) conversational chatbot component
- ✅ Implemented ChatBot component with modern gradient UI and message bubbles
- ✅ Added ChatButton floating action button with notification badge and tooltip
- ✅ Built AI Chat Service for Mendix/Bedrock API communication
- ✅ Implemented real-time message streaming with Server-Sent Events (SSE)
- ✅ Added conversation context management with conversationId tracking
- ✅ Created mock API endpoints for testing (chat and stream routes)
- ✅ Updated sidebar background color from #1e40af to #0f118a
- ✅ Applied new brand color (#0f118a) to chatbot header, buttons, and messages
- ✅ Added auto-scroll functionality for new messages
- ✅ Implemented typing indicators and loading states
- ✅ Added clear chat functionality to reset conversations
- ✅ Created field service-focused AI responses (jobs, customers, scheduling, etc.)
- ✅ Added smooth animations with fadeIn effect
- ✅ Integrated chatbot into SidebarLayout for global access
- ✅ Added comprehensive README documentation for Mendix integration

### 📄 Files Created (7)
- `src/components/AIChat/ChatBot.tsx` - Main chat interface with streaming support
- `src/components/AIChat/ChatButton.tsx` - Floating action button component
- `src/components/AIChat/index.ts` - Component exports
- `src/components/AIChat/README.md` - Comprehensive integration documentation
- `src/services/aiChatService.ts` - AI chat API service layer
- `src/app/api/ai/chat/route.ts` - Mock chat API endpoint
- `src/app/api/ai/chat/stream/route.ts` - Mock streaming API endpoint

### 📄 Files Modified (3)
- `src/components/SidebarLayout.tsx` - Integrated ChatButton and updated sidebar colors to #0f118a
- `src/types/index.ts` - Added ChatMessage, ChatRequest, ChatResponse interfaces
- `src/app/globals.css` - Added fadeIn animation for chat messages

### 🎨 Design Updates
- Updated brand color scheme throughout the application
- Sidebar: #1e40af → #0f118a (deeper, more saturated blue)
- Chat gradient: from-[#0f118a] to-[#1e40af]
- User message bubbles: #0f118a
- Consistent color application across all interactive elements

### 🔧 Technical Details
- TypeScript interfaces for type safety
- React hooks for state management (useState, useRef, useEffect)
- Server-Sent Events (SSE) for streaming responses
- REST API integration ready for Mendix/Bedrock
- Responsive design with Tailwind CSS
- Smooth animations and transitions

---

## 📦 Commit #16 - 2025-12-06 11:01 PM (IST)

**Developer:** Veera Kuppili  
**Type:** Feature

### 📝 Commit Message
```
feat: enhance jobs page with multi-sort, advanced filters, and premium card UI

- Add multi-criteria sorting with toggle buttons and priority indicators
- Implement multi-select filters with checkboxes and tags
- Add separate Clear Filters/Clear Sorts buttons
- Redesign cards with color-coded icon backgrounds for all fields
- Add new job fields: start/end dates, duration, created date
- Update table view with gradient header and color-coded icons
- Optimize layout to 6-column full-width filter grid
- Add consistent hover effects (blue/yellow/red) on action buttons
- Improve spacing, typography, and responsive design throughout
```

### ✨ Changes
- ✅ Implemented multi-criteria sorting with array-based priority ordering
- ✅ Added toggle buttons (↑ Asc / ↓ Desc) with visual highlighting
- ✅ Created MultiSearchableSelect component with checkboxes and tags
- ✅ Converted status/priority filters to multi-select with empty defaults
- ✅ Added individual arrow handlers in table headers (double-click to remove)
- ✅ Implemented separate Clear Filters and Clear Sorts buttons
- ✅ Redesigned card view with premium color-coded icon backgrounds
- ✅ Added 8 new job fields with proper icons and labels
- ✅ Enhanced table view with gradient header and alternating rows
- ✅ Updated action buttons with consistent hover colors
- ✅ Optimized layout to 6-column full-width filter grid
- ✅ Reduced card header height and improved spacing
- ✅ Added PlayIcon, StopIcon, SparklesIcon from Heroicons

### 📄 Files Modified (3)
- `src/app/jobs/page.tsx` - Complete UI/UX overhaul with multi-sort and advanced filters
- `src/components/ui/MultiSearchableSelect.tsx` - New component for multi-select with checkboxes
- `src/components/ui/SearchableSelect.tsx` - Enhanced for sort field selection

---

## 📦 Commit #15 - 2025-12-06 09:01 PM (IST)

**Developer:** Logeshwaran S  
**Type:** Refactor

### 📝 Commit Message
```
refactor(customers): consolidate modules and implement OData schema transformation

- Deleted 14 redundant files (pet-customers, test-customer, deprecated services)
- Consolidated /pet-customers into /customers as primary module
- Implemented bidirectional OData schema transformation (PascalCase ↔ snake_case)
- Added JobTitle enum formatting (Dr_ → Dr., Mr_ → Mr., etc.)
- Fixed runtime errors: addresses/tags structure handling, type undefined checks
- Updated sidebar navigation to use /customers route
- Enabled refetchOnWindowFocus for auto-refresh on window focus
- Aligned all interfaces to use consistent snake_case field naming
- Centralized customer transformation logic in customer.schema.ts
- Added proper fallbacks for wrapped/unwrapped data structures ({data: []} vs [])

Breaking changes:
- Removed simplePetCustomerService, use customerService instead
- Customer interface now uses snake_case (first_name vs firstName)
- All customer routes moved from /pet-customers to /customers
```

### ✨ Changes
- ✅ Deleted 14 redundant files (pet-customers, test-customer modules)
- ✅ Consolidated customer management to single /customers module
- ✅ Implemented OData schema transformation with bidirectional mapping
- ✅ Added JobTitle enum with formatting helper function
- ✅ Fixed addresses/tags structure handling for both wrapped and unwrapped formats
- ✅ Added safe type checking with fallback values
- ✅ Updated sidebar navigation routes
- ✅ Enabled auto-refresh on window focus
- ✅ Standardized all interfaces to snake_case
- ✅ Centralized transformation logic in customer.schema.ts

### 📄 Files Modified (8)
- `src/config/apiSchemas/customer.schema.ts` - Added bidirectional OData transformation with snake_case output
- `src/services/customerService.ts` - Simplified to use centralized schema transformations
- `src/app/customers/page.tsx` - Fixed addresses/tags handling, added safe checks
- `src/app/customers/view/[id]/page.tsx` - Fixed data structure handling
- `src/components/SidebarLayout.tsx` - Updated navigation to /customers
- `src/providers/QueryProvider.tsx` - Enabled refetchOnWindowFocus
- `src/services/simpleCustomerService.ts` - Fixed variable name errors
- `src/app/customers/README.md` - Updated documentation

### 🗑️ Files Deleted (14)
- `src/app/pet-customers/page.tsx`
- `src/app/pet-customers/view/[id]/page.tsx`
- `src/app/pet-customers/edit/[id]/page.tsx`
- `src/app/pet-customers/new/page.tsx`
- `src/app/pet-customers/README.md`
- `src/app/test-customer/page.tsx`
- `src/app/customers/view/[id]/page.tsx.temp`
- `src/services/petCustomerService.ts`
- `src/services/simplePetCustomerService.ts`
- `src/services/simplePetCustomerService.ts.new`
- `src/components/customers/CustomerDetails.tsx`
- Other redundant customer-related files

---

## 📦 Commit #14 - 2025-12-06 07:15 PM (IST)

**Developer:** Ghanshyam  
**Type:** Feature

### 📝 Commit Message
```
feat: Complete technician management CRUD with OData integration

- Fixed 422 error for technician creation with ISO 8601 date format
- Changed skills/specialty/certifications from tags to comma-separated text inputs
- Added delete functionality with confirmation modal on list and detail views
- Implemented PATCH update for existing technicians to prevent duplicates
- Added view profile feature with cache-first strategy and API fallback
- Updated filters: removed availability, added role and skills filters
- Fixed OData field mapping (EmployeeID → id, string to array conversions)
- Added patch method to apiClient for partial updates
- Removed selectedAvailability references and fixed runtime errors
- Updated header layout (removed subtitle, kept main title)

Technical changes:
- Updated employee.schema.ts with stringToArray helper and proper transformations
- Modified technicianService.ts with PATCH endpoint using numeric IDs
- Enhanced create page with dual create/update logic and cache loading
- Added comprehensive logging for debugging OData requests
- Integrated all CRUD operations with OData v4 endpoints

All features tested and working with http://localhost:8090/odata/iworks/v1/Employees
```

### ✨ Changes
- ✅ Fixed 422 error with ISO 8601 HireDate format transformation
- ✅ Changed skills/specialty/certifications UI to text inputs with comma-separated values
- ✅ Added delete functionality with confirmation modal
- ✅ Implemented PATCH endpoint for updating technicians
- ✅ Added cache-first view profile with API fallback
- ✅ Updated filters: added role and skills, removed availability
- ✅ Fixed OData field mapping and data transformations
- ✅ Added patch method to apiClient
- ✅ Fixed all selectedAvailability runtime errors
- ✅ Removed subtitle from header

### 📄 Files Modified (5)
- `src/app/technicians/page.tsx` - Updated filters, added delete button, fixed references
- `src/app/technicians/create/page.tsx` - Added update logic, cache loading, dual mode
- `src/services/technicianService.ts` - Added PATCH update, fixed GET with numeric IDs
- `src/config/apiSchemas/employee.schema.ts` - Fixed transformations with stringToArray helper
- `src/services/apiClient.ts` - Added patch method for partial updates

### 🔧 Technical Details
- **OData Endpoints**: GET, POST, PATCH, DELETE at /odata/iworks/v1/Employees
- **Field Mapping**: EmployeeID→id, FullName→name, PhoneNumber→phone, IsActive→status
- **Data Transformation**: String to array conversion for skills/specialty/certifications
- **Caching Strategy**: React Query cache-first with API fallback
- **Date Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ) for HireDate

### 🎯 Features Delivered
- Full CRUD operations for technicians
- OData v4 integration
- Cache optimization
- Error handling and validation
- Comprehensive logging

---


## 📦 Commit #13 - 2025-12-06 11:30 PM (IST)

**Developer:** Logeshwaran S  
**Type:** Fix

### 📝 Commit Message
```
fix(jobService): use numeric job ID in OData endpoint

- Updated jobService to use job ID as a number (no quotes) in OData endpoint: /Jobs({id})
```

### ✨ Changes
- ✅ Updated jobService to use numeric job ID in OData endpoint without quotes

### 📄 Files Modified (1)
- `src/services/jobService.ts`

---

## 📦 Commit #12 - 2025-12-06  01:19 AM (IST)

**Developer:** Logeshwaran S  
**Type:** Feature

### 📝 Commit Message
```
feat(jobs): use numeric IDs, map and display line items as tables, and improve job details UI

Change Job and JobLineItem IDs to numbers for consistency with OData backend
Map JobLineItems to lineItems in transformer for autopopulation
Display services and materials as styled tables with separate columns for name, quantity, unit price, and total
Improve job details page UI and data handling
```

### ✨ Changes
- ✅ Changed Job and JobLineItem IDs to numbers for OData compatibility
- ✅ Mapped JobLineItems to lineItems in transformer for autopopulation
- ✅ Displayed services and materials as styled tables with separate columns
- ✅ Improved job details page UI and data handling

### 📄 Files Modified (4)
- `src/types/index.ts`
- `src/config/apiSchemas/job.schema.ts`
- `src/services/jobService.ts`
- `src/app/jobs/[id]/page.tsx`

## 📦 Commit #11 - 2025-12-05 11:45 PM (IST)

**Developer:** Logeshwaran S  
**Type:** Feature

### 📝 Commit Message
```
feat: Add JobLineItems support to job creation with OData binding

- Added JobLineItem interface and lineItems property to CreateJobRequest
- Implemented two-step job creation: create job first, then line items separately
- Added createJobLineItem method with OData navigation binding (Job@odata.bind)
- Map line items to backend schema (Name, Description, Quantity, UnitPrice, TotalPrice, UnitCost, ItemType, Markup, IsTaxExempt)
- Distinguish between Service and Product types for line items
- Fixed status enum to match OData schema (In_Progress, Canceled)
- Added PATCH method to API client for job updates
- Enhanced logging for line items creation and debugging
- Export transformUpdateJobToApi for schema consistency
```

### ✨ Changes
- ✅ Added `JobLineItem` interface with itemType, name, description, quantity, unitPrice, totalPrice
- ✅ Implemented two-step job creation process (Job first, then LineItems)
- ✅ Added `createJobLineItem()` method with OData binding syntax
- ✅ Line items mapping with Service/Product type distinction
- ✅ Fixed status enum values to match backend OData schema
- ✅ Added PATCH method to API client
- ✅ Enhanced schema transformation for line items
- ✅ Comprehensive error handling and logging

### 📄 Files Modified (6)
- `src/types/index.ts` - Added JobLineItem interface and updated CreateJobRequest
- `src/app/jobs/create/page.tsx` - Line items mapping and status enum fix
- `src/config/apiSchemas/job.schema.ts` - Line items transformation to backend schema
- `src/config/apiSchemas/index.ts` - Exported transformUpdateJobToApi
- `src/services/apiClient.ts` - Added patch() method
- `src/services/jobService.ts` - Added createJobLineItem() and two-step creation logic

## 📦 Commit #10 - 2025-12-05 11:26 PM (IST)

**Developer:** Ghanshyam Patil  
**Type:** Fix

### 📝 Commit Message
```
fix: Resolve merge conflicts in invoiceService.ts

- Resolved merge conflict between OData implementation and old mock data
- Removed duplicate mock invoice generation code from getInvoiceForJob()
- Kept OData API implementation with proper error handling
- Fixed syntax errors caused by merge conflict markers
```

### ✨ Changes
- ✅ Resolved merge conflicts in `src/services/invoiceService.ts`
- ✅ Removed old mock data implementation from getInvoiceForJob method
- ✅ Retained clean OData API implementation
- ✅ Fixed compilation errors caused by conflict markers

### 📄 Files Modified (1)
- `src/services/invoiceService.ts` - Resolved merge conflicts and removed mock data

---

## 📦 Commit #9 - 2025-12-05 10:45 PM (IST)

**Developer:** Logeshwaran S  
**Type:** Feature

### 📝 Commit Message
```
feat(jobs): Integrate job creation with OData backend API

- Connected Save button to call jobService.createJob() API
- Updated form data mapping to match OData schema (scheduledDate, eventAllDay)
- Removed client-side JobID generation (now handled by backend)
- Added form validation for required fields (title, scheduledDate)
- Enhanced error handling with user-friendly alerts
- Updated getAllJobs() and getJobById() to expand Job_AssignedTo and Customer associations
- Improved API logging for better debugging and troubleshooting
- Added proper cache invalidation and navigation on successful job creation
```

### ✨ Changes
- ✅ Integrated job creation with backend OData API
- ✅ Added proper form validation
- ✅ Enhanced error handling and user feedback
- ✅ Improved API response handling with expanded associations

---

## 📦 Commit #8 - 2025-12-05 11:14 PM (IST)

**Developer:** Ghanshyam Patil  
**Type:** Feature

### 📝 Commit Message
```
feat: Integrate invoices with OData API and add error handling

- Replace mock data with OData API calls to /odata/iworks/v1/Invoices
- Add invoice schema transformations for API integration
- Implement error handling with retry button on invoices page
- Remove all mock invoice data across the application
- Follow technician module architecture pattern
```

### ✨ Changes
- ✅ Removed all mock invoice data from invoiceService.ts and invoice pages
- ✅ Updated invoice.schema.ts with OData field mappings (InvoiceID, JobID, CustomerID, etc.)
- ✅ Implemented transformInvoiceFromApi() and transformInvoiceToApi() functions
- ✅ Updated invoiceService.ts to use /odata/iworks/v1/Invoices endpoint
- ✅ Added OData $filter queries for customer and job-specific invoice retrieval
- ✅ Implemented OData actions: Send, MarkAsPaid, and GenerateInvoice
- ✅ Added error handling with retry button to invoices list page
- ✅ Included comprehensive logging for debugging API interactions
- ✅ Cleaned up backup .new files

### 📄 Files Modified (7)
- `src/services/invoiceService.ts` - Replaced REST API calls with OData endpoints
- `src/config/apiSchemas/invoice.schema.ts` - Added OData transformations
- `src/app/invoices/page.tsx` - Added error handling with retry button
- `src/app/invoices/[id]/page.tsx` - Removed mock data, use real API
- `src/app/jobs/enhanced/[id]/page.tsx` - Removed mock invoice fallback
- `src/components/invoices/JobInvoiceContainer.tsx` - Removed mock invoice logic
- Deleted: `src/services/invoiceService.ts.new` and `src/app/jobs/enhanced/[id]/page.tsx.new`

### 🔄 API Endpoints
- GET `/odata/iworks/v1/Invoices` - Get all invoices
- GET `/odata/iworks/v1/Invoices('${id}')` - Get invoice by ID
- GET `/odata/iworks/v1/Invoices?$filter=CustomerID eq '${customerId}'` - Get by customer
- GET `/odata/iworks/v1/Invoices?$filter=JobID eq '${jobId}'` - Get by job
- PATCH `/odata/iworks/v1/Invoices('${id}')` - Update invoice
- POST `/odata/iworks/v1/Invoices('${id}')/Send` - Send invoice
- POST `/odata/iworks/v1/Invoices('${id}')/MarkAsPaid` - Mark as paid
- POST `/odata/iworks/v1/Jobs('${jobId}')/GenerateInvoice` - Generate from job
Technical changes:
- transformCreateJobToApi: Removed JobID field from POST payload
- jobService: Added $expand=Job_AssignedTo,Customer to all GET endpoints
- handleSubmit: Maps form state to CreateJobRequest with ISO 8601 dates
- Enhanced console logging across service layer for debugging
```

### ✨ Changes
- ✅ Connected Save button to backend API integration
  - handleSubmit() now calls createJobMutation.mutate() with proper data transformation
  - Added validation for required fields (jobTitle, scheduledDate)
  - Success handler: invalidates React Query cache and redirects to /jobs page
  - Error handler: displays user-friendly alert with error details
- ✅ Updated form data mapping to match OData schema
  - Changed field mapping: date → scheduledDate with ISO 8601 format
  - Added eventAllDay boolean field
  - Proper handling of optional fields (description, location, assignedTo)
- ✅ Removed client-side JobID generation
  - Deleted crypto.randomUUID() from transformCreateJobToApi()
  - JobID now auto-generated by backend server
  - Updated schema comments to reflect backend ownership
- ✅ Enhanced job service with association expansion
  - getAllJobs(): Added ?$expand=Job_AssignedTo,Customer to retrieve related data
  - getJobById(): Added ?$expand=Job_AssignedTo,Customer for complete job details
  - Both endpoints now return employee and customer information in single call
- ✅ Improved logging and debugging
  - Added full URL logging for all API calls
  - Enhanced response logging with data inspection
  - Detailed error logging with status codes and response data
  - Console logs track data transformation flow

### 📄 Files Modified (3)
- `src/app/jobs/create/page.tsx` - Connected Save button and enhanced form submission
- `src/config/apiSchemas/job.schema.ts` - Removed JobID from POST payload
- `src/services/jobService.ts` - Added association expansion and improved logging

---

## 📦 Commit #8 - 2025-12-05 5:32 PM (IST)

**Developer:** Logeshwaran S  
**Type:** Feature

### 📝 Commit Message
```
feat: redesign job creation page with modern two-panel layout

- Add sidebar with location, notes, attachments, recurrence, and auto-invoice
- Implement dynamic line items for services and materials with calculations
- Add estimates section and financial summary
- Enhance form fields for comprehensive job details
- Apply HouseCallPro-inspired UI/UX design
```

### ✨ Changes
- ✅ Complete layout overhaul from single-card form to two-panel design
- ✅ Added sticky top navigation bar with back button, status badge, and save action
- ✅ Implemented 320px left sidebar with collapsible sections:
  - Map/Location section with location toggle
  - Private notes (expandable)
  - Attachments with file upload functionality
  - Recurrence settings
  - Auto invoice configuration
- ✅ Built dynamic line items system:
  - Services section with add/edit/remove functionality
  - Materials section with add/edit/remove functionality
  - Real-time price calculations (quantity × unit price)
  - Individual line item management
- ✅ Added estimates section placeholder for future implementation
- ✅ Implemented financial summary with subtotal, discount, tax rate, and total
- ✅ Enhanced form fields:
  - Job name, description, status, priority
  - Scheduled date, start date, end date
  - Location details
  - Estimated duration (minutes)
  - All-day event checkbox
- ✅ Removed unused sections (checklists, job fields, customer tags, job tags)
- ✅ Updated save button (removed "Create Job" and "Saved" indicator)
- ✅ Applied modern HouseCallPro-inspired design system with professional spacing

### 📄 Files Modified (1)
- `src/app/jobs/create/page.tsx` - Complete redesign of job creation page
>>>>>>> fc4b34edaefd3195b11b08803e533a88572e83ad

---

## 📦 Commit #7 - 2025-12-04 11:30 PM (IST)

**Developer:** Veera Kuppili  
**Type:** Feature

### 📝 Commit Message
```
feat: filter customers by IsActive status in API calls

- Updated getAllCustomers endpoint to include $filter=IsActive eq true
- Updated getCustomerById endpoint to include $filter=IsActive eq true
- Both methods now only return active customers with expanded addresses
```

### ✨ Changes
- ✅ Added IsActive filter to getAllCustomers API endpoint
- ✅ Added IsActive filter to getCustomerById API endpoint
- ✅ Updated OData query to: `/odata/iworks/v1/Customers?$filter=IsActive eq true&$expand=CustomerAddresses`
- ✅ Ensures only active customers are fetched from the API

### 📄 Files Modified (1)
- `src/services/simplePetCustomerService.ts` - Added IsActive filter to customer API calls

---

## 📦 Commit #6 - 2025-12-03 11:09 PM (IST)

**Developer:** Veera Kuppili  
**Type:** Refactoring

### 📝 Commit Message
```
refactor: cleanup debug logs, fix layout issues, and improve API response handling

- Enhanced API client with robust JSON parsing and error handling
- Removed excessive console.log statements across services and schemas
- Fixed Next.js 14+ viewport metadata configuration in layout
- Improved sidebar layout with fixed positioning and overflow control
- Added array safety checks in dashboard for invoice data
- Streamlined pet customers page with better error states and UI
- Adjusted React Query cache settings for optimal performance
- Added empty API proxy route placeholder for future implementation
```

### ✨ Changes
- ✅ Enhanced API client with custom JSON response transformer to handle malformed responses
- ✅ Added robust JSON parsing with validation and error recovery
- ✅ Removed excessive debug console.log statements across all services
- ✅ Fixed Next.js 14+ metadata by moving viewport to separate export
- ✅ Improved sidebar layout with fixed positioning and proper overflow handling
- ✅ Added overflow constraints to html/body for better layout control
- ✅ Added array safety checks in dashboard for invoice filtering
- ✅ Streamlined pet customers page with cleaner React Query configuration
- ✅ Improved error state UI with better icons and messaging
- ✅ Adjusted React Query cache settings (gcTime: 10min, reduced retry)
- ✅ Created API proxy route placeholder for future CORS handling

### 📄 Files Modified (10)
- `src/services/apiClient.ts` - Enhanced JSON parsing and error handling
- `src/services/simplePetCustomerService.ts` - Removed debug logs, streamlined transformations
- `src/app/layout.tsx` - Fixed viewport metadata for Next.js 14+
- `src/components/SidebarLayout.tsx` - Fixed sidebar layout and overflow handling
- `src/app/globals.css` - Added overflow constraints to html/body
- `src/app/dashboard/page.tsx` - Added array safety checks for invoices
- `src/app/pet-customers/page.tsx` - Major cleanup: removed debug logs, improved UI/error states
- `src/config/apiSchemas/customer.schema.ts` - Removed debug logs
- `src/config/apiSchemas/utils.ts` - Removed debug warning
- `src/providers/QueryProvider.tsx` - Adjusted cache settings

### ✨ Files Created (1)
- `src/app/api/proxy/[...path]/route.ts` - API proxy route placeholder

### 🗑️ Files Deleted (3)
- `.next/types/app/login/page.ts` - Auto-generated type file cleanup
- `.next/types/app/technicians/page.ts` - Auto-generated type file cleanup
- `.next/types/app/pet-customers/view/[id]/page.ts` - Auto-generated type file cleanup

---

## 📦 Commit #5 - 2025-12-02 11:50 PM (IST)

**Developer:** Veera  
**Type:** Feature Enhancement

### 📝 Commit Message
```
feat(customer): Redesign customer module with OData API integration and enhanced UX

Integrated OData v4 API (/odata/iworks/v1/Customers) with proper CRUD operations
Removed all mock data and standardized API client pattern
Redesigned header and filters to match Technician module
Replaced dropdowns with 4 text input filters (ID, First Name, Last Name, Email)
Enhanced error/no-data UI states with better messaging
Implemented optimistic delete with multi-strategy fallback
Fixed TypeScript errors and improved code quality
Added client-side filtering with real-time text matching
```

### ✨ Changes
- ✅ Integrated OData v4 API endpoint: `/odata/iworks/v1/Customers`
- ✅ Updated all CRUD operations to use OData string key syntax: `Customers('id')`
- ✅ Removed all mock data from `simplePetCustomerService.ts` and `petCustomerService.ts`
- ✅ Enhanced field mapping to support both camelCase and PascalCase
- ✅ Implemented multi-strategy delete (POST override, PATCH soft delete, DELETE fallback)
- ✅ Redesigned header matching Technician module with offline indicator
- ✅ Replaced dropdowns with 4 text input filters with search icons
- ✅ Enhanced error/no-data UI states with better messaging
- ✅ Removed confirmation dialog for immediate optimistic deletion
- ✅ Standardized API client by removing custom Customer overrides
- ✅ Fixed TypeScript errors and improved code quality
- ✅ Added client-side filtering with real-time text matching

### 📄 Files Modified (6)
- `src/app/pet-customers/page.tsx` - Complete redesign
- `src/services/apiClient.ts` - Standardization (removed custom overrides)
- `src/services/simplePetCustomerService.ts` - API integration, CRUD operations
- `src/services/customerService.ts` - Fixed response handling
- `src/app/pet-customers/view/[id]/page.tsx` - Removed mock data
- `src/app/pet-customers/edit/[id]/page.tsx` - Added error handling

### 🗑️ Files Deprecated (1)
- `src/services/petCustomerService.ts` - Marked as deprecated

### 📊 Impact
- **Lines Changed:** ~2,000+
- **Files Affected:** 7 files
- **Architecture:** Aligned with Jobs and Technician module patterns
- **Code Quality:** Removed ~500 lines of mock data and custom override logic

---

## 📦 Commit #4 - 2025-11-29 1:20 AM (IST)

**Developer:** Ghanshyam  
**Type:** Feature Integration

### 📝 Commit Message
```
feat: Integrate technician module with OData API and align with job module architecture

- Created employee schema transformer for OData field mapping
- Removed all mock data from technician module
- Migrated from employeeODataClient to shared apiClient
- Updated React Query config: auto-fetch, 5-min cache, refetch on mount/focus
- Aligned technician module behavior with job module pattern
- Removed unused API route and duplicate HTTP client
- Added proper data transformation for Employee API fields
```

### ✨ Changes
- ✅ Integrated technician module with OData API endpoint: `/odata/iworks/v1/Employees`
- ✅ Created employee schema transformer with field mapping (EmployeeID→id, FullName→name, IsActive→status)
- ✅ Removed all mock technician data (Alex Johnson, Sarah Williams, Michael Chen)
- ✅ Migrated from dedicated employeeODataClient to shared apiClient (consistent with job module)
- ✅ Updated React Query configuration: 5-minute cache, auto-fetch on mount and window focus
- ✅ Simplified retry/fetch button behavior (removed complex loading states)
- ✅ Changed update method from PATCH to PUT (apiClient compatibility)
- ✅ Added comprehensive data transformation for OData responses

### 📄 Files Created (1)
- `src/config/apiSchemas/employee.schema.ts` - Employee/Technician data transformers

### 📄 Files Modified (4)
- `src/services/technicianService.ts` - Migrated to apiClient, updated all CRUD operations
- `src/app/technicians/page.tsx` - Updated query config, removed mock data
- `src/app/technicians/[id]/page.tsx` - Made fields optional, added null checks
- `src/config/apiSchemas/index.ts` - Added employee schema exports

### 🗑️ Files Deleted (2)
- `src/services/employeeODataClient.ts` - Replaced by shared apiClient
- `src/app/api/employees/route.ts` - Removed unused API route proxy

### 📊 Impact
- **Architecture**: Unified HTTP client across job and technician modules
- **Maintainability**: Single source of truth for API configuration
- **Performance**: 5-minute caching reduces unnecessary API calls
- **Code Quality**: Eliminated duplicate HTTP client code
- **Data Flow**: Direct OData connection without proxy layer

---

## 📦 Commit #3 - 2025-11-28 10:00 PM (IST)

**Developer:** Logeshwaran S  
**Type:** Maintenance & Documentation

### 📝 Commit Message
```
chore: Update OData endpoint to iworks service and add project documentation
```

### ✨ Changes
- ✅ Updated API endpoint from `/odata/jobmanagementmodule/v1/Jobs` to `/odata/iworks/v1/Jobs`
- ✅ Updated all service method calls in jobService.ts (getAllJobs, getJobById, createJob, updateJob, deleteJob)
- ✅ Updated API documentation in jobs/README.md with new endpoint references
- ✅ Added COMMITLOG.md for detailed commit tracking with developer info

### 📄 Files Modified (2)
- `src/services/jobService.ts`
- `src/app/jobs/README.md`

### ➕ Files Created (1)
- `COMMITLOG.md`

### 📊 Impact
- **Lines Changed:** ~50
- **Files Affected:** 3 files
- **Endpoint Updated:** iworks service integration

---

## 🚀 Commit #2 - 2025-11-26 9:13 PM (IST)

**Developer:** Logeshwaran S  
**Type:** Major Feature Release

### 📝 Commit Message
```
feat: Integrate OData API and modular schema system for Jobs module
```

### ✨ Description
- ✅ Fixed proxy configuration to point directly to backend root
- ✅ Removed mock data fallbacks and migrated to real API endpoints
- ✅ Created modular API schema architecture for maintainability
- ✅ Implemented cache-first navigation and refetch optimization
- ✅ Enhanced error handling and empty state UI
- ✅ Added comprehensive Job module documentation

### ⚠️ BREAKING CHANGES
- ❌ Removed MOCK_JOBS from mockData.ts
- ❌ Updated apiClient.ts to remove mock fallback logic

### 🔧 API Changes
- **Proxy:** `/api-proxy` → `http://localhost:8090/:path*`
- **Endpoint:** `/odata/jobmanagementmodule/v1/Jobs`
- **Headers:** `X-Tenant-ID` (removed query param)
- **Transformations:** `UUID→id`, `JobName→title`, `Status→status`, etc.

### 📄 Files Modified (13)
- `next.config.js`
- `src/services/apiClient.ts`
- `src/services/jobService.ts`
- `src/lib/mockData.ts`
- `src/app/jobs/page.tsx`
- `src/app/jobs/[id]/page.tsx`
- `src/app/jobs/[id]/edit/page.tsx`
- `src/app/jobs/create/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/technicians/page.tsx`
- `src/app/pet-customers/page.tsx`
- `src/app/invoices/page.tsx`
- `src/app/scheduler/admin/page.tsx`

### ➕ Files Created (7)
- `src/config/apiSchemas/job.schema.ts`
- `src/config/apiSchemas/customer.schema.ts`
- `src/config/apiSchemas/invoice.schema.ts`
- `src/config/apiSchemas/technician.schema.ts`
- `src/config/apiSchemas/utils.ts`
- `src/config/apiSchemas/index.ts`
- `src/app/jobs/README.md`

### 📊 Impact
- **Lines Changed:** ~1,500+
- **Files Affected:** 20 files
- **Architecture:** Modular schema system introduced
- **Performance:** Cache-first navigation implemented

---

**Repository:** [FieldSmartPro_UX](https://github.com/ashokata/FieldSmartPro_UX)  
**Branch:** main
