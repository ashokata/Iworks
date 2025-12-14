# Testing Quick Start Guide

This guide will help you get started with automated testing in the FieldSmartPro monorepo.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running Tests](#running-tests)
4. [Writing Your First Test](#writing-your-first-test)
5. [Test Database Setup](#test-database-setup)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 20.x or higher
- Docker Desktop (for test database)
- Git

## Installation

### 1. Install Dependencies

From the monorepo root:

```bash
# Install all dependencies including testing packages
npm install
```

This will install:
- **API**: Jest, Supertest, ts-jest, aws-sdk-client-mock
- **Web**: Jest, React Testing Library, jest-environment-jsdom

### 2. Start Test Database

Start the PostgreSQL test database using Docker Compose:

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Verify it's running
docker ps | grep fieldsmartpro-test-db
```

The test database will be available at:
- **Host**: localhost
- **Port**: 5433
- **Database**: fieldsmartpro_test
- **User**: test
- **Password**: test

### 3. Set Up Environment Variables

For API tests:

```bash
cd apps/api
cp .env.test.example .env.test
```

The `.env.test` file contains:
```env
DATABASE_URL="postgresql://test:test@localhost:5433/fieldsmartpro_test"
NODE_ENV=test
```

---

## Running Tests

### Run All Tests

```bash
# From monorepo root - runs all tests in all apps
npm test
```

### Run Tests for Specific Application

```bash
# API tests only
npm run test --workspace=@fieldsmartpro/api

# Web tests only
npm run test --workspace=@fieldsmartpro/web
```

### Run Tests in Watch Mode

```bash
# API tests in watch mode
cd apps/api
npm run test:watch

# Web tests in watch mode
cd apps/web
npm run test:watch
```

### Run Tests with Coverage

```bash
# API tests with coverage
npm run test:coverage --workspace=@fieldsmartpro/api

# Web tests with coverage
npm run test:coverage --workspace=@fieldsmartpro/web
```

Coverage reports will be generated in:
- `apps/api/coverage/`
- `apps/web/coverage/`

Open `coverage/lcov-report/index.html` in your browser to view detailed coverage reports.

---

## Writing Your First Test

### Example 1: API Service Unit Test

Create a test file next to your service:

**File**: `apps/api/src/services/example.service.test.ts`

```typescript
import { getPrismaClient } from './prisma.service';

// Mock Prisma
jest.mock('./prisma.service', () => ({
  getPrismaClient: jest.fn(),
}));

describe('ExampleService', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrismaClient = {
      customer: {
        findMany: jest.fn(),
      },
    };

    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  it('should fetch customers', async () => {
    // Arrange
    const mockCustomers = [
      { id: '1', name: 'Customer 1' },
      { id: '2', name: 'Customer 2' },
    ];
    mockPrismaClient.customer.findMany.mockResolvedValue(mockCustomers);

    // Act
    const prisma = getPrismaClient();
    const result = await prisma.customer.findMany();

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Customer 1');
  });
});
```

Run the test:
```bash
cd apps/api
npm test -- example.service.test.ts
```

### Example 2: React Component Test

Create a test file next to your component:

**File**: `apps/web/src/components/MyComponent.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render with text', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle button click', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

Run the test:
```bash
cd apps/web
npm test -- MyComponent.test.tsx
```

### Example 3: API Integration Test

**File**: `apps/api/tests/integration/customers.integration.test.ts`

```typescript
import request from 'supertest';
import express from 'express';

describe('Customer API Integration', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Set up your Express app
    app = express();
    // ... configure routes
  });

  it('should create a customer', async () => {
    const response = await request(app)
      .post('/customers')
      .set('X-Tenant-ID', 'test-tenant')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

    expect(response.status).toBe(201);
    expect(response.body.firstName).toBe('John');
  });
});
```

---

## Test Database Setup

### Running Migrations

Before running integration tests, apply Prisma migrations:

```bash
cd apps/api

# Set the test database URL
export DATABASE_URL="postgresql://test:test@localhost:5433/fieldsmartpro_test"

# Run migrations
npm run migrate
```

### Seeding Test Data

```bash
# Seed the test database
npm run seed
```

### Cleaning Test Database

To reset the test database between test runs:

```typescript
// In your test file
import { cleanupDatabase } from '../setup/test-helpers';

afterEach(async () => {
  await cleanupDatabase(prisma);
});
```

---

## Best Practices

### 1. Test File Naming

- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.ts`

Place test files:
- **Co-located**: Next to the file being tested (recommended for unit tests)
- **Separate directory**: In `tests/` folder (recommended for integration tests)

### 2. Test Structure (AAA Pattern)

Always follow the Arrange-Act-Assert pattern:

```typescript
it('should do something', () => {
  // Arrange: Set up test data and mocks
  const input = { value: 42 };

  // Act: Execute the function
  const result = myFunction(input);

  // Assert: Verify the outcome
  expect(result).toBe(84);
});
```

### 3. Test Isolation

Each test should be independent:

```typescript
describe('MyService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupDatabase(prisma);
  });
});
```

### 4. Descriptive Test Names

Use clear, descriptive test names:

```typescript
// Good ✅
it('should return 404 when customer does not exist', () => {});

// Bad ❌
it('test customer', () => {});
```

### 5. Mock External Dependencies

Always mock external services:

```typescript
// Mock AWS Bedrock
jest.mock('@aws-sdk/client-bedrock-runtime');

// Mock API calls
jest.mock('axios');
```

### 6. Use Test Factories

Use factories for creating test data:

```typescript
import { CustomerFactory } from '../factories/customer.factory';

const customer = CustomerFactory.build({
  type: 'COMMERCIAL',
});
```

---

## Troubleshooting

### Issue: "Cannot find module" errors

**Solution**: Make sure you've installed all dependencies:
```bash
npm install
```

### Issue: Database connection errors

**Solution**: Verify test database is running:
```bash
docker ps | grep fieldsmartpro-test-db

# If not running, start it:
docker-compose -f docker-compose.test.yml up -d
```

### Issue: Prisma client not generated

**Solution**: Generate Prisma client:
```bash
cd apps/api
npm run generate
```

### Issue: Tests timing out

**Solution**: Increase Jest timeout in test file:
```typescript
jest.setTimeout(10000); // 10 seconds
```

### Issue: Coverage not generated

**Solution**: Run tests with coverage flag:
```bash
npm run test:coverage
```

### Issue: Port 5433 already in use

**Solution**: Stop the existing PostgreSQL container:
```bash
docker stop fieldsmartpro-test-db
docker rm fieldsmartpro-test-db
docker-compose -f docker-compose.test.yml up -d
```

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

## Next Steps

1. **Read the full test plan**: See `docs/QA_AUTOMATION_TEST_PLAN.md`
2. **Write tests for critical features**: Start with authentication, customer CRUD
3. **Set up pre-commit hooks**: Run tests before committing
4. **Configure CI/CD**: Tests run automatically on every push (already configured!)

---

## Quick Reference

```bash
# Install dependencies
npm install

# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run all tests
npm test

# Run specific app tests
npm test --workspace=@fieldsmartpro/api
npm test --workspace=@fieldsmartpro/web

# Run with coverage
npm run test:coverage --workspace=@fieldsmartpro/api

# Watch mode
cd apps/api && npm run test:watch

# Stop test database
docker-compose -f docker-compose.test.yml down
```

Happy testing! 🧪✅
