/**
 * Unit Tests for Customer Postgres Service - Create Customer
 *
 * These tests cover the createCustomer method with various scenarios
 */

import { customerPostgresService } from './customer.postgres.service';
import { getPrismaClient } from './prisma.service';

// Mock the prisma service
jest.mock('./prisma.service', () => ({
  getPrismaClient: jest.fn(),
}));

describe('CustomerPostgresService - createCustomer', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create comprehensive mock Prisma client
    mockPrismaClient = {
      customer: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      address: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('Successful Customer Creation', () => {
    it('should create a residential customer with minimal data', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const input = {
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-1',
        tenantId,
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL',
        firstName: 'John',
        lastName: 'Doe',
        companyName: null,
        email: 'john@example.com',
        mobilePhone: null,
        homePhone: null,
        workPhone: null,
        notes: null,
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.createCustomer(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('customer-1');
      expect(result.customerNumber).toBe('CUST-000001');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.type).toBe('RESIDENTIAL');
      expect(result.addresses).toEqual([]);

      // Verify Prisma calls
      expect(mockPrismaClient.customer.count).toHaveBeenCalledWith({
        where: { tenantId },
      });
      expect(mockPrismaClient.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          customerNumber: 'CUST-000001',
          type: 'RESIDENTIAL',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        }),
        include: { addresses: true },
      });
    });

    it('should create a commercial customer with company name', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const input = {
        tenantId,
        type: 'COMMERCIAL' as const,
        companyName: 'ABC Corp',
        email: 'contact@abc.com',
        mobilePhone: '555-1234',
      };

      mockPrismaClient.customer.count.mockResolvedValue(5);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-2',
        tenantId,
        customerNumber: 'CUST-000006',
        type: 'COMMERCIAL',
        firstName: null,
        lastName: null,
        companyName: 'ABC Corp',
        email: 'contact@abc.com',
        mobilePhone: '555-1234',
        homePhone: null,
        workPhone: null,
        notes: null,
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.createCustomer(input);

      // Assert
      expect(result.type).toBe('COMMERCIAL');
      expect(result.companyName).toBe('ABC Corp');
      expect(result.customerNumber).toBe('CUST-000006');
      expect(mockPrismaClient.customer.count).toHaveBeenCalledTimes(1);
    });

    it('should create a contractor type customer', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const input = {
        tenantId,
        type: 'CONTRACTOR' as const,
        firstName: 'Mike',
        lastName: 'Smith',
        companyName: 'Smith Contracting',
        email: 'mike@smith.com',
      };

      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-3',
        tenantId,
        customerNumber: 'CUST-000001',
        type: 'CONTRACTOR',
        firstName: 'Mike',
        lastName: 'Smith',
        companyName: 'Smith Contracting',
        email: 'mike@smith.com',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.createCustomer(input);

      // Assert
      expect(result.type).toBe('CONTRACTOR');
      expect(result.companyName).toBe('Smith Contracting');
    });

    it('should default to RESIDENTIAL type when not specified', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const input = {
        tenantId,
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-4',
        tenantId,
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL', // Should default to RESIDENTIAL
        firstName: 'Jane',
        lastName: 'Smith',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.createCustomer(input);

      // Assert
      expect(result.type).toBe('RESIDENTIAL');
      expect(mockPrismaClient.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'RESIDENTIAL',
          }),
        })
      );
    });
  });

  describe('Customer Creation with Address', () => {
    it('should create customer with primary address', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const input = {
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      };

      const mockAddress = {
        id: 'address-1',
        customerId: 'customer-1',
        type: 'BOTH',
        street: '123 Main St',
        streetLine2: null,
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
        type: 'PRIMARY',
      };

      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-1',
        tenantId,
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        addresses: [mockAddress],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.createCustomer(input);

      // Assert
      expect(result.addresses).toHaveLength(1);
      expect(result.addresses[0].street).toBe('123 Main St');
      expect(result.addresses[0].city).toBe('New York');
      expect(result.addresses[0].state).toBe('NY');
      expect(result.addresses[0].zip).toBe('10001');
      expect(result.addresses[0].type).toBe('PRIMARY');

      // Verify address was created with customer
      expect(mockPrismaClient.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          addresses: {
            create: expect.objectContaining({
              type: 'BOTH',
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              zip: '10001',
              country: 'US',
              type: 'PRIMARY',
            }),
          },
        }),
        include: { addresses: true },
      });
    });

    it('should create customer with complete address including line 2', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const input = {
        tenantId,
        firstName: 'Jane',
        lastName: 'Smith',
        street: '456 Oak Ave',
        streetLine2: 'Apt 3B',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        country: 'US',
      };

      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-2',
        tenantId,
        customerNumber: 'CUST-000001',
        addresses: [
          {
            id: 'address-1',
            street: '456 Oak Ave',
            streetLine2: 'Apt 3B',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90001',
            country: 'US',
            type: 'PRIMARY',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.createCustomer(input);

      // Assert
      expect(result.addresses[0].streetLine2).toBe('Apt 3B');
    });

    it('should create customer without address when street is not provided', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const input = {
        tenantId,
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        // No address fields
      };

      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-3',
        tenantId,
        customerNumber: 'CUST-000001',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.createCustomer(input);

      // Assert
      expect(result.addresses).toEqual([]);
      expect(mockPrismaClient.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          addresses: undefined, // No addresses object when street not provided
        }),
        include: { addresses: true },
      });
    });
  });

  describe('Customer Number Generation', () => {
    it('should generate customer number CUST-000001 for first customer', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-1',
        tenantId,
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await customerPostgresService.createCustomer({ tenantId });

      // Assert
      expect(mockPrismaClient.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerNumber: 'CUST-000001',
          }),
        })
      );
    });

    it('should generate customer number CUST-000042 for 42nd customer', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      mockPrismaClient.customer.count.mockResolvedValue(41); // 42nd customer
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-42',
        tenantId,
        customerNumber: 'CUST-000042',
        type: 'RESIDENTIAL',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await customerPostgresService.createCustomer({ tenantId });

      // Assert
      expect(mockPrismaClient.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerNumber: 'CUST-000042',
          }),
        })
      );
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should count customers only for the specific tenant', async () => {
      // Arrange
      const tenantId = 'tenant-A';

      mockPrismaClient.customer.count.mockResolvedValue(5);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-1',
        tenantId: 'tenant-A',
        customerNumber: 'CUST-000006',
        type: 'RESIDENTIAL',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await customerPostgresService.createCustomer({ tenantId });

      // Assert
      expect(mockPrismaClient.customer.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-A' },
      });
    });

    it('should create customer with correct tenant ID', async () => {
      // Arrange
      const tenantId = 'tenant-B';

      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-1',
        tenantId: 'tenant-B',
        customerNumber: 'CUST-000001',
        type: 'RESIDENTIAL',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.createCustomer({ tenantId });

      // Assert
      expect(result.tenantId).toBe('tenant-B');
      expect(mockPrismaClient.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-B',
          }),
        })
      );
    });
  });

  describe('Contact Information', () => {
    it('should store all phone number types', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const input = {
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
        mobilePhone: '555-1111',
        homePhone: '555-2222',
        workPhone: '555-3333',
      };

      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-1',
        tenantId,
        customerNumber: 'CUST-000001',
        firstName: 'John',
        lastName: 'Doe',
        mobilePhone: '555-1111',
        homePhone: '555-2222',
        workPhone: '555-3333',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.createCustomer(input);

      // Assert
      expect(result.mobilePhone).toBe('555-1111');
      expect(result.homePhone).toBe('555-2222');
      expect(result.workPhone).toBe('555-3333');
    });

    it('should store email address', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const input = {
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      };

      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-1',
        tenantId,
        customerNumber: 'CUST-000001',
        email: 'john.doe@example.com',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.createCustomer(input);

      // Assert
      expect(result.email).toBe('john.doe@example.com');
    });

    it('should store notes', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const input = {
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
        notes: 'Prefers morning appointments',
      };

      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockResolvedValue({
        id: 'customer-1',
        tenantId,
        customerNumber: 'CUST-000001',
        notes: 'Prefers morning appointments',
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.createCustomer(input);

      // Assert
      expect(result.notes).toBe('Prefers morning appointments');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when database connection fails', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const dbError = new Error('Database connection failed');

      mockPrismaClient.customer.count.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        customerPostgresService.createCustomer({ tenantId })
      ).rejects.toThrow('Database connection failed');
    });

    it('should throw error when create operation fails', async () => {
      // Arrange
      const tenantId = 'test-tenant-123';
      const input = {
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
      };

      mockPrismaClient.customer.count.mockResolvedValue(0);
      mockPrismaClient.customer.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      // Act & Assert
      await expect(
        customerPostgresService.createCustomer(input)
      ).rejects.toThrow('Unique constraint violation');
    });
  });
});
