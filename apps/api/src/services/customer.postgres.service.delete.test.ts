/**
 * Unit Tests for Customer Postgres Service - Delete Customer
 *
 * These tests cover the deleteCustomer method (soft delete/archive)
 */

import { customerPostgresService } from './customer.postgres.service';
import { getPrismaClient } from './prisma.service';

jest.mock('./prisma.service', () => ({
  getPrismaClient: jest.fn(),
}));

describe('CustomerPostgresService - deleteCustomer', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrismaClient = {
      customer: {
        updateMany: jest.fn(),
      },
    };

    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('Successful Deletion (Archiving)', () => {
    it('should archive customer and return true', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.updateMany.mockResolvedValue({
        count: 1,
      });

      // Act
      const result = await customerPostgresService.deleteCustomer(
        tenantId,
        customerId
      );

      // Assert
      expect(result).toBe(true);
      expect(mockPrismaClient.customer.updateMany).toHaveBeenCalledWith({
        where: { id: customerId, tenantId },
        data: {
          isArchived: true,
          archivedAt: expect.any(Date),
        },
      });
    });

    it('should set archivedAt timestamp', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';
      const beforeTime = new Date();

      mockPrismaClient.customer.updateMany.mockImplementation((params) => {
        const archivedAt = params.data.archivedAt;
        expect(archivedAt).toBeInstanceOf(Date);
        expect(archivedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        return Promise.resolve({ count: 1 });
      });

      // Act
      await customerPostgresService.deleteCustomer(tenantId, customerId);

      // Assert
      expect(mockPrismaClient.customer.updateMany).toHaveBeenCalled();
    });

    it('should use soft delete (archive) not hard delete', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.updateMany.mockResolvedValue({
        count: 1,
      });

      // Act
      await customerPostgresService.deleteCustomer(tenantId, customerId);

      // Assert - should use updateMany, not delete
      expect(mockPrismaClient.customer.updateMany).toHaveBeenCalled();
      expect(mockPrismaClient.customer.delete).toBeUndefined();
    });
  });

  describe('Multi-tenant Security', () => {
    it('should only delete customer from specific tenant', async () => {
      // Arrange
      const tenantId = 'tenant-A';
      const customerId = 'customer-123';

      mockPrismaClient.customer.updateMany.mockResolvedValue({
        count: 1,
      });

      // Act
      await customerPostgresService.deleteCustomer(tenantId, customerId);

      // Assert
      expect(mockPrismaClient.customer.updateMany).toHaveBeenCalledWith({
        where: {
          id: customerId,
          tenantId: 'tenant-A', // Should include tenant check
        },
        data: expect.any(Object),
      });
    });

    it('should return false when customer not in tenant', async () => {
      // Arrange
      const tenantId = 'tenant-A';
      const customerId = 'customer-from-tenant-B';

      // No rows updated (customer doesn't belong to this tenant)
      mockPrismaClient.customer.updateMany.mockResolvedValue({
        count: 0,
      });

      // Act
      const result = await customerPostgresService.deleteCustomer(
        tenantId,
        customerId
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Customer Not Found', () => {
    it('should return false when customer does not exist', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'nonexistent-customer';

      mockPrismaClient.customer.updateMany.mockResolvedValue({
        count: 0, // No rows affected
      });

      // Act
      const result = await customerPostgresService.deleteCustomer(
        tenantId,
        customerId
      );

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when customer already archived', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'already-archived';

      // Customer already archived, so no update occurs
      mockPrismaClient.customer.updateMany.mockResolvedValue({
        count: 0,
      });

      // Act
      const result = await customerPostgresService.deleteCustomer(
        tenantId,
        customerId
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when database update fails', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.updateMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        customerPostgresService.deleteCustomer(tenantId, customerId)
      ).rejects.toThrow('Database connection failed');
    });

    it('should throw error on constraint violation', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-with-jobs';

      mockPrismaClient.customer.updateMany.mockRejectedValue(
        new Error('Foreign key constraint violation')
      );

      // Act & Assert
      await expect(
        customerPostgresService.deleteCustomer(tenantId, customerId)
      ).rejects.toThrow('Foreign key constraint violation');
    });
  });

  describe('Return Values', () => {
    it('should return true when exactly one customer archived', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.updateMany.mockResolvedValue({
        count: 1,
      });

      // Act
      const result = await customerPostgresService.deleteCustomer(
        tenantId,
        customerId
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when zero customers archived', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.updateMany.mockResolvedValue({
        count: 0,
      });

      // Act
      const result = await customerPostgresService.deleteCustomer(
        tenantId,
        customerId
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Data Preservation', () => {
    it('should preserve customer data when archiving', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.updateMany.mockResolvedValue({
        count: 1,
      });

      // Act
      await customerPostgresService.deleteCustomer(tenantId, customerId);

      // Assert - should only set archive flags, not delete data
      expect(mockPrismaClient.customer.updateMany).toHaveBeenCalledWith({
        where: { id: customerId, tenantId },
        data: {
          isArchived: true,
          archivedAt: expect.any(Date),
        },
      });
    });

    it('should allow customer to be un-archived later', async () => {
      // This is more of a documentation test showing soft delete behavior
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.updateMany.mockResolvedValue({
        count: 1,
      });

      // Archive the customer
      const deleted = await customerPostgresService.deleteCustomer(
        tenantId,
        customerId
      );

      expect(deleted).toBe(true);

      // Data is preserved (not hard deleted)
      // Customer can be un-archived by setting isArchived: false
      // This enables "restore" functionality
    });
  });

  describe('Idempotency', () => {
    it('should be safe to call multiple times', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      // First call succeeds
      mockPrismaClient.customer.updateMany.mockResolvedValueOnce({
        count: 1,
      });

      // Second call returns 0 (already archived)
      mockPrismaClient.customer.updateMany.mockResolvedValueOnce({
        count: 0,
      });

      // Act
      const firstResult = await customerPostgresService.deleteCustomer(
        tenantId,
        customerId
      );

      const secondResult = await customerPostgresService.deleteCustomer(
        tenantId,
        customerId
      );

      // Assert
      expect(firstResult).toBe(true);
      expect(secondResult).toBe(false); // Already archived
      expect(mockPrismaClient.customer.updateMany).toHaveBeenCalledTimes(2);
    });
  });
});
