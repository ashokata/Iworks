# Pricing Module Documentation

## Overview

The Pricing Module manages pricing calculations, tax rates, discounts, and total amounts for jobs in FieldSmartPro. It provides a complete interface for creating, viewing, and managing pricing records with automatic calculations.

## Architecture

### 📁 Module Structure

```
src/
├── app/pricing/                 # Pricing pages (Next.js App Router)
│   ├── page.tsx                 # Pricing list page (main view)
│   ├── create/
│   │   └── page.tsx            # Pricing creation page
│   └── [id]/
│       └── page.tsx            # Pricing details page
├── services/
│   └── pricingService.ts       # Pricing API service layer
├── config/apiSchemas/
│   ├── pricing.schema.ts       # Pricing API transformations
│   └── index.ts                # Schema exports
└── types/
    └── index.ts                # Pricing TypeScript interfaces
```

---

## API Integration

### Backend Endpoint

**Base URL**: `http://localhost:8090/odata/iworks/v1/Pricing`

**Protocol**: OData v4

**Proxy Configuration**: All requests go through `/api-proxy` which proxies to backend

### OData Response Format

```json
{
  "@odata.context": "http://localhost:8090/odata/iworks/v1/$metadata#Pricing",
  "value": [
    {
      "PricingID": 123,
      "SubTotal": 1500.00,
      "Discount": 100.00,
      "TaxRate": 8.5,
      "TaxAmount": 119.00,
      "Total": 1519.00,
      "County": "Los Angeles",
      "JobID": 456,
      "createdDate": "2025-12-07T10:00:00Z",
      "changedDate": "2025-12-07T10:00:00Z"
    }
  ]
}
```

### Field Mapping

| Backend Field (OData) | Frontend Field | Type | Required |
|----------------------|----------------|------|----------|
| `PricingID` | `id` | number | Yes (auto) |
| `SubTotal` | `subTotal` | number | Yes |
| `Discount` | `discount` | number | No |
| `TaxRate` | `taxRate` | number | No |
| `TaxAmount` | `taxAmount` | number | No (calc) |
| `Total` | `total` | number | No (calc) |
| `County` | `county` | string | No |
| `JobID` | `jobId` | number | No |
| `createdDate` | `createdDate` | string (ISO) | Auto |
| `changedDate` | `changedDate` | string (ISO) | Auto |

---

## TypeScript Interfaces

### Pricing Interface

```typescript
interface Pricing {
  id: number;                    // PricingID (auto-generated)
  tenantId: string;              // Multi-tenant isolation
  subTotal: number;              // Subtotal amount
  discount: number;              // Discount amount
  taxRate: number;               // Tax rate percentage
  taxAmount: number;             // Calculated tax amount
  total: number;                 // Calculated total
  county?: string;               // County name
  jobId?: number;                // Associated Job ID (FK)
  job?: Job;                     // Expanded Job relation
  createdDate?: string;          // ISO 8601
  changedDate?: string;          // ISO 8601
}
```

### CreatePricingRequest Interface

```typescript
interface CreatePricingRequest {
  subTotal: number;              // Required
  discount?: number;             // Optional (default 0)
  taxRate?: number;              // Optional (default 0)
  taxAmount?: number;            // Optional (auto-calculated)
  total?: number;                // Optional (auto-calculated)
  county?: string;               // Optional
  jobId?: number;                // Optional Job association
}
```

---

## Service Layer (`pricingService.ts`)

### Methods

#### 1. `getAllPricing()`
Fetches all pricing records with expanded Job relation.

```typescript
const pricing: Pricing[] = await pricingService.getAllPricing();
```

**OData Query:**
```
GET /odata/iworks/v1/Pricing?$expand=Job
```

**Process:**
1. Makes GET request with `$expand=Job`
2. Extracts OData `value` array
3. Transforms each record using `transformPricingFromApi()`
4. Returns array of `Pricing` objects

---

#### 2. `getPricingById(id: number)`
Fetches a single pricing record by ID.

```typescript
const pricing: Pricing | null = await pricingService.getPricingById(123);
```

**OData Query:**
```
GET /odata/iworks/v1/Pricing(123)?$expand=Job
```

---

#### 3. `getPricingByJobId(jobId: number)`
Fetches all pricing records for a specific job.

```typescript
const pricing: Pricing[] = await pricingService.getPricingByJobId(456);
```

**OData Query:**
```
GET /odata/iworks/v1/Pricing?$filter=JobID eq 456&$expand=Job
```

---

#### 4. `createPricing(pricingData: CreatePricingRequest)`
Creates a new pricing record with OData Job binding.

```typescript
const newPricing: Pricing = await pricingService.createPricing({
  subTotal: 1500.00,
  discount: 100.00,
  taxRate: 8.5,
  county: 'Los Angeles',
  jobId: 456  // Optional Job association
});
```

**OData Request:**
```json
POST /odata/iworks/v1/Pricing
{
  "SubTotal": 1500.00,
  "Discount": 100.00,
  "TaxRate": 8.5,
  "TaxAmount": 119.00,
  "Total": 1519.00,
  "County": "Los Angeles",
  "Job@odata.bind": "Jobs(456)"  // OData navigation binding
}
```

**Key Feature: OData Binding**
- Uses `Job@odata.bind` to associate with a Job entity
- Backend automatically sets `JobID` foreign key
- No need to manually set `JobID` field

---

#### 5. `updatePricing(id: number, pricingData: Partial<Pricing>)`
Updates an existing pricing record.

```typescript
const updated: Pricing = await pricingService.updatePricing(123, {
  taxRate: 9.0,
  county: 'Orange County'
});
```

**OData Request:**
```json
PATCH /odata/iworks/v1/Pricing(123)
{
  "TaxRate": 9.0,
  "County": "Orange County"
}
```

---

#### 6. `deletePricing(id: number)`
Deletes a pricing record.

```typescript
await pricingService.deletePricing(123);
```

---

#### 7. `calculatePricing(subTotal, discount, taxRate)`
Helper function to calculate tax and total amounts.

```typescript
const calculated = pricingService.calculatePricing(1500, 100, 8.5);
// Returns: { subTotal: 1500, discount: 100, taxRate: 8.5, taxAmount: 119.00, total: 1519.00 }
```

**Calculation Logic:**
```
discountedSubtotal = subTotal - discount
taxAmount = (discountedSubtotal × taxRate) / 100
total = discountedSubtotal + taxAmount
```

---

## Pages

### 1. Pricing List (`/pricing`)

**File**: `src/app/pricing/page.tsx`

**Features:**
- ✅ Display all pricing records in table view
- ✅ Search by county or job title
- ✅ Filter by Pricing ID and County
- ✅ Multi-column sorting (ID, SubTotal, Total, County, Created Date)
- ✅ Real-time calculations display
- ✅ Pagination with smart top/bottom controls
- ✅ Offline detection
- ✅ Cache-first navigation
- ✅ Error handling with retry

**Table Columns:**
- Pricing ID
- Associated Job (with Job ID and title)
- SubTotal
- Discount
- Tax (amount and rate)
- Total
- County
- Actions (View, Edit)

---

### 2. Create Pricing (`/pricing/create`)

**File**: `src/app/pricing/create/page.tsx`

**Features:**
- ✅ Simple form with automatic calculations
- ✅ Optional Job ID association
- ✅ Real-time total calculation
- ✅ Visual calculation breakdown
- ✅ Client-side validation
- ✅ Offline detection

**Form Fields:**
- Job ID (optional) - Associate with existing job
- SubTotal (required) - Base amount
- Discount (optional) - Discount amount
- Tax Rate (optional) - Percentage (0-100)
- County (optional) - County name

**Auto-Calculated Fields:**
- Tax Amount - Calculated from (SubTotal - Discount) × TaxRate
- Total - Final amount with tax

**Calculation Display:**
Shows real-time breakdown:
```
Subtotal:     $1,500.00
Discount:     -$100.00
Tax (8.5%):   $119.00
─────────────────────
Total:        $1,519.00
```

---

### 3. Pricing Details (`/pricing/[id]`)

**File**: `src/app/pricing/[id]/page.tsx`

**Features:**
- ✅ Complete pricing information
- ✅ Associated job details (if linked)
- ✅ Calculation breakdown card
- ✅ Cache-first loading
- ✅ Data source indicator (Cache/API)
- ✅ Edit action button
- ✅ View associated job link

**Display Sections:**
1. **Header Card** - ID, Total amount
2. **Pricing Details** - SubTotal, Discount, Tax Rate, Tax Amount, County
3. **Associated Job Card** - Job info with link (if applicable)
4. **Calculation Breakdown** - Step-by-step calculation display

---

## OData Binding Pattern

### Creating Pricing with Job Association

**Frontend Request:**
```typescript
const pricingData: CreatePricingRequest = {
  subTotal: 1500.00,
  discount: 100.00,
  taxRate: 8.5,
  jobId: 456  // Frontend field
};
```

**Schema Transformation:**
```typescript
transformCreatePricingToApi(pricingData) => {
  SubTotal: 1500.00,
  Discount: 100.00,
  TaxRate: 8.5,
  TaxAmount: 119.00,
  Total: 1519.00,
  "Job@odata.bind": "Jobs(456)"  // OData binding
}
```

**Backend Processing:**
1. Receives `Job@odata.bind` reference
2. Validates Job(456) exists
3. Sets `JobID = 456` on Pricing record
4. Creates navigation property link
5. Returns created Pricing with PricingID

**Reading Back:**
```
GET /odata/iworks/v1/Pricing(123)?$expand=Job
```

Response includes full Job object in `Job` property.

---

## State Management

### React Query Integration

**Query Keys:**
- `['pricing']` - All pricing records
- `['pricing', id]` - Individual pricing by ID

**Cache Configuration:**
```typescript
{
  staleTime: 5 * 60 * 1000,  // 5 minutes
  refetchOnMount: 'always',
  refetchOnWindowFocus: false
}
```

**Cache Invalidation:**
```typescript
// After create
queryClient.invalidateQueries(['pricing']);

// After update
queryClient.invalidateQueries(['pricing']);
queryClient.invalidateQueries(['pricing', id]);
```

---

## Automatic Calculations

### Client-Side Calculation

The pricing form automatically calculates totals as you type:

```typescript
useEffect(() => {
  const calculated = pricingService.calculatePricing(subTotal, discount, taxRate);
  setTaxAmount(calculated.taxAmount);
  setTotal(calculated.total);
}, [subTotal, discount, taxRate]);
```

### Calculation Formula

```javascript
// Step 1: Apply discount
const discountedSubtotal = subTotal - discount;

// Step 2: Calculate tax
const taxAmount = (discountedSubtotal × taxRate) / 100;

// Step 3: Calculate total
const total = discountedSubtotal + taxAmount;
```

**Example:**
- SubTotal: $1,500.00
- Discount: $100.00
- Tax Rate: 8.5%

**Calculation:**
1. Discounted: $1,500 - $100 = $1,400
2. Tax: $1,400 × 0.085 = $119.00
3. Total: $1,400 + $119 = $1,519.00

---

## Error Handling

### Service Layer
```typescript
catch (error: any) {
  console.error('[Pricing Service] Error:', error);
  console.error('[Pricing Service] Error details:', {
    status: error?.response?.status,
    data: error?.response?.data,
  });
  throw error;
}
```

### UI Layer
- React Query's `isError` state
- Retry functionality
- Offline detection
- User-friendly error messages

---

## Multi-Tenant Architecture

All pricing records are automatically filtered by `X-Tenant-ID` header:

```typescript
// Request interceptor in apiClient
headers['X-Tenant-ID'] = getCurrentTenantId();
```

Users only see pricing records belonging to their tenant.

---

## Integration with Job Module

### Associating Pricing with Jobs

**Creating Pricing for a Job:**
```typescript
const pricing = await pricingService.createPricing({
  subTotal: 1500.00,
  taxRate: 8.5,
  jobId: 456  // Links to Job #456
});
```

**Viewing Job's Pricing:**
```typescript
const jobPricing = await pricingService.getPricingByJobId(456);
// Returns all pricing records for Job #456
```

**Expanding Job Details:**
```typescript
GET /odata/iworks/v1/Pricing?$expand=Job
// Returns pricing with full Job object included
```

---

## Performance Optimizations

1. **Cache-First Navigation** - Uses React Query cache before API
2. **Automatic Calculations** - Client-side, no API calls needed
3. **Smart Pagination** - Shows controls based on scroll position
4. **Batch Operations** - Multiple filters without extra requests
5. **OData $expand** - Single request for pricing + job data

---

## Testing the Module

### Test Scenarios

#### 1. Create Pricing Without Job
```typescript
POST /odata/iworks/v1/Pricing
{
  "SubTotal": 1000.00,
  "Discount": 50.00,
  "TaxRate": 7.5,
  "TaxAmount": 71.25,
  "Total": 1021.25,
  "County": "Orange"
}
```

#### 2. Create Pricing With Job
```typescript
POST /odata/iworks/v1/Pricing
{
  "SubTotal": 2000.00,
  "TaxRate": 8.0,
  "TaxAmount": 160.00,
  "Total": 2160.00,
  "Job@odata.bind": "Jobs(123)"
}
```

#### 3. Get Pricing with Job Details
```
GET /odata/iworks/v1/Pricing(456)?$expand=Job
```

#### 4. Update Tax Rate
```typescript
PATCH /odata/iworks/v1/Pricing(456)
{
  "TaxRate": 9.5,
  "TaxAmount": 190.00,
  "Total": 2190.00
}
```

---

## Common Use Cases

### Use Case 1: Invoice Pricing
```typescript
// Create pricing for an invoice
const pricing = await pricingService.createPricing({
  subTotal: jobLineItemsTotal,
  discount: customerDiscount,
  taxRate: countyTaxRate,
  county: customerCounty,
  jobId: completedJobId
});
```

### Use Case 2: Quote Calculation
```typescript
// Calculate pricing without saving
const quote = pricingService.calculatePricing(
  estimatedCost,
  promotionalDiscount,
  localTaxRate
);
// Display: quote.total
```

### Use Case 3: Job Completion
```typescript
// Get final pricing for completed job
const jobPricing = await pricingService.getPricingByJobId(jobId);
const totalBilled = jobPricing.reduce((sum, p) => sum + p.total, 0);
```

---

## API Reference Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/odata/iworks/v1/Pricing` | Get all pricing |
| GET | `/odata/iworks/v1/Pricing({id})` | Get pricing by ID |
| GET | `/odata/iworks/v1/Pricing?$filter=JobID eq {id}` | Get pricing by Job |
| POST | `/odata/iworks/v1/Pricing` | Create new pricing |
| PATCH | `/odata/iworks/v1/Pricing({id})` | Update pricing |
| DELETE | `/odata/iworks/v1/Pricing({id})` | Delete pricing |

**Headers Required:**
- `Authorization: Bearer <token>`
- `X-Tenant-ID: <tenant-id>`
- `Content-Type: application/json`

---

## Future Enhancements

- [ ] Bulk pricing operations
- [ ] Pricing templates by county
- [ ] Tax rate lookup by ZIP code
- [ ] Pricing history tracking
- [ ] Multiple discount types (%, fixed)
- [ ] Pricing approval workflow
- [ ] Export to PDF/Excel
- [ ] Pricing analytics dashboard

---

**Last Updated**: December 7, 2025  
**Version**: 1.0.0  
**Maintainer**: FieldSmartPro Development Team
