# Job Module Documentation

## Overview

The Job Module is a comprehensive feature of FieldSmartPro that manages job lifecycle from creation to completion. It provides a modern, responsive interface for viewing, creating, editing, and tracking field service jobs.

## Architecture

### 📁 Module Structure

```
src/
├── app/jobs/                    # Job pages (Next.js App Router)
│   ├── page.tsx                 # Jobs list page (main view)
│   ├── [id]/
│   │   ├── page.tsx            # Job details page (view)
│   │   └── edit/
│   │       └── page.tsx        # Job edit page
│   └── create/
│       └── page.tsx            # Job creation page
├── services/
│   └── jobService.ts           # Job API service layer
├── config/apiSchemas/
│   ├── job.schema.ts           # Job API transformations
│   ├── utils.ts                # Shared schema utilities
│   └── index.ts                # Schema exports
└── types/
    └── index.ts                # Job TypeScript interfaces
```

---

## API Integration

### Backend Endpoint

**Base URL**: `http://localhost:8090/odata/iworks/v1/Jobs`

**Protocol**: OData v4

**Proxy Configuration**: All requests go through `/api-proxy` which proxies to backend

### OData Response Format

```json
{
  "@odata.context": "http://localhost:8090/odata/iworks/v1/$metadata#Jobs",
  "value": [
    {
      "UUID": "123e4567-e89b-12d3-a456-426614174000",
      "JobName": "AC Installation",
      "Status": "Scheduled",
      "Priority": "High",
      "ScheduledDate": "2025-07-22T00:00:00Z",
      "Description": "Install new HVAC system",
      "Location": "123 Main St",
      "AssignedTo": "John Doe",
      "EstimatedDuration": 3,
      "TenantId": "tenant1"
    }
  ]
}
```

### Field Mapping

The module uses a centralized schema system to transform between OData API fields and frontend types:

| Backend Field (OData) | Frontend Field | Type | Required |
|----------------------|----------------|------|----------|
| `UUID` | `id` | string | Yes |
| `JobName` | `title` | string | Yes |
| `Status` | `status` | enum | Yes |
| `Priority` | `priority` | enum | No |
| `ScheduledDate` | `date` | string (ISO) | Yes |
| `StartDate` | `startDate` | string (ISO) | No |
| `EndDate` | `endDate` | string (ISO) | No |
| `Description` | `description` | string | No |
| `Location` | `location` | string | No |
| `AssignedTo` | `assignedTo` | string | Yes |
| `EstimatedDuration` | `estimatedDuration` | number | No |
| `TenantId` | `tenantId` | string | Yes |

---

## TypeScript Interfaces

### Job Interface

```typescript
interface Job {
  id: string;                    // Unique identifier (UUID)
  tenantId: string;              // Multi-tenant isolation
  title: string;                 // Job name/title
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  assignedTo: string;            // Technician assigned to job
  date: string;                  // ISO date string
  description?: string;          // Optional job description
  location?: string;             // Job site address
  priority?: 'Low' | 'Medium' | 'High';
  estimatedDuration?: number;    // Hours
}
```

### CreateJobRequest Interface

```typescript
interface CreateJobRequest {
  title: string;
  assignedTo: string;
  date: string;
  description?: string;
  location?: string;
  priority?: 'Low' | 'Medium' | 'High';
  estimatedDuration?: number;
}
```

---

## Service Layer (`jobService.ts`)

### Methods

#### 1. `getAllJobs()`
Fetches all jobs from the API with automatic tenant filtering via headers.

```typescript
const jobs: Job[] = await jobService.getAllJobs();
```

**Process:**
1. Makes GET request to `/odata/iworks/v1/Jobs`
2. Extracts OData `value` array
3. Transforms each job using `transformJobFromApi()`
4. Returns array of `Job` objects

**Error Handling:**
- Throws error on failure (no fallback)
- React Query catches and displays error UI

---

#### 2. `getJobById(id: string)`
Fetches a single job by UUID.

```typescript
const job: Job | null = await jobService.getJobById('uuid-here');
```

**Process:**
1. Makes GET request to `/odata/iworks/v1/Jobs(uuid)`
2. Transforms response using `transformJobFromApi()`
3. Returns `Job` object or `null` if not found

---

#### 3. `createJob(jobData: CreateJobRequest)`
Creates a new job.

```typescript
const newJob: Job = await jobService.createJob({
  title: 'AC Repair',
  assignedTo: 'John Doe',
  date: '2025-07-25',
  priority: 'High',
  location: '123 Main St'
});
```

**Process:**
1. Transforms request using `transformCreateJobToApi()`
2. Makes POST request with transformed data
3. Receives created job from API
4. Transforms and returns new `Job`

---

#### 4. `updateJob(id: string, jobData: Partial<Job>)`
Updates an existing job.

```typescript
const updatedJob: Job = await jobService.updateJob('uuid-here', {
  status: 'Completed',
  description: 'Updated description'
});
```

**Process:**
1. Transforms data using `transformJobToApi()`
2. Makes PUT request to `/odata/iworks/v1/Jobs(uuid)`
3. Returns updated `Job`

---

#### 5. `deleteJob(id: string)`
Deletes a job by UUID.

```typescript
await jobService.deleteJob('uuid-here');
```

**Process:**
1. Makes DELETE request
2. Confirms deletion with API

---

## Schema System (`apiSchemas/job.schema.ts`)

### Transformation Functions

#### `transformJobFromApi(apiJob: any): Job`
Converts OData response to frontend `Job` interface.

```typescript
// API Response
{
  UUID: "abc-123",
  JobName: "AC Repair",
  Status: "Scheduled"
}

// Transformed to
{
  id: "abc-123",
  title: "AC Repair",
  status: "Scheduled"
}
```

---

#### `transformJobToApi(job: Partial<Job>): any`
Converts frontend `Job` to OData format for updates.

```typescript
// Frontend Job
{
  id: "abc-123",
  title: "AC Repair",
  status: "Completed"
}

// Transformed to
{
  UUID: "abc-123",
  JobName: "AC Repair",
  Status: "Completed"
}
```

---

#### `transformCreateJobToApi(jobData: CreateJobRequest): any`
Converts `CreateJobRequest` to OData format.

```typescript
// Frontend Request
{
  title: "New Job",
  assignedTo: "Tech 1",
  date: "2025-07-25"
}

// Transformed to
{
  JobName: "New Job",
  AssignedTo: "Tech 1",
  ScheduledDate: "2025-07-25",
  Status: "Scheduled"  // Auto-added
}
```

---

## Pages

### 1. Jobs List (`/jobs`)

**File**: `src/app/jobs/page.tsx`

**Features:**
- ✅ Display all jobs in card grid
- ✅ Search by title, description, location, assignedTo
- ✅ Filter by status (Scheduled, In Progress, Completed, Cancelled)
- ✅ Filter by priority (Low, Medium, High)
- ✅ Real-time status indicators with color coding
- ✅ Priority badges
- ✅ Responsive grid layout
- ✅ Error handling with retry functionality
- ✅ Empty state with "No jobs available" message
- ✅ Offline detection

**React Query Configuration:**
```typescript
const { data: jobs, isLoading, isError, error, refetch } = useQuery({
  queryKey: ['jobs'],
  queryFn: () => jobService.getAllJobs(),
  enabled: isAuthenticated,
  staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
});
```

**UI States:**

1. **Loading State**: Spinner animation
2. **Error State**: "Failed to Fetch" card with retry button
3. **Empty State**: "No jobs available" card with action button
4. **Success State**: Job cards grid

**Filter Logic:**
```typescript
const filteredJobs = jobs?.filter(job => {
  const matchesSearch = !searchQuery || 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase());
  
  const matchesStatus = !statusFilter || job.status === statusFilter;
  const matchesPriority = !priorityFilter || job.priority === priorityFilter;
  
  return matchesSearch && matchesStatus && matchesPriority;
});
```

---

### 2. Job Details (`/jobs/[id]`)

**File**: `src/app/jobs/[id]/page.tsx`

**Features:**
- ✅ View complete job information
- ✅ **Cache-first navigation** (no API call if data in cache)
- ✅ Display all job fields with icons
- ✅ Status and priority badges
- ✅ Edit and Delete action buttons
- ✅ Error handling

**Cache-First Implementation:**
```typescript
// Check React Query cache first
const cachedJobs = queryClient.getQueryData<Job[]>(['jobs']);
const cachedJob = cachedJobs?.find(j => j.id === id);

if (cachedJob) {
  console.log('[Job Details] Using cached job data');
  return cachedJob;
}

// Fallback to API if not in cache
console.log('[Job Details] Fetching from API');
return jobService.getJobById(id);
```

**Performance Benefit**: Eliminates redundant API calls when navigating from jobs list.

---

### 3. Create Job (`/jobs/create`)

**File**: `src/app/jobs/create/page.tsx`

**Features:**
- ✅ Form with all job fields
- ✅ Client-side validation
- ✅ Date picker integration
- ✅ Priority dropdown
- ✅ Technician assignment
- ✅ Success/error notifications
- ✅ Redirect to jobs list after creation

**Form Fields:**
- Title (required)
- Assigned To (required)
- Date (required)
- Location (optional)
- Priority (Low/Medium/High)
- Estimated Duration (hours)
- Description (optional)

**Submission Flow:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  const jobData: CreateJobRequest = {
    title: formData.title,
    assignedTo: formData.assignedTo,
    date: formData.date,
    location: formData.location,
    priority: formData.priority,
    estimatedDuration: formData.estimatedDuration,
    description: formData.description
  };
  
  await jobService.createJob(jobData);
  router.push('/jobs');
};
```

---

### 4. Edit Job (`/jobs/[id]/edit`)

**File**: `src/app/jobs/[id]/edit/page.tsx`

**Features:**
- ✅ Pre-populated form with existing data
- ✅ All fields editable
- ✅ Validation
- ✅ Save and cancel actions
- ✅ Error handling with retry

**Edit Flow:**
1. Fetch job by ID
2. Populate form with existing values
3. Allow modifications
4. Submit with `updateJob()`
5. Redirect to job details

---

## State Management

### React Query Integration

All job data is managed through **TanStack Query (React Query)** for:

- ✅ **Automatic caching** with 5-minute stale time
- ✅ **Background refetching** on window focus
- ✅ **Optimistic updates** for better UX
- ✅ **Error retry** with exponential backoff
- ✅ **Loading and error states** built-in

**Query Keys:**
- `['jobs']` - All jobs list
- `['job', id]` - Individual job by ID

**Cache Invalidation:**
```typescript
// After create
queryClient.invalidateQueries(['jobs']);

// After update
queryClient.invalidateQueries(['jobs']);
queryClient.invalidateQueries(['job', id]);

// After delete
queryClient.invalidateQueries(['jobs']);
```

---

## Error Handling

### API Client Level
All errors from `apiClient` are logged and thrown with detailed debug information:

```typescript
console.error('[API Client] Error making GET request:', error);
console.error('[API Client] Error response status:', error.response?.status);
console.error('[API Client] Error response data:', error.response?.data);
```

### Service Level
`jobService` catches errors, logs them, and re-throws:

```typescript
catch (error) {
  console.error('[Job API Debug] Error fetching jobs:', error);
  throw error;  // React Query detects this
}
```

### UI Level
React Query's `isError` state triggers error UI:

```tsx
if (isError) {
  return (
    <Card>
      <h3>Failed to Fetch</h3>
      <Button onClick={() => refetch()}>Retry</Button>
    </Card>
  );
}
```

---

## Multi-Tenant Architecture

### Tenant Isolation

All API requests automatically include `X-Tenant-ID` header via `apiClient` interceptor:

```typescript
// Request interceptor
config.headers['X-Tenant-ID'] = getCurrentTenantId();
```

**Tenant ID Source:**
- Retrieved from `localStorage.authUser.tenantId`
- Set during login
- Persists across sessions

**Backend Filtering:**
- OData API filters jobs by `X-Tenant-ID` header
- Users only see jobs belonging to their tenant
- No frontend filtering needed

---

## Authentication & Authorization

### Route Protection

All job pages check authentication status:

```typescript
const { isAuthenticated, isLoading } = useAuth();

useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push('/login');
  }
}, [isAuthenticated, isLoading, router]);
```

**Flow:**
1. Page loads
2. Check `isAuthenticated` from `AuthContext`
3. Redirect to `/login` if not authenticated
4. API calls include `Authorization: Bearer <token>` header

---

## Debugging & Logging

### Debug Logs

Enable comprehensive logging throughout the module:

**Service Layer:**
```
[Job API Debug] Fetching all jobs from: /odata/iworks/v1/Jobs
[Job API Debug] Processing 5 jobs
[Job API Debug] Transformed jobs: 5
```

**Schema Layer:**
```
[Job Schema] Transforming job: abc-123
[Job Schema] Transforming job to API format: abc-123
```

**Page Layer:**
```
[Jobs Page Debug] isLoading: false
[Jobs Page Debug] isError: false
[Jobs Page Debug] jobs: [5 items]
[Job Details] Using cached job data
```

**API Client:**
```
[API Client] Making API call to: /odata/iworks/v1/Jobs
[API Client] Response received with status: 200
[API Client] Response data keys: ['@odata.context', 'value']
```

---

## Performance Optimizations

### 1. Cache-First Navigation
When navigating from jobs list to job details, data is retrieved from React Query cache instead of making a new API call.

**Impact**: Eliminates 1 API call per job view (instant load)

### 2. 5-Minute Stale Time
Jobs are cached for 5 minutes before considered stale.

**Impact**: Reduces API calls when navigating between pages

### 3. Background Refetching
Data refetches in background on window focus.

**Impact**: Always shows fresh data without blocking UI

### 4. Centralized Schema
API transformations are centralized and reusable.

**Impact**: Maintainable, testable, scalable code

---

## Testing the Module

### Prerequisites
1. Backend running on `http://localhost:8090`
2. OData endpoint accessible: `/odata/iworks/v1/Jobs`
3. Valid authentication token
4. Tenant ID configured

### Test Scenarios

#### 1. View Jobs List
1. Login with valid credentials
2. Navigate to `/jobs`
3. Verify jobs load from API
4. Check console for `[Job API Debug]` logs
5. Apply filters and search

#### 2. View Job Details
1. Click "View Details" on a job
2. Verify console shows `[Job Details] Using cached job data`
3. Verify all fields display correctly

#### 3. Create Job
1. Click "Create New Job" button
2. Fill out form
3. Submit
4. Verify redirect to jobs list
5. Verify new job appears

#### 4. Edit Job
1. View job details
2. Click "Edit" button
3. Modify fields
4. Save
5. Verify changes reflected

#### 5. Error Handling
1. Stop backend server
2. Try to load jobs
3. Verify "Failed to Fetch" card appears
4. Start backend
5. Click "Retry"
6. Verify jobs load successfully

#### 6. Empty State
1. Ensure API returns empty array
2. Navigate to `/jobs`
3. Verify "No jobs available" card shows
4. Click "Create New Job"

---

## Common Issues & Solutions

### Issue: "Failed to Fetch" error

**Causes:**
- Backend not running on port 8090
- Proxy misconfigured in `next.config.js`
- CORS issues
- Network connectivity

**Solutions:**
1. Verify backend is running: `curl http://localhost:8090/odata/iworks/v1/Jobs`
2. Check proxy config points to `http://localhost:8090/:path*`
3. Ensure `X-Tenant-ID` header is being sent
4. Check browser console for detailed error logs

---

### Issue: "Cannot read property 'value' of undefined"

**Cause:** OData response format mismatch

**Solution:**
- Ensure API returns `{ "value": [...] }` structure
- Check `extractODataResponse()` in `apiSchemas/utils.ts`
- Verify API endpoint is OData v4 compliant

---

### Issue: Jobs from other tenants visible

**Cause:** Tenant ID header not sent or backend not filtering

**Solution:**
1. Verify `X-Tenant-ID` header in Network tab
2. Check `getCurrentTenantId()` returns correct value
3. Ensure backend filters by tenant ID

---

### Issue: Field data missing or incorrect

**Cause:** Field mapping mismatch between API and frontend

**Solution:**
1. Check API response structure in Network tab
2. Update `JOB_FIELD_MAP` in `job.schema.ts`
3. Modify `transformJobFromApi()` function
4. Test transformation with console logs

---

## Future Enhancements

### Planned Features
- [ ] Bulk job operations (multi-select)
- [ ] Job templates for quick creation
- [ ] Recurring job scheduling
- [ ] Job checklist integration
- [ ] Material/parts tracking per job
- [ ] Time tracking and billing
- [ ] Customer portal for job status
- [ ] Push notifications for job updates
- [ ] Mobile app sync
- [ ] Offline mode with local storage
- [ ] Advanced analytics and reporting
- [ ] Job routing and optimization
- [ ] Photo/file attachments per job
- [ ] Digital signature capture
- [ ] Invoice generation from jobs

---

## API Reference Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/odata/iworks/v1/Jobs` | Get all jobs (tenant-filtered) |
| GET | `/odata/iworks/v1/Jobs(uuid)` | Get job by UUID |
| POST | `/odata/iworks/v1/Jobs` | Create new job |
| PUT | `/odata/iworks/v1/Jobs(uuid)` | Update existing job |
| DELETE | `/odata/iworks/v1/Jobs(uuid)` | Delete job |

**Headers Required:**
- `Authorization: Bearer <token>`
- `X-Tenant-ID: <tenant-id>`
- `Content-Type: application/json`

---

## Related Modules

- **Customer Module** (`/customers`) - Links to jobs via customer ID
- **Technician Module** (`/technicians`) - Assigns technicians to jobs
- **Invoice Module** (`/invoices`) - Generates invoices from completed jobs
- **Scheduler Module** (`/scheduler`) - Calendar view of scheduled jobs
- **Dashboard** (`/dashboard`) - Overview of job statistics

---

## Contributing

When modifying the job module:

1. ✅ Update field mappings in `job.schema.ts`
2. ✅ Add corresponding TypeScript types
3. ✅ Test all CRUD operations
4. ✅ Verify tenant isolation
5. ✅ Update this README with changes
6. ✅ Add debug logs for new features
7. ✅ Test error scenarios

---

## Support

For issues or questions:
- Check console logs with `[Job API Debug]` prefix
- Review Network tab for API requests
- Verify backend OData endpoint is accessible
- Ensure authentication and tenant ID are valid

---

**Last Updated**: November 26, 2025  
**Version**: 1.0.0  
**Maintainer**: FieldSmartPro Development Team
