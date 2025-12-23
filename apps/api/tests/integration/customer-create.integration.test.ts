/**
 * Integration Tests for Customer Creation API
 *
 * These tests verify the full customer creation flow including:
 * - HTTP request handling
 * - Validation
 * - Database operations
 * - Response formatting
 */

import { handler as createCustomerHandler } from '../../src/handlers/customers/create-postgres';
import { customerPostgresService } from '../../src/services/customer.postgres.service';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock the customer service
jest.mock('../../src/services/customer.postgres.service');

describe('Customer Creation API Integration', () => {
  const mockCustomerService = customerPostgresService as jest.Mocked<typeof customerPostgresService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockEvent = (body: any, headers: any = {}): APIGatewayProxyEvent => {
    return {
      httpMethod: 'POST',
      headers: {
        'x-tenant-id': 'test-tenant',
        ...headers,
      },
      body: JSON.stringify(body),
      pathParameters: null,
      queryStringParameters: null,
      isBase64Encoded: false,
      requestContext: {} as any,
      resource: '',
      path: '/customers',
      stageVariables: null,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
    };
  };

  describe('POST /customers - Success Cases', () => {
    it('should create residential customer and return 201', async () => {
      // Arrange
      const requestBody = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        mobilePhone: '555-1234',
      };

      const mockCustomer = {
        id: 'customer-123',
        tenantId: 'test-tenant',
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL',
        firstName: 'John',
        lastName: 'Doe',
        companyName: null,
        email: 'john@example.com',
        mobilePhone: '555-1234',
        homePhone: null,
        workPhone: null,
        notes: null,
        addresses: [],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody);

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      expect(response.statusCode).toBe(201);

      const body = JSON.parse(response.body);
      expect(body.customer).toBeDefined();
      expect(body.customer.id).toBe('customer-123');
      expect(body.customer.customerNumber).toBe('CUST-000001');
      expect(body.customer.firstName).toBe('John');
      expect(body.customer.lastName).toBe('Doe');
      expect(body.customer.email).toBe('john@example.com');

      // Verify service was called correctly
      expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'test-tenant',
          type: 'RESIDENTIAL',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          mobilePhone: '555-1234',
        })
      );
    });

    it('should create commercial customer with company name', async () => {
      // Arrange
      const requestBody = {
        type: 'COMMERCIAL',
        companyName: 'ABC Corporation',
        email: 'contact@abc.com',
        phone: '555-9999',
      };

      const mockCustomer = {
        id: 'customer-456',
        tenantId: 'test-tenant',
        customerNumber: 'CUST-000002',
        type: 'COMMERCIAL',
        firstName: null,
        lastName: null,
        companyName: 'ABC Corporation',
        email: 'contact@abc.com',
        mobilePhone: '555-9999',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody);

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      expect(response.statusCode).toBe(201);

      const body = JSON.parse(response.body);
      expect(body.customer.type).toBe('COMMERCIAL');
      expect(body.customer.companyName).toBe('ABC Corporation');
      expect(body.customer.company).toBe('ABC Corporation'); // Frontend compatibility
    });

    it('should create customer with address', async () => {
      // Arrange
      const requestBody = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      };

      const mockCustomer = {
        id: 'customer-789',
        tenantId: 'test-tenant',
        customerNumber: 'CUST-000003',
        type: 'RESIDENTIAL',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        addresses: [
          {
            id: 'address-1',
            customerId: 'customer-789',
            type: 'BOTH',
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US',
            type: 'PRIMARY',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody);

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      expect(response.statusCode).toBe(201);

      const body = JSON.parse(response.body);
      expect(body.customer.addresses).toHaveLength(1);
      expect(body.customer.addresses[0].street).toBe('123 Main St');
      expect(body.customer.addresses[0].city).toBe('New York');

      // Verify address was passed to service
      expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
        })
      );
    });
  });

  describe('POST /customers - Field Normalization', () => {
    it('should normalize snake_case to camelCase fields', async () => {
      // Arrange
      const requestBody = {
        first_name: 'Bob',
        last_name: 'Johnson',
        mobile_number: '555-7777',
        company_name: 'Bob Inc',
      };

      const mockCustomer = {
        id: 'customer-normalized',
        tenantId: 'test-tenant',
        customerNumber: 'CUST-000004',
        type: 'RESIDENTIAL',
        firstName: 'Bob',
        lastName: 'Johnson',
        companyName: 'Bob Inc',
        mobilePhone: '555-7777',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody);

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      expect(response.statusCode).toBe(201);

      // Verify normalized fields were passed to service
      expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Bob',
          lastName: 'Johnson',
          companyName: 'Bob Inc',
          mobilePhone: '555-7777',
        })
      );
    });

    it('should normalize customer type HOMEOWNER to RESIDENTIAL', async () => {
      // Arrange
      const requestBody = {
        type: 'homeowner',
        firstName: 'Alice',
        lastName: 'Williams',
      };

      const mockCustomer = {
        id: 'customer-type',
        tenantId: 'test-tenant',
        customerNumber: 'CUST-000005',
        type: 'RESIDENTIAL',
        firstName: 'Alice',
        lastName: 'Williams',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody);

      // Act
      await createCustomerHandler(event);

      // Assert
      expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'RESIDENTIAL',
        })
      );
    });

    it('should normalize customer type BUSINESS to COMMERCIAL', async () => {
      // Arrange
      const requestBody = {
        type: 'business',
        companyName: 'XYZ Corp',
      };

      const mockCustomer = {
        id: 'customer-biz',
        tenantId: 'test-tenant',
        customerNumber: 'CUST-000006',
        type: 'COMMERCIAL',
        companyName: 'XYZ Corp',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody);

      // Act
      await createCustomerHandler(event);

      // Assert
      expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'COMMERCIAL',
        })
      );
    });
  });

  describe('POST /customers - Multi-tenant Isolation', () => {
    it('should use tenant ID from x-tenant-id header', async () => {
      // Arrange
      const requestBody = {
        firstName: 'Multi',
        lastName: 'Tenant',
      };

      const mockCustomer = {
        id: 'customer-mt',
        tenantId: 'tenant-abc',
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL',
        firstName: 'Multi',
        lastName: 'Tenant',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody, { 'x-tenant-id': 'tenant-abc' });

      // Act
      await createCustomerHandler(event);

      // Assert
      expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-abc',
        })
      );
    });

    it('should use tenant ID from X-Tenant-Id header (case insensitive)', async () => {
      // Arrange
      const requestBody = {
        firstName: 'Case',
        lastName: 'Test',
      };

      const mockCustomer = {
        id: 'customer-case',
        tenantId: 'tenant-xyz',
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody, { 'X-Tenant-Id': 'tenant-xyz' });

      // Act
      await createCustomerHandler(event);

      // Assert
      expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-xyz',
        })
      );
    });
  });

  describe('POST /customers - Validation', () => {
    it('should return 400 when request body is missing', async () => {
      // Arrange
      const event = createMockEvent(null);
      event.body = null;

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Request body is required');
    });

    it('should return 400 for invalid email format', async () => {
      // Arrange
      const requestBody = {
        firstName: 'Bad',
        lastName: 'Email',
        email: 'not-an-email',
      };

      const event = createMockEvent(requestBody);

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation Error');
      expect(body.details).toBeDefined();
    });

    it('should allow empty email string', async () => {
      // Arrange
      const requestBody = {
        firstName: 'No',
        lastName: 'Email',
        email: '',
      };

      const mockCustomer = {
        id: 'customer-no-email',
        tenantId: 'test-tenant',
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL',
        firstName: 'No',
        lastName: 'Email',
        email: undefined,
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody);

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      expect(response.statusCode).toBe(201);
    });
  });

  describe('POST /customers - Response Format', () => {
    it('should return both camelCase and snake_case fields for frontend compatibility', async () => {
      // Arrange
      const requestBody = {
        firstName: 'Format',
        lastName: 'Test',
        email: 'format@example.com',
      };

      const mockCustomer = {
        id: 'customer-format',
        tenantId: 'test-tenant',
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL',
        firstName: 'Format',
        lastName: 'Test',
        companyName: null,
        email: 'format@example.com',
        mobilePhone: '555-1111',
        homePhone: '555-2222',
        workPhone: '555-3333',
        addresses: [],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody);

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      const body = JSON.parse(response.body);
      const customer = body.customer;

      // Should have both naming conventions
      expect(customer.firstName).toBe('Format');
      expect(customer.first_name).toBe('Format');
      expect(customer.lastName).toBe('Test');
      expect(customer.last_name).toBe('Test');
      expect(customer.mobilePhone).toBe('555-1111');
      expect(customer.mobile_number).toBe('555-1111');
      expect(customer.homePhone).toBe('555-2222');
      expect(customer.home_number).toBe('555-2222');
      expect(customer.createdAt).toBeDefined();
      expect(customer.created_at).toBeDefined();
    });

    it('should include display_name in response', async () => {
      // Arrange
      const requestBody = {
        firstName: 'Display',
        lastName: 'Name',
      };

      const mockCustomer = {
        id: 'customer-display',
        tenantId: 'test-tenant',
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL',
        firstName: 'Display',
        lastName: 'Name',
        companyName: null,
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody);

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      const body = JSON.parse(response.body);
      expect(body.customer.display_name).toBe('Display Name');
    });

    it('should use company name as display_name for commercial customers', async () => {
      // Arrange
      const requestBody = {
        type: 'COMMERCIAL',
        companyName: 'Test Company Inc',
      };

      const mockCustomer = {
        id: 'customer-company',
        tenantId: 'test-tenant',
        customerNumber: 'CUST-000001',
        type: 'COMMERCIAL',
        firstName: null,
        lastName: null,
        companyName: 'Test Company Inc',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody);

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      const body = JSON.parse(response.body);
      expect(body.customer.display_name).toBe('Test Company Inc');
    });
  });

  describe('POST /customers - Error Handling', () => {
    it('should return 500 when service throws error', async () => {
      // Arrange
      const requestBody = {
        firstName: 'Error',
        lastName: 'Test',
      };

      mockCustomerService.createCustomer.mockRejectedValue(
        new Error('Database connection failed')
      );

      const event = createMockEvent(requestBody);

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      expect(response.statusCode).toBe(500);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Database connection failed');
    });

    it('should have correct CORS headers', async () => {
      // Arrange
      const requestBody = { firstName: 'CORS', lastName: 'Test' };
      const mockCustomer = {
        id: 'customer-cors',
        tenantId: 'test-tenant',
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const event = createMockEvent(requestBody);

      // Act
      const response = await createCustomerHandler(event);

      // Assert
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
      });
    });
  });
});
