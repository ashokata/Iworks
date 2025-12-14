# Testing Infrastructure - FieldSmartPro

## Overview

This monorepo now has a complete automated testing infrastructure set up for both the API and Web applications. **All existing code remains unchanged** - we've only added new test files and configurations.

## What's Been Added

### ✅ Testing Dependencies Installed

#### API (`apps/api`)
- Jest 29.7.0 (test framework)
- Supertest 6.3.4 (HTTP testing)
- ts-jest 29.1.2 (TypeScript support)
- aws-sdk-client-mock 3.0.1 (AWS service mocking)

#### Web (`apps/web`)
- Jest 29.7.0 (test framework)
- React Testing Library 14.1.2 (component testing)
- jest-environment-jsdom 29.7.0 (DOM environment)

### ✅ Configuration Files Created

```
fieldsmartpro-monorepo/
├── apps/
│   ├── api/
│   │   ├── jest.config.js                    # Jest configuration
│   │   ├── .env.test.example                 # Test environment variables
│   │   ├── tests/
│   │   │   ├── setup/
│   │   │   │   ├── jest.setup.ts            # Test setup
│   │   │   │   └── test-helpers.ts          # Test utilities
│   │   │   └── factories/
│   │   │       └── customer.factory.ts      # Test data factory
│   │   └── src/
│   │       └── services/
│   │           └── customer.postgres.service.test.ts  # Example test
│   │
│   └── web/
│       ├── jest.config.js                    # Jest configuration
│       ├── jest.setup.js                     # Test setup
│       ├── __mocks__/
│       │   ├── fileMock.js                   # File mock
│       │   └── styleMock.js                  # Style mock
│       ├── tests/
│       │   └── test-utils.tsx                # React test utilities
│       └── src/
│           └── components/
│               └── ui/
│                   └── Button.test.tsx        # Example test
│
├── docker-compose.test.yml                    # Test database
├── .github/
│   └── workflows/
│       └── ci.yml                             # GitHub Actions CI
│
└── docs/
    ├── QA_AUTOMATION_TEST_PLAN.md            # Full test plan
    └── TESTING_QUICK_START.md                # Quick start guide
```

### ✅ Test Infrastructure

1. **Test Database** (Docker Compose)
   - PostgreSQL 15 on port 5433
   - Isolated from development database
   - Easy to start/stop with docker-compose

2. **GitHub Actions CI**
   - Runs on every push and pull request
   - Tests API and Web applications
   - Generates coverage reports
   - Build verification

3. **Example Tests**
   - API service unit test with mocking
   - React component test (Button component)
   - Test patterns and best practices

---

## Quick Start

### 1. Install Dependencies

```bash
# From monorepo root
npm install
```

### 2. Start Test Database

```bash
# Start PostgreSQL test database
docker-compose -f docker-compose.test.yml up -d

# Verify it's running
docker ps | grep fieldsmartpro-test-db
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run API tests only
npm run test --workspace=@fieldsmartpro/api

# Run Web tests only
npm run test --workspace=@fieldsmartpro/web

# Run with coverage
npm run test:coverage --workspace=@fieldsmartpro/api
```

### 4. View Example Tests

Check out these example tests to understand the patterns:

- **API Test**: `apps/api/src/services/customer.postgres.service.test.ts`
- **Web Test**: `apps/web/src/components/ui/Button.test.tsx`

---

## Test Scripts

### API Tests

```bash
cd apps/api

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- customer.postgres.service.test.ts
```

### Web Tests

```bash
cd apps/web

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- Button.test.tsx
```

---

## Test Coverage Goals

| Application | Current | Target |
|-------------|---------|--------|
| API | 0% → | 80% |
| Web | 0% → | 80% |

Coverage thresholds are enforced in Jest config:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

---

## CI/CD Integration

Tests run automatically via GitHub Actions on:
- Every push to `main`, `develop`, `customers-dynamodb`
- Every pull request to `main` or `develop`

The CI pipeline:
1. ✅ Lints code (if configured)
2. ✅ Runs API unit tests
3. ✅ Runs Web component tests
4. ✅ Builds all applications
5. ✅ Uploads coverage reports (to Codecov, if configured)

View workflow: `.github/workflows/ci.yml`

---

## Documentation

📖 **Full Test Plan**: `docs/QA_AUTOMATION_TEST_PLAN.md`
- Comprehensive testing strategy
- Test types: Unit, Integration, E2E
- Performance and security testing
- 12-week implementation roadmap
- Test patterns and best practices

📖 **Quick Start Guide**: `docs/TESTING_QUICK_START.md`
- Step-by-step setup instructions
- Writing your first test
- Troubleshooting guide
- Best practices

---

## What's NOT Changed

✅ **No existing code has been modified**
✅ **All functionality remains the same**
✅ **No breaking changes**

We've only added:
- New dev dependencies in package.json
- New test configuration files
- New test files (*.test.ts, *.test.tsx)
- New testing utilities
- New documentation

---

## Next Steps

### Immediate (This Week)
1. ✅ Review the test plan: `docs/QA_AUTOMATION_TEST_PLAN.md`
2. ✅ Run the example tests to verify setup
3. ✅ Install dependencies: `npm install`
4. ✅ Start test database: `docker-compose -f docker-compose.test.yml up -d`
5. ✅ Run tests: `npm test`

### Short Term (Next 2 Weeks)
1. Write unit tests for critical API services
2. Write component tests for key UI components
3. Set up Prisma migrations for test database
4. Add integration tests for main API endpoints

### Medium Term (Next Month)
1. Achieve 50%+ code coverage
2. Add E2E tests with Playwright
3. Set up performance testing with k6
4. Configure security scanning

---

## Troubleshooting

### Tests Won't Run

```bash
# Make sure dependencies are installed
npm install

# Make sure Prisma client is generated
cd apps/api
npm run generate
```

### Database Connection Errors

```bash
# Verify test database is running
docker ps | grep fieldsmartpro-test-db

# Restart if needed
docker-compose -f docker-compose.test.yml down
docker-compose -f docker-compose.test.yml up -d
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules apps/*/node_modules
npm install
```

For more troubleshooting, see: `docs/TESTING_QUICK_START.md`

---

## Test Examples

### Example 1: Unit Test (API Service)

```typescript
// apps/api/src/services/example.service.test.ts
describe('ExampleService', () => {
  it('should return data', async () => {
    // Arrange
    const mockData = { id: '1', name: 'Test' };

    // Act
    const result = await service.getData();

    // Assert
    expect(result).toEqual(mockData);
  });
});
```

### Example 2: Component Test (React)

```typescript
// apps/web/src/components/Example.test.tsx
describe('ExampleComponent', () => {
  it('should render text', () => {
    render(<Example text="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## Resources

- **Jest**: https://jestjs.io/
- **React Testing Library**: https://testing-library.com/react
- **Supertest**: https://github.com/visionmedia/supertest
- **Prisma Testing**: https://www.prisma.io/docs/guides/testing

---

## Support

If you encounter any issues:
1. Check `docs/TESTING_QUICK_START.md` troubleshooting section
2. Review example tests for patterns
3. Check CI logs in GitHub Actions
4. Verify test database is running

---

**Status**: ✅ Phase 1 Complete - Testing infrastructure is set up and ready to use!

**Next Phase**: Start writing tests for your critical features following the patterns in the example tests.

Happy Testing! 🧪
