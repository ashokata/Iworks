# FieldSmartPro - QA Automation Test Plan

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Test Strategy Overview](#test-strategy-overview)
3. [Testing Pyramid & Coverage Goals](#testing-pyramid--coverage-goals)
4. [Backend API Testing](#backend-api-testing)
5. [Frontend Web Testing](#frontend-web-testing)
6. [Mobile App Testing](#mobile-app-testing)
7. [End-to-End Testing](#end-to-end-testing)
8. [Integration Testing](#integration-testing)
9. [Performance & Load Testing](#performance--load-testing)
10. [Security Testing](#security-testing)
11. [Test Tools & Technology Stack](#test-tools--technology-stack)
12. [Test Data Management](#test-data-management)
13. [CI/CD Integration](#cicd-integration)
14. [Test Environment Strategy](#test-environment-strategy)
15. [Implementation Roadmap](#implementation-roadmap)
16. [Test Metrics & Reporting](#test-metrics--reporting)

---

## Executive Summary

This document outlines a comprehensive QA automation testing strategy for the FieldSmartPro field service management platform. The application consists of three main components:
- **API**: Node.js/Express backend with PostgreSQL/DynamoDB
- **Web**: Next.js 15 frontend application
- **Mobile**: React Native/Expo mobile application

**Current State**: No automated tests exist. This plan establishes testing from the ground up.

**Goals**:
- Achieve 80% code coverage across all applications
- Implement comprehensive test automation for all critical workflows
- Establish CI/CD pipeline with automated test execution
- Reduce regression bugs by 90%
- Enable confident continuous deployment

---

## Test Strategy Overview

### Testing Philosophy
We will follow the **Testing Pyramid** approach:
- **70% Unit Tests**: Fast, isolated, component-level tests
- **20% Integration Tests**: API endpoints, database interactions, service integrations
- **10% E2E Tests**: Critical user journeys and workflows

### Testing Levels

| Level | Scope | Tools | Execution Time | Frequency |
|-------|-------|-------|----------------|-----------|
| Unit | Functions, components, services | Jest | < 2 min | Every commit |
| Integration | API routes, database, services | Jest + Supertest | < 5 min | Every commit |
| E2E | Full workflows across stack | Playwright | < 15 min | Pre-merge, nightly |
| Performance | Load, stress, scalability | k6, Lighthouse | 30-60 min | Weekly, pre-release |
| Security | Vulnerabilities, auth flows | OWASP ZAP, npm audit | 10-20 min | Weekly, pre-release |

### Test Types by Priority

**P0 (Critical - Must Have)**
- Authentication flows (login, logout, session management)
- Customer CRUD operations
- Job creation and scheduling
- Invoice generation and payment processing
- Multi-tenant data isolation

**P1 (High - Should Have)**
- Employee management
- AI chat functionality (AIRA)
- VAPI voice integration
- Map/geolocation features
- Search and filtering

**P2 (Medium - Nice to Have)**
- Reporting and analytics
- Calendar integrations
- Notification systems
- Settings and preferences

---

## Backend API Testing

### Unit Tests (Target: 80% coverage)

**What to Test:**

#### 1. Service Layer (`apps/api/src/services/`)
```typescript
// Example: customer.postgres.service.ts
describe('CustomerPostgresService', () => {
  describe('createCustomer', () => {
    it('should create a customer with valid data')
    it('should validate required fields')
    it('should enforce tenant isolation')
    it('should handle duplicate email addresses')
    it('should create customer with multiple addresses')
  })

  describe('getCustomers', () => {
    it('should return paginated results')
    it('should filter by customer type')
    it('should search by name/email/phone')
    it('should only return customers for the tenant')
  })

  describe('updateCustomer', () => {
    it('should update customer fields')
    it('should prevent cross-tenant updates')
    it('should validate data before update')
  })
})
```

**Services to Test:**
- `customer.postgres.service.ts`
- `customer.dynamodb.service.ts`
- `employee.postgres.service.ts`
- `job.postgres.service.ts`
- `invoice.postgres.service.ts`
- `bedrock-llm.service.ts`
- `llm-function-executor.ts`
- `prisma.service.ts`

#### 2. Handlers (`apps/api/src/handlers/`)
```typescript
// Example: customers handler
describe('Customer Handlers', () => {
  it('should parse request body correctly')
  it('should extract tenant from headers')
  it('should handle validation errors')
  it('should return proper HTTP status codes')
  it('should format response correctly')
})
```

#### 3. Utilities & Helpers
```typescript
describe('Database Utilities', () => {
  it('should establish database connection')
  it('should handle connection errors')
  it('should close connections properly')
})
```

### Integration Tests (API Endpoints)

**Test Framework**: Jest + Supertest

**Setup Requirements:**
- In-memory SQLite database for fast tests
- Mock AWS services (Bedrock, DynamoDB)
- Test tenant data seeding

```typescript
// Example: Customer API Integration Tests
describe('Customer API Integration', () => {
  let app: Express;
  let testTenant: string;

  beforeAll(async () => {
    app = await setupTestApp();
    testTenant = await createTestTenant();
  });

  describe('POST /customers', () => {
    it('should create customer and return 201', async () => {
      const response = await request(app)
        .post('/customers')
        .set('X-Tenant-ID', testTenant)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          type: 'RESIDENTIAL'
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('John Doe');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/customers')
        .set('X-Tenant-ID', testTenant)
        .send({ name: '' }); // Missing required fields

      expect(response.status).toBe(400);
    });

    it('should return 401 without tenant header', async () => {
      const response = await request(app)
        .post('/customers')
        .send({ name: 'John Doe' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /customers', () => {
    beforeEach(async () => {
      await seedTestCustomers(testTenant, 25);
    });

    it('should return paginated customers', async () => {
      const response = await request(app)
        .get('/customers?page=1&limit=10')
        .set('X-Tenant-ID', testTenant);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.total).toBe(25);
    });

    it('should filter by customer type', async () => {
      const response = await request(app)
        .get('/customers?type=COMMERCIAL')
        .set('X-Tenant-ID', testTenant);

      expect(response.status).toBe(200);
      response.body.data.forEach(customer => {
        expect(customer.type).toBe('COMMERCIAL');
      });
    });

    it('should search by name', async () => {
      const response = await request(app)
        .get('/customers?search=John')
        .set('X-Tenant-ID', testTenant);

      expect(response.status).toBe(200);
      response.body.data.forEach(customer => {
        expect(customer.name.toLowerCase()).toContain('john');
      });
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should not return customers from other tenants', async () => {
      const tenant1 = await createTestTenant();
      const tenant2 = await createTestTenant();

      await createTestCustomer(tenant1, { name: 'Tenant 1 Customer' });
      await createTestCustomer(tenant2, { name: 'Tenant 2 Customer' });

      const response = await request(app)
        .get('/customers')
        .set('X-Tenant-ID', tenant1);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Tenant 1 Customer');
    });
  });
});
```

**All API Endpoints to Test:**

| Endpoint | Methods | Test Count (est.) |
|----------|---------|-------------------|
| `/health`, `/health/db` | GET | 5 |
| `/customers` | GET, POST, PUT, DELETE | 20 |
| `/customers/:id/addresses` | POST, PUT, DELETE | 10 |
| `/employees` | GET, POST, PUT, DELETE | 15 |
| `/employees/:id/schedule` | GET, PUT | 8 |
| `/employees/:id/skills` | POST, DELETE | 6 |
| `/jobs` | POST, GET, PUT, DELETE | 20 |
| `/chat` | POST | 10 |
| `/llm-chat` | POST | 12 |
| `/webhooks/vapi/:tenantId` | POST | 8 |
| `/api/tenants/:tenantId/vapi/*` | GET, PUT, POST | 15 |
| **Total** | | **~129 tests** |

### Database Testing

**Schema Validation:**
```typescript
describe('Prisma Schema', () => {
  it('should apply all migrations successfully')
  it('should enforce foreign key constraints')
  it('should enforce unique constraints')
  it('should set default values correctly')
  it('should cascade deletes appropriately')
})
```

**Seed Data Testing:**
```typescript
describe('Database Seeding', () => {
  it('should seed demo tenant data')
  it('should seed all enum values')
  it('should maintain referential integrity')
})
```

### AI/LLM Testing

**Bedrock Integration:**
```typescript
describe('BedrockLLMService', () => {
  beforeEach(() => {
    // Mock AWS Bedrock client
  });

  it('should format prompt correctly')
  it('should include conversation history')
  it('should handle function/tool calls')
  it('should parse LLM response')
  it('should handle rate limits gracefully')
  it('should retry on transient errors')
})

describe('LLM Function Executor', () => {
  it('should execute customer search function')
  it('should execute job creation function')
  it('should validate function parameters')
  it('should handle function execution errors')
})
```

### VAPI Integration Testing

```typescript
describe('VAPI Integration', () => {
  it('should receive webhook events')
  it('should validate webhook signatures')
  it('should provision phone numbers')
  it('should retrieve call analytics')
  it('should handle call routing')
})
```

---

## Frontend Web Testing

### Unit Tests (Target: 80% coverage)

**What to Test:**

#### 1. React Components (`apps/web/src/components/`)

```typescript
// Example: CustomerForm component
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerForm } from '@/components/customers/CustomerForm';

describe('CustomerForm', () => {
  it('should render all form fields', () => {
    render(<CustomerForm />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<CustomerForm />);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<CustomerForm />);
    const emailInput = screen.getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<CustomerForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
  });

  it('should populate form in edit mode', () => {
    const customer = {
      id: '1',
      name: 'Jane Doe',
      email: 'jane@example.com'
    };

    render(<CustomerForm customer={customer} mode="edit" />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('Jane Doe');
    expect(screen.getByLabelText(/email/i)).toHaveValue('jane@example.com');
  });
});
```

**Component Categories to Test:**

1. **Common Components** (`components/common/`)
   - Buttons, inputs, modals, dropdowns
   - Loading states, error states
   - Layout components (Header, Sidebar, Footer)

2. **Entity Components** (`components/customers/`, `jobs/`, `invoices/`, etc.)
   - List views with filtering/sorting
   - Detail views
   - Forms (create, edit)
   - Cards and summary components

3. **AI Chat Components** (`components/AIChat/`)
   - Chat interface
   - Message rendering
   - Voice input handling
   - Function call displays

4. **Map Components** (`components/Map/`)
   - Map rendering
   - Marker placement
   - Geolocation handling

#### 2. Services (`apps/web/src/services/`)

```typescript
// Example: customerService tests
import { customerService } from '@/services/customerService';
import { apiClient } from '@/services/apiClient';

jest.mock('@/services/apiClient');

describe('CustomerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCustomers', () => {
    it('should fetch customers from API', async () => {
      const mockCustomers = [
        { id: '1', name: 'Customer 1' },
        { id: '2', name: 'Customer 2' }
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockCustomers,
        total: 2
      });

      const result = await customerService.getCustomers();

      expect(apiClient.get).toHaveBeenCalledWith('/customers');
      expect(result.data).toEqual(mockCustomers);
    });

    it('should pass query parameters', async () => {
      await customerService.getCustomers({
        page: 2,
        limit: 20,
        type: 'COMMERCIAL'
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/customers?page=2&limit=20&type=COMMERCIAL'
      );
    });

    it('should handle API errors', async () => {
      (apiClient.get as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(customerService.getCustomers()).rejects.toThrow('Network error');
    });
  });

  describe('createCustomer', () => {
    it('should create customer via API', async () => {
      const newCustomer = {
        name: 'New Customer',
        email: 'new@example.com'
      };

      const createdCustomer = { id: '123', ...newCustomer };
      (apiClient.post as jest.Mock).mockResolvedValue(createdCustomer);

      const result = await customerService.createCustomer(newCustomer);

      expect(apiClient.post).toHaveBeenCalledWith('/customers', newCustomer);
      expect(result).toEqual(createdCustomer);
    });
  });
});
```

**Services to Test:**
- `customerService.ts`
- `employeeService.ts`
- `jobService.ts`
- `invoiceService.ts`
- `aiChatService.ts`
- `apiClient.ts`

#### 3. Hooks (`apps/web/src/hooks/`)

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomers } from '@/hooks/useCustomers';

describe('useCustomers', () => {
  it('should fetch customers on mount', async () => {
    const { result } = renderHook(() => useCustomers());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.customers).toBeDefined();
  });

  it('should refetch on filter change', async () => {
    const { result, rerender } = renderHook(
      ({ filter }) => useCustomers(filter),
      { initialProps: { filter: 'RESIDENTIAL' } }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ filter: 'COMMERCIAL' });

    expect(result.current.isLoading).toBe(true);
  });
});
```

#### 4. Context Providers (`apps/web/src/contexts/`)

```typescript
import { render, screen } from '@testing-library/react';
import { TenantProvider, useTenant } from '@/contexts/TenantContext';

describe('TenantContext', () => {
  it('should provide tenant data to children', async () => {
    const TestComponent = () => {
      const { tenant } = useTenant();
      return <div>{tenant?.name}</div>;
    };

    render(
      <TenantProvider tenantId="tenant1">
        <TestComponent />
      </TenantProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/tenant1/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Tests (Next.js)

**API Routes Testing** (`apps/web/src/app/api/`)

```typescript
// Example: Testing Next.js API routes
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/tenants/[tenantId]/route';

describe('Tenant API Route', () => {
  it('should return tenant data', async () => {
    const request = new NextRequest('http://localhost:3000/api/tenants/tenant1');
    const response = await GET(request, { params: { tenantId: 'tenant1' } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe('tenant1');
  });
});
```

### Visual Regression Testing

**Tool**: Chromatic or Percy

```typescript
// Storybook stories for visual testing
export const CustomerCardDefault = {
  render: () => (
    <CustomerCard
      customer={{
        name: 'John Doe',
        email: 'john@example.com',
        type: 'RESIDENTIAL'
      }}
    />
  )
};

export const CustomerCardCommercial = {
  render: () => (
    <CustomerCard
      customer={{
        name: 'ABC Corp',
        email: 'contact@abc.com',
        type: 'COMMERCIAL'
      }}
    />
  )
};
```

### Accessibility Testing

```typescript
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

describe('CustomerForm Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<CustomerForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## Mobile App Testing

### Unit Tests (React Native Components)

**Framework**: Jest + React Native Testing Library

```typescript
// Example: Customer list component
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CustomerList } from '@/components/customers/CustomerList';

describe('CustomerList', () => {
  it('should render customer items', () => {
    const customers = [
      { id: '1', name: 'Customer 1' },
      { id: '2', name: 'Customer 2' }
    ];

    render(<CustomerList customers={customers} />);

    expect(screen.getByText('Customer 1')).toBeTruthy();
    expect(screen.getByText('Customer 2')).toBeTruthy();
  });

  it('should call onPress when item tapped', () => {
    const onPress = jest.fn();
    const customers = [{ id: '1', name: 'Customer 1' }];

    render(<CustomerList customers={customers} onItemPress={onPress} />);

    fireEvent.press(screen.getByText('Customer 1'));

    expect(onPress).toHaveBeenCalledWith('1');
  });

  it('should show loading state', () => {
    render(<CustomerList isLoading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });

  it('should show empty state', () => {
    render(<CustomerList customers={[]} />);
    expect(screen.getByText(/no customers/i)).toBeTruthy();
  });
});
```

### Integration Tests (Mobile)

**Navigation Testing:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootLayout from '@/app/_layout';

describe('Navigation', () => {
  it('should navigate to customers tab', () => {
    render(
      <NavigationContainer>
        <RootLayout />
      </NavigationContainer>
    );

    const customersTab = screen.getByText('Customers');
    fireEvent.press(customersTab);

    expect(screen.getByText(/Customer List/i)).toBeTruthy();
  });
});
```

**State Management Testing (Zustand):**
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useCustomerStore } from '@/stores/customerStore';

describe('Customer Store', () => {
  it('should add customer to store', () => {
    const { result } = renderHook(() => useCustomerStore());

    act(() => {
      result.current.addCustomer({
        id: '1',
        name: 'Test Customer'
      });
    });

    expect(result.current.customers).toHaveLength(1);
    expect(result.current.customers[0].name).toBe('Test Customer');
  });
});
```

### E2E Testing (Mobile)

**Framework**: Detox (React Native E2E)

```typescript
// e2e/customer-flow.e2e.ts
describe('Customer Management Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should create a new customer', async () => {
    // Navigate to customers tab
    await element(by.text('Customers')).tap();

    // Tap add button
    await element(by.id('add-customer-button')).tap();

    // Fill form
    await element(by.id('customer-name-input')).typeText('John Doe');
    await element(by.id('customer-email-input')).typeText('john@example.com');
    await element(by.id('customer-phone-input')).typeText('555-1234');

    // Submit
    await element(by.id('submit-button')).tap();

    // Verify customer appears in list
    await expect(element(by.text('John Doe'))).toBeVisible();
  });

  it('should view customer details', async () => {
    await element(by.text('John Doe')).tap();

    await expect(element(by.text('john@example.com'))).toBeVisible();
    await expect(element(by.text('555-1234'))).toBeVisible();
  });
});
```

---

## End-to-End Testing

### Framework: Playwright

**Why Playwright?**
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile emulation
- Network interception
- Auto-wait for elements
- Parallel execution
- Video recording and screenshots

### Critical User Journeys

#### 1. Authentication Flow
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await loginAsUser(page, 'test@example.com');

    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    await expect(page).toHaveURL('/login');
  });
});
```

#### 2. Customer Management Flow
```typescript
test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('should create a new customer', async ({ page }) => {
    await page.goto('http://localhost:3000/customers');
    await page.click('text=Add Customer');

    // Fill form
    await page.fill('[name="name"]', 'ABC Corporation');
    await page.fill('[name="email"]', 'contact@abc.com');
    await page.fill('[name="phone"]', '555-9876');
    await page.selectOption('[name="type"]', 'COMMERCIAL');

    // Add address
    await page.click('text=Add Address');
    await page.fill('[name="street"]', '123 Main St');
    await page.fill('[name="city"]', 'New York');
    await page.fill('[name="state"]', 'NY');
    await page.fill('[name="zipCode"]', '10001');

    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=Customer created successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/customers\/view\/\w+/);
  });

  test('should search customers', async ({ page }) => {
    await page.goto('http://localhost:3000/customers');

    await page.fill('[placeholder="Search customers..."]', 'ABC');
    await page.waitForTimeout(500); // Debounce

    const customerCards = page.locator('[data-testid="customer-card"]');
    await expect(customerCards).toHaveCount(1);
    await expect(customerCards.first()).toContainText('ABC Corporation');
  });

  test('should edit customer', async ({ page }) => {
    await page.goto('http://localhost:3000/customers');
    await page.click('text=ABC Corporation');
    await page.click('button:has-text("Edit")');

    await page.fill('[name="phone"]', '555-0000');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Customer updated successfully')).toBeVisible();
    await expect(page.locator('text=555-0000')).toBeVisible();
  });

  test('should delete customer', async ({ page }) => {
    await page.goto('http://localhost:3000/customers');
    await page.click('text=ABC Corporation');
    await page.click('button:has-text("Delete")');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Customer deleted successfully')).toBeVisible();
    await expect(page).toHaveURL('/customers');
  });
});
```

#### 3. Job Scheduling Flow
```typescript
test.describe('Job Scheduling', () => {
  test('should create and schedule a job', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('http://localhost:3000/jobs');

    await page.click('text=Create Job');

    // Select customer
    await page.click('[data-testid="customer-select"]');
    await page.click('text=ABC Corporation');

    // Job details
    await page.fill('[name="title"]', 'HVAC Installation');
    await page.fill('[name="description"]', 'Install new HVAC system');
    await page.selectOption('[name="priority"]', 'HIGH');

    // Schedule
    await page.fill('[name="scheduledDate"]', '2025-12-20');
    await page.fill('[name="scheduledTime"]', '09:00');

    // Assign technician
    await page.click('[data-testid="technician-select"]');
    await page.click('text=John Smith');

    // Add line items
    await page.click('text=Add Line Item');
    await page.fill('[name="lineItems[0].description"]', 'HVAC Unit');
    await page.fill('[name="lineItems[0].quantity"]', '1');
    await page.fill('[name="lineItems[0].price"]', '2500');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Job created successfully')).toBeVisible();
  });

  test('should view job on scheduler', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('http://localhost:3000/scheduler');

    // Find job in calendar
    await expect(page.locator('text=HVAC Installation')).toBeVisible();

    // Click to view details
    await page.click('text=HVAC Installation');

    await expect(page.locator('text=ABC Corporation')).toBeVisible();
    await expect(page.locator('text=John Smith')).toBeVisible();
  });

  test('should drag and drop to reschedule', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('http://localhost:3000/scheduler');

    const job = page.locator('text=HVAC Installation');
    const targetSlot = page.locator('[data-date="2025-12-21"][data-time="10:00"]');

    await job.dragTo(targetSlot);

    await expect(page.locator('text=Job rescheduled successfully')).toBeVisible();
  });
});
```

#### 4. Invoice Generation Flow
```typescript
test.describe('Invoice Generation', () => {
  test('should generate invoice from completed job', async ({ page }) => {
    await loginAsUser(page);

    // Create and complete a job first
    const jobId = await createTestJob(page);
    await markJobCompleted(page, jobId);

    // Navigate to invoices
    await page.goto('http://localhost:3000/invoices');
    await page.click('text=Create Invoice');

    // Select job
    await page.click('[data-testid="job-select"]');
    await page.click(`text=Job #${jobId}`);

    // Verify line items auto-populated
    await expect(page.locator('[data-testid="line-item-0"]')).toBeVisible();

    // Add additional charges
    await page.click('text=Add Charge');
    await page.fill('[name="additionalCharges[0].description"]', 'Travel Fee');
    await page.fill('[name="additionalCharges[0].amount"]', '50');

    // Set payment terms
    await page.selectOption('[name="paymentTerms"]', 'NET_30');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invoice created successfully')).toBeVisible();
  });

  test('should record payment', async ({ page }) => {
    await loginAsUser(page);
    const invoiceId = await createTestInvoice(page);

    await page.goto(`http://localhost:3000/invoices/${invoiceId}`);
    await page.click('text=Record Payment');

    await page.fill('[name="amount"]', '2550');
    await page.selectOption('[name="method"]', 'CREDIT_CARD');
    await page.fill('[name="reference"]', 'CC-12345');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Payment recorded successfully')).toBeVisible();
    await expect(page.locator('text=PAID')).toBeVisible();
  });
});
```

#### 5. AI Chat Flow
```typescript
test.describe('AI Chat (AIRA)', () => {
  test('should interact with AI assistant', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('http://localhost:3000/chat');

    // Send message
    await page.fill('[data-testid="chat-input"]', 'Show me all customers');
    await page.click('[data-testid="send-button"]');

    // Wait for AI response
    await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible({
      timeout: 10000
    });

    // Verify function call executed
    await expect(page.locator('text=Found')).toBeVisible();
    await expect(page.locator('[data-testid="customer-result"]')).toHaveCount(
      expect.any(Number)
    );
  });

  test('should handle voice input', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);
    await loginAsUser(page);
    await page.goto('http://localhost:3000/chat');

    // Mock getUserMedia for voice input
    await page.click('[data-testid="voice-input-button"]');

    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();

    await page.click('[data-testid="stop-recording-button"]');

    // Verify transcription appears
    await expect(page.locator('[data-testid="chat-input"]')).not.toBeEmpty();
  });
});
```

### Cross-Browser Testing Matrix

| Browser | Desktop | Mobile | Priority |
|---------|---------|--------|----------|
| Chrome | ✅ | ✅ | P0 |
| Firefox | ✅ | ❌ | P1 |
| Safari | ✅ | ✅ | P0 |
| Edge | ✅ | ❌ | P2 |

### Mobile Viewport Testing
```typescript
test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should display mobile navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
  });
});
```

---

## Integration Testing

### Third-Party Service Mocking

#### AWS Bedrock (AI)
```typescript
import { mockClient } from 'aws-sdk-client-mock';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

const bedrockMock = mockClient(BedrockRuntimeClient);

describe('Bedrock Integration', () => {
  beforeEach(() => {
    bedrockMock.reset();
  });

  it('should invoke Claude model', async () => {
    bedrockMock.on(InvokeModelCommand).resolves({
      body: JSON.stringify({
        content: [{ text: 'Hello! How can I help?' }]
      })
    });

    const response = await llmService.chat('Hello');
    expect(response).toContain('How can I help');
  });
});
```

#### VAPI Integration
```typescript
describe('VAPI Integration', () => {
  beforeEach(() => {
    nock('https://api.vapi.ai')
      .post('/v1/call')
      .reply(200, { callId: 'call-123', status: 'initiated' });
  });

  it('should initiate phone call', async () => {
    const result = await vapiService.initiateCall({
      phoneNumber: '+15551234567',
      assistant: 'assistant-id'
    });

    expect(result.callId).toBe('call-123');
  });
});
```

#### Mapbox Integration
```typescript
describe('Map Integration', () => {
  it('should geocode address', async () => {
    const address = '123 Main St, New York, NY 10001';
    const coordinates = await mapService.geocodeAddress(address);

    expect(coordinates.lat).toBeCloseTo(40.7128, 2);
    expect(coordinates.lng).toBeCloseTo(-74.0060, 2);
  });
});
```

---

## Performance & Load Testing

### Tool: k6

**Backend Load Tests:**
```javascript
// load-tests/customer-api.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be below 1%
  },
};

export default function () {
  const baseUrl = 'http://localhost:4000';
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': 'tenant1',
  };

  // Get customers
  let response = http.get(`${baseUrl}/customers?page=1&limit=20`, { headers });
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has customers': (r) => JSON.parse(r.body).data.length > 0,
  });

  sleep(1);

  // Create customer
  const payload = JSON.stringify({
    name: `Customer ${Date.now()}`,
    email: `customer${Date.now()}@example.com`,
    phone: '555-1234',
    type: 'RESIDENTIAL',
  });

  response = http.post(`${baseUrl}/customers`, payload, { headers });
  check(response, {
    'status is 201': (r) => r.status === 201,
    'customer created': (r) => JSON.parse(r.body).id !== undefined,
  });

  sleep(1);
}
```

**Frontend Performance Tests:**
```javascript
// Lighthouse CI configuration
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/customers',
        'http://localhost:3000/jobs',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
  },
};
```

### Performance Benchmarks

| Metric | Target | Critical |
|--------|--------|----------|
| API Response Time (p95) | < 500ms | < 1000ms |
| Page Load Time (LCP) | < 2.5s | < 4s |
| Time to Interactive | < 3s | < 5s |
| API Throughput | > 100 req/s | > 50 req/s |
| Database Query Time (p95) | < 100ms | < 300ms |

---

## Security Testing

### 1. Authentication & Authorization Tests

```typescript
describe('Security - Authentication', () => {
  it('should reject requests without authentication', async () => {
    const response = await request(app).get('/customers');
    expect(response.status).toBe(401);
  });

  it('should reject expired tokens', async () => {
    const expiredToken = generateExpiredToken();
    const response = await request(app)
      .get('/customers')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it('should reject requests without tenant header', async () => {
    const response = await request(app)
      .get('/customers')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(400);
  });
});

describe('Security - Multi-tenant Isolation', () => {
  it('should not allow access to other tenant data', async () => {
    const tenant1Token = await loginAsTenant('tenant1');
    const tenant2Token = await loginAsTenant('tenant2');

    // Create customer in tenant1
    const response1 = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${tenant1Token}`)
      .set('X-Tenant-ID', 'tenant1')
      .send({ name: 'Tenant 1 Customer' });

    const customerId = response1.body.id;

    // Try to access from tenant2
    const response2 = await request(app)
      .get(`/customers/${customerId}`)
      .set('Authorization', `Bearer ${tenant2Token}`)
      .set('X-Tenant-ID', 'tenant2');

    expect(response2.status).toBe(404);
  });
});
```

### 2. Input Validation & Injection Tests

```typescript
describe('Security - SQL Injection', () => {
  it('should prevent SQL injection in search', async () => {
    const maliciousInput = "'; DROP TABLE customers; --";

    const response = await request(app)
      .get(`/customers?search=${encodeURIComponent(maliciousInput)}`)
      .set('X-Tenant-ID', testTenant);

    expect(response.status).toBe(200);
    // Verify database still intact
    const customers = await prisma.customer.count();
    expect(customers).toBeGreaterThan(0);
  });
});

describe('Security - XSS Prevention', () => {
  it('should sanitize HTML in customer name', async () => {
    const xssPayload = '<script>alert("XSS")</script>';

    const response = await request(app)
      .post('/customers')
      .set('X-Tenant-ID', testTenant)
      .send({ name: xssPayload, email: 'test@example.com' });

    expect(response.body.name).not.toContain('<script>');
  });
});
```

### 3. OWASP ZAP Integration

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly
  workflow_dispatch:

jobs:
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Start application
        run: |
          docker-compose up -d

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

### 4. Dependency Vulnerability Scanning

```bash
# Run in CI/CD
npm audit --audit-level=high
npm audit fix

# Snyk integration
npx snyk test
npx snyk monitor
```

---

## Test Tools & Technology Stack

### Backend Testing Stack

| Purpose | Tool | Version |
|---------|------|---------|
| Test Framework | Jest | ^29.7.0 |
| HTTP Testing | Supertest | ^6.3.3 |
| Mocking | jest-mock | Built-in |
| Coverage | Jest Coverage | Built-in |
| DB Testing | @prisma/client | ^5.22.0 |
| AWS Mocking | aws-sdk-client-mock | ^3.0.0 |

### Frontend Testing Stack (Web)

| Purpose | Tool | Version |
|---------|------|---------|
| Test Framework | Jest | ^29.7.0 |
| React Testing | @testing-library/react | ^14.0.0 |
| User Events | @testing-library/user-event | ^14.5.1 |
| Accessibility | jest-axe | ^8.0.0 |
| Mocking | MSW (Mock Service Worker) | ^2.0.0 |
| Visual Regression | Chromatic | Latest |

### Mobile Testing Stack

| Purpose | Tool | Version |
|---------|------|---------|
| Test Framework | Jest | ^29.7.0 |
| React Native Testing | @testing-library/react-native | ^12.4.0 |
| E2E Testing | Detox | ^20.14.0 |
| Test Runner | Jest (built-in with Expo) | ^29.7.0 |

### E2E Testing Stack

| Purpose | Tool | Version |
|---------|------|---------|
| E2E Framework | Playwright | ^1.40.0 |
| API Testing | Playwright | ^1.40.0 |
| Visual Testing | Playwright Screenshots | Built-in |
| Test Reporting | Playwright HTML Reporter | Built-in |

### Performance Testing

| Purpose | Tool | Version |
|---------|------|---------|
| Load Testing | k6 | ^0.48.0 |
| Frontend Perf | Lighthouse CI | ^0.12.0 |
| Monitoring | New Relic / DataDog | - |

### Security Testing

| Purpose | Tool | Version |
|---------|------|---------|
| Vulnerability Scanning | npm audit | Built-in |
| Security Testing | OWASP ZAP | Latest |
| Dependency Scanning | Snyk | Latest |
| SAST | SonarQube | Latest |

---

## Test Data Management

### Test Database Strategy

**Approach**: Isolated test databases per test suite

```typescript
// test-setup.ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export async function setupTestDatabase() {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/test_db'
      }
    }
  });

  // Run migrations
  await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
  await prisma.$executeRawUnsafe('CREATE SCHEMA public');
  await runMigrations();

  return prisma;
}

export async function cleanupTestDatabase() {
  await prisma.$disconnect();
}

export async function seedTestData(tenantId: string) {
  // Seed tenant
  const tenant = await prisma.tenant.create({
    data: {
      id: tenantId,
      name: 'Test Tenant',
      slug: 'test-tenant',
      status: 'ACTIVE',
    },
  });

  // Seed users
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@test.com',
        tenantId: tenant.id,
        role: 'ADMIN',
      },
      {
        email: 'tech@test.com',
        tenantId: tenant.id,
        role: 'TECHNICIAN',
      },
    ],
  });

  // Seed customers
  await prisma.customer.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      tenantId: tenant.id,
      name: `Test Customer ${i + 1}`,
      email: `customer${i + 1}@test.com`,
      phone: `555-${1000 + i}`,
      type: i % 2 === 0 ? 'RESIDENTIAL' : 'COMMERCIAL',
    })),
  });

  // Return seeded data references
  return { tenant };
}
```

### Test Data Factories

**Use Factory Pattern for Test Data:**

```typescript
// test/factories/customer.factory.ts
import { faker } from '@faker-js/faker';

export class CustomerFactory {
  static build(overrides = {}) {
    return {
      name: faker.company.name(),
      email: faker.internet.email(),
      phone: faker.phone.number('###-####'),
      type: faker.helpers.arrayElement(['RESIDENTIAL', 'COMMERCIAL', 'CONTRACTOR']),
      ...overrides,
    };
  }

  static buildMany(count: number, overrides = {}) {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  static async create(prisma: PrismaClient, tenantId: string, overrides = {}) {
    return await prisma.customer.create({
      data: {
        ...this.build(overrides),
        tenantId,
      },
    });
  }
}

// Usage in tests:
describe('Customer Tests', () => {
  it('should create customer', async () => {
    const customerData = CustomerFactory.build({
      type: 'COMMERCIAL'
    });

    const response = await request(app)
      .post('/customers')
      .set('X-Tenant-ID', testTenant)
      .send(customerData);

    expect(response.status).toBe(201);
  });
});
```

### Mock Data for Frontend

```typescript
// mocks/handlers.ts (MSW)
import { rest } from 'msw';

export const handlers = [
  rest.get('http://localhost:4000/customers', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          { id: '1', name: 'Customer 1', type: 'RESIDENTIAL' },
          { id: '2', name: 'Customer 2', type: 'COMMERCIAL' },
        ],
        total: 2,
      })
    );
  }),

  rest.post('http://localhost:4000/customers', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        id: faker.string.uuid(),
        ...body,
      })
    );
  }),
];
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20.x'

jobs:
  # Lint and Format Check
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check formatting
        run: npm run format:check

  # Unit Tests - API
  test-api:
    name: Test API (Unit + Integration)
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Prisma migrations
        run: npm run migrate:test
        working-directory: apps/api
        env:
          DATABASE_URL: postgresql://test:test@localhost:5433/test_db

      - name: Run tests
        run: npm run test:coverage
        working-directory: apps/api
        env:
          DATABASE_URL: postgresql://test:test@localhost:5433/test_db

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/coverage-final.json
          flags: api
          name: api-coverage

  # Unit Tests - Web
  test-web:
    name: Test Web (Unit + Component)
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage
        working-directory: apps/web

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/web/coverage/coverage-final.json
          flags: web
          name: web-coverage

  # Unit Tests - Mobile
  test-mobile:
    name: Test Mobile (Unit)
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage
        working-directory: apps/mobile

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/mobile/coverage/coverage-final.json
          flags: mobile
          name: mobile-coverage

  # E2E Tests
  test-e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    timeout-minutes: 30

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build applications
        run: npm run build

      - name: Seed test database
        run: npm run db:seed:test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

      - name: Start applications
        run: |
          npm run start:api &
          npm run start:web &
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          API_URL: http://localhost:4000
          NEXT_PUBLIC_API_URL: http://localhost:4000

      - name: Wait for applications to be ready
        run: |
          npx wait-on http://localhost:4000/health http://localhost:3000 --timeout 60000

      - name: Run Playwright tests
        run: npx playwright test

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  # Performance Tests
  test-performance:
    name: Performance Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Setup k6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.48.0/k6-v0.48.0-linux-amd64.tar.gz -L | tar xvz
          sudo cp k6-v0.48.0-linux-amd64/k6 /usr/bin/

      - name: Start application
        run: docker-compose up -d

      - name: Wait for application
        run: npx wait-on http://localhost:4000/health --timeout 60000

      - name: Run k6 load tests
        run: k6 run tests/performance/load-test.js

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  # Security Scan
  security:
    name: Security Scan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'

  # Build Check
  build:
    name: Build Applications
    runs-on: ubuntu-latest
    needs: [lint, test-api, test-web, test-mobile]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build all applications
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            apps/api/dist/
            apps/web/.next/
            apps/mobile/.expo/
```

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:coverage": "turbo run test:coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:performance": "k6 run tests/performance/load-test.js",
    "test:security": "npm audit && snyk test"
  }
}
```

---

## Test Environment Strategy

### Environment Tiers

| Environment | Purpose | Data | Refresh |
|-------------|---------|------|---------|
| **Local** | Developer testing | Synthetic | On demand |
| **CI** | Automated tests | Fresh seed per run | Every run |
| **Staging** | Pre-production testing | Anonymized production copy | Weekly |
| **Production** | Smoke tests only | Real data | N/A |

### Environment Configuration

```typescript
// config/test.config.ts
export const testConfig = {
  local: {
    apiUrl: 'http://localhost:4000',
    webUrl: 'http://localhost:3000',
    databaseUrl: 'postgresql://localhost:5432/fieldsmartpro_test',
  },
  ci: {
    apiUrl: 'http://localhost:4000',
    webUrl: 'http://localhost:3000',
    databaseUrl: process.env.CI_DATABASE_URL,
  },
  staging: {
    apiUrl: 'https://api-staging.fieldsmartpro.com',
    webUrl: 'https://staging.fieldsmartpro.com',
    databaseUrl: process.env.STAGING_DATABASE_URL,
  },
};
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Week 1: Setup & Configuration**
- [ ] Install all testing dependencies
- [ ] Configure Jest for API, Web, Mobile
- [ ] Set up test database (Docker Compose)
- [ ] Create test utilities and helpers
- [ ] Set up code coverage reporting
- [ ] Create GitHub Actions workflow (basic)

**Week 2: First Tests**
- [ ] Write first unit tests for API services (10 tests)
- [ ] Write first integration tests for API endpoints (5 tests)
- [ ] Write first React component tests (5 tests)
- [ ] Set up MSW for API mocking
- [ ] Create test data factories
- [ ] Document testing patterns

### Phase 2: Core Coverage (Weeks 3-6)

**Week 3-4: Backend Testing**
- [ ] Complete API service unit tests (80% coverage)
- [ ] Complete API endpoint integration tests (all endpoints)
- [ ] Database testing (schema, migrations, seeds)
- [ ] AWS Bedrock mock tests
- [ ] VAPI integration tests

**Week 5-6: Frontend Testing**
- [ ] Component tests for all common components
- [ ] Customer management flow tests
- [ ] Job management flow tests
- [ ] Invoice management flow tests
- [ ] Service layer tests
- [ ] Hook tests
- [ ] Context provider tests

### Phase 3: E2E & Advanced Testing (Weeks 7-9)

**Week 7: E2E Setup**
- [ ] Install and configure Playwright
- [ ] Set up test environment (Docker)
- [ ] Create E2E test utilities
- [ ] First E2E test (login flow)

**Week 8: Critical E2E Flows**
- [ ] Authentication flow
- [ ] Customer CRUD flow
- [ ] Job scheduling flow
- [ ] Invoice generation flow
- [ ] AI chat flow

**Week 9: Mobile & Cross-browser**
- [ ] React Native unit tests
- [ ] Detox E2E setup
- [ ] Mobile app critical flows
- [ ] Cross-browser E2E tests
- [ ] Mobile viewport tests

### Phase 4: Performance & Security (Weeks 10-11)

**Week 10: Performance**
- [ ] Set up k6 for load testing
- [ ] API load tests
- [ ] Lighthouse CI configuration
- [ ] Performance benchmarking
- [ ] Performance monitoring setup

**Week 11: Security**
- [ ] Security test suite
- [ ] OWASP ZAP integration
- [ ] Dependency scanning (Snyk)
- [ ] Authentication/authorization tests
- [ ] Multi-tenant isolation tests

### Phase 5: CI/CD & Polish (Week 12)

**Week 12: Integration & Documentation**
- [ ] Complete GitHub Actions workflows
- [ ] Set up test reporting dashboard
- [ ] Code coverage enforcement (80% threshold)
- [ ] Test documentation
- [ ] Team training on testing practices
- [ ] Establish testing guidelines

---

## Test Metrics & Reporting

### Key Metrics to Track

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **Code Coverage** | 80% | 70% |
| **Test Execution Time** | < 5 min (unit/int) | < 10 min |
| **E2E Test Duration** | < 15 min | < 25 min |
| **Test Pass Rate** | 100% | 95% |
| **Flaky Test Rate** | < 1% | < 5% |
| **Bug Escape Rate** | < 5% | < 10% |

### Coverage Requirements by Component

| Component | Unit | Integration | E2E |
|-----------|------|-------------|-----|
| API Services | 85% | 75% | - |
| API Handlers | 80% | 90% | - |
| React Components | 80% | - | Critical flows only |
| Service Layer (Frontend) | 85% | 70% | - |
| Utilities | 90% | - | - |

### Test Reporting Tools

1. **Code Coverage**: Codecov
   - Automated coverage reports on PRs
   - Coverage trending
   - Diff coverage

2. **Test Results**: GitHub Actions + Playwright HTML Reporter
   - Test execution summaries
   - Failure screenshots and videos
   - Trace files for debugging

3. **Performance**: Lighthouse CI + k6 Cloud
   - Performance score trending
   - Load test results
   - Performance budgets

4. **Security**: Snyk Dashboard + OWASP ZAP Reports
   - Vulnerability tracking
   - Dependency monitoring
   - Security score

---

## Best Practices & Guidelines

### Test Writing Guidelines

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **One assertion per test** (when possible)
3. **Clear test names**: `should [expected behavior] when [condition]`
4. **Avoid test interdependencies**: Each test should be independent
5. **Use factories for test data**: Don't hardcode test data
6. **Clean up after tests**: Always teardown properly
7. **Mock external dependencies**: Don't call real APIs in tests
8. **Test behavior, not implementation**: Focus on what, not how

### Code Review Checklist for Tests

- [ ] All new code has corresponding tests
- [ ] Tests are clear and well-named
- [ ] Tests cover happy path and edge cases
- [ ] No flaky tests (tests pass consistently)
- [ ] Tests run quickly (< 100ms for unit tests)
- [ ] No unnecessary test duplication
- [ ] Mocks are used appropriately
- [ ] Test data is generated via factories

### When to Write Which Test

**Unit Test:**
- Pure functions
- Service methods
- Utilities and helpers
- Component rendering
- Component interactions

**Integration Test:**
- API endpoints
- Database operations
- Multiple services working together
- API client with network calls

**E2E Test:**
- Critical user journeys
- Multi-step workflows
- Cross-system interactions
- User-facing features

---

## Appendix

### A. Test File Structure

```
apps/
├── api/
│   ├── src/
│   │   ├── services/
│   │   │   ├── customer.service.ts
│   │   │   └── customer.service.test.ts
│   │   └── handlers/
│   │       ├── customers.ts
│   │       └── customers.test.ts
│   └── tests/
│       ├── integration/
│       │   ├── customer-api.integration.test.ts
│       │   └── job-api.integration.test.ts
│       ├── setup/
│       │   ├── test-setup.ts
│       │   └── test-helpers.ts
│       └── factories/
│           ├── customer.factory.ts
│           └── job.factory.ts
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CustomerForm.tsx
│   │   │   └── CustomerForm.test.tsx
│   │   └── services/
│   │       ├── customerService.ts
│   │       └── customerService.test.ts
│   └── tests/
│       ├── e2e/
│       │   ├── auth.spec.ts
│       │   ├── customers.spec.ts
│       │   └── jobs.spec.ts
│       └── mocks/
│           └── handlers.ts
└── mobile/
    ├── components/
    │   ├── CustomerList.tsx
    │   └── CustomerList.test.tsx
    └── e2e/
        ├── customer-flow.e2e.ts
        └── job-flow.e2e.ts
```

### B. Sample Jest Configuration

```javascript
// apps/api/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### C. Sample Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start:api',
      port: 4000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run start',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

---

## Summary

This QA automation test plan provides a comprehensive roadmap for implementing automated testing across the FieldSmartPro platform. Key highlights:

**Coverage:**
- 80% code coverage target across all applications
- ~129 API integration tests
- ~200+ unit tests (services, components, utilities)
- ~30-40 E2E tests for critical flows
- Performance and security testing

**Technology:**
- Jest for unit/integration testing
- Playwright for E2E testing
- k6 for performance testing
- OWASP ZAP for security testing

**Timeline:**
- 12-week implementation plan
- Phased approach from foundation to advanced testing
- CI/CD integration from week 1

**Outcome:**
- Confident continuous deployment
- 90% reduction in regression bugs
- Faster development cycles
- Better code quality and maintainability

---

**Next Steps:**
1. Review and approve this plan
2. Set up development environment with testing tools
3. Begin Phase 1 implementation
4. Schedule weekly testing progress reviews
