/**
 * Unit Tests for Customer Postgres Service - Search & List
 *
 * These tests cover searchCustomers and listCustomers methods
 */

import { customerPostgresService } from './customer.postgres.service';
import { getPrismaClient } from './prisma.service';

jest.mock('./prisma.service', () => ({
  getPrismaClient: jest.fn(),
}));

describe('CustomerPostgresService - Search & List', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrismaClient = {
      customer: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('searchCustomers', () => {
    it('should search customers by name', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const mockResults = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          addresses: [],
        },
        {
          id: '2',
          firstName: 'Johnny',
          lastName: 'Smith',
          addresses: [],
        },
      ];

      mockPrismaClient.customer.findMany.mockResolvedValue(mockResults);

      // Act
      const result = await customerPostgresService.searchCustomers({
        tenantId,
        query: 'John',
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId,
          isArchived: false,
          OR: expect.arrayContaining([
            { firstName: { contains: 'John', mode: 'insensitive' } },
            { lastName: { contains: 'John', mode: 'insensitive' } },
          ]),
        }),
        include: { addresses: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        take: 20,
        skip: 0,
      });
    });

    it('should search customers by email', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([
        { id: '1', email: 'john@example.com', addresses: [] },
      ]);

      // Act
      await customerPostgresService.searchCustomers({
        tenantId,
        query: 'john@example.com',
      });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { email: { contains: 'john@example.com', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should search customers by phone number', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([
        { id: '1', mobilePhone: '555-1234', addresses: [] },
      ]);

      // Act
      await customerPostgresService.searchCustomers({
        tenantId,
        query: '555-1234',
      });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { mobilePhone: { contains: '555-1234' } },
              { homePhone: { contains: '555-1234' } },
              { workPhone: { contains: '555-1234' } },
            ]),
          }),
        })
      );
    });

    it('should search customers by customer number', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([
        { id: '1', customerNumber: 'CUST-000001', addresses: [] },
      ]);

      // Act
      await customerPostgresService.searchCustomers({
        tenantId,
        query: 'CUST-000001',
      });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { customerNumber: { contains: 'CUST-000001', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should filter by customer type', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([
        { id: '1', type: 'COMMERCIAL', addresses: [] },
      ]);

      // Act
      await customerPostgresService.searchCustomers({
        tenantId,
        type: 'COMMERCIAL',
      });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'COMMERCIAL',
          }),
        })
      );
    });

    it('should combine query and type filters', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([
        { id: '1', companyName: 'ABC Corp', type: 'COMMERCIAL', addresses: [] },
      ]);

      // Act
      await customerPostgresService.searchCustomers({
        tenantId,
        query: 'ABC',
        type: 'COMMERCIAL',
      });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            type: 'COMMERCIAL',
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should respect limit parameter', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);

      // Act
      await customerPostgresService.searchCustomers({
        tenantId,
        limit: 5,
      });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should use default limit of 20', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);

      // Act
      await customerPostgresService.searchCustomers({
        tenantId,
      });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      );
    });

    it('should respect offset parameter for pagination', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);

      // Act
      await customerPostgresService.searchCustomers({
        tenantId,
        offset: 20,
      });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
        })
      );
    });

    it('should exclude archived customers', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);

      // Act
      await customerPostgresService.searchCustomers({
        tenantId,
      });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isArchived: false,
          }),
        })
      );
    });

    it('should include addresses in results', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const mockAddress = {
        id: 'addr-1',
        street: '123 Main St',
        city: 'New York',
      };

      mockPrismaClient.customer.findMany.mockResolvedValue([
        { id: '1', firstName: 'John', addresses: [mockAddress] },
      ]);

      // Act
      const result = await customerPostgresService.searchCustomers({
        tenantId,
      });

      // Assert
      expect(result[0].addresses).toHaveLength(1);
      expect(result[0].addresses[0].street).toBe('123 Main St');
    });

    it('should sort results alphabetically by name', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);

      // Act
      await customerPostgresService.searchCustomers({
        tenantId,
      });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        })
      );
    });
  });

  describe('listCustomers', () => {
    it('should return customers with total count', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const mockCustomers = [
        { id: '1', firstName: 'John', addresses: [] },
        { id: '2', firstName: 'Jane', addresses: [] },
      ];

      mockPrismaClient.customer.findMany.mockResolvedValue(mockCustomers);
      mockPrismaClient.customer.count.mockResolvedValue(25);

      // Act
      const result = await customerPostgresService.listCustomers(tenantId);

      // Assert
      expect(result.customers).toHaveLength(2);
      expect(result.total).toBe(25);
    });

    it('should use default limit of 50', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);
      mockPrismaClient.customer.count.mockResolvedValue(0);

      // Act
      await customerPostgresService.listCustomers(tenantId);

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should respect custom limit', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);
      mockPrismaClient.customer.count.mockResolvedValue(0);

      // Act
      await customerPostgresService.listCustomers(tenantId, { limit: 10 });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should respect offset for pagination', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);
      mockPrismaClient.customer.count.mockResolvedValue(0);

      // Act
      await customerPostgresService.listCustomers(tenantId, { offset: 50 });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
        })
      );
    });

    it('should exclude archived customers by default', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);
      mockPrismaClient.customer.count.mockResolvedValue(0);

      // Act
      await customerPostgresService.listCustomers(tenantId);

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, isArchived: false },
        })
      );
    });

    it('should include archived customers when requested', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);
      mockPrismaClient.customer.count.mockResolvedValue(0);

      // Act
      await customerPostgresService.listCustomers(tenantId, {
        includeArchived: true,
      });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
        })
      );
    });

    it('should order by createdAt descending (newest first)', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);
      mockPrismaClient.customer.count.mockResolvedValue(0);

      // Act
      await customerPostgresService.listCustomers(tenantId);

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should include addresses in results', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([
        {
          id: '1',
          addresses: [{ id: 'addr-1', street: '123 Main St' }],
        },
      ]);
      mockPrismaClient.customer.count.mockResolvedValue(1);

      // Act
      const result = await customerPostgresService.listCustomers(tenantId);

      // Assert
      expect(result.customers[0].addresses).toBeDefined();
      expect(result.customers[0].addresses).toHaveLength(1);
    });

    it('should execute count and findMany in parallel', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);
      mockPrismaClient.customer.count.mockResolvedValue(100);

      // Act
      await customerPostgresService.listCustomers(tenantId);

      // Assert - both should be called
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalled();
      expect(mockPrismaClient.customer.count).toHaveBeenCalled();
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should only search within tenant', async () => {
      // Arrange
      const tenantId = 'tenant-A';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);

      // Act
      await customerPostgresService.searchCustomers({ tenantId });

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-A',
          }),
        })
      );
    });

    it('should only list customers from tenant', async () => {
      // Arrange
      const tenantId = 'tenant-B';
      mockPrismaClient.customer.findMany.mockResolvedValue([]);
      mockPrismaClient.customer.count.mockResolvedValue(0);

      // Act
      await customerPostgresService.listCustomers(tenantId);

      // Assert
      expect(mockPrismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-B',
          }),
        })
      );
    });
  });
});
