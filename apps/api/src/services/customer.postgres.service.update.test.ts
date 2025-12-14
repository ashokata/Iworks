/**
 * Unit Tests for Customer Postgres Service - Update Customer
 *
 * These tests cover the updateCustomer method
 */

import { customerPostgresService } from './customer.postgres.service';
import { getPrismaClient } from './prisma.service';

jest.mock('./prisma.service', () => ({
  getPrismaClient: jest.fn(),
}));

describe('CustomerPostgresService - updateCustomer', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrismaClient = {
      customer: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('Successful Updates', () => {
    it('should update customer name fields', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
        firstName: 'Old',
        lastName: 'Name',
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        firstName: 'New',
        lastName: 'Name',
        addresses: [],
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        {
          firstName: 'New',
          lastName: 'Name',
        }
      );

      // Assert
      expect(result).toBeDefined();
      expect(result?.firstName).toBe('New');
      expect(result?.lastName).toBe('Name');

      expect(mockPrismaClient.customer.update).toHaveBeenCalledWith({
        where: { id: customerId },
        data: expect.objectContaining({
          firstName: 'New',
          lastName: 'Name',
        }),
        include: { addresses: true },
      });
    });

    it('should update customer email', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
        email: 'old@example.com',
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        email: 'new@example.com',
        addresses: [],
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { email: 'new@example.com' }
      );

      // Assert
      expect(result?.email).toBe('new@example.com');
    });

    it('should update customer type', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
        type: 'RESIDENTIAL',
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        type: 'COMMERCIAL',
        addresses: [],
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { type: 'COMMERCIAL' }
      );

      // Assert
      expect(result?.type).toBe('COMMERCIAL');
    });

    it('should update all phone numbers', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        mobilePhone: '555-1111',
        homePhone: '555-2222',
        workPhone: '555-3333',
        addresses: [],
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        {
          mobilePhone: '555-1111',
          homePhone: '555-2222',
          workPhone: '555-3333',
        }
      );

      // Assert
      expect(result?.mobilePhone).toBe('555-1111');
      expect(result?.homePhone).toBe('555-2222');
      expect(result?.workPhone).toBe('555-3333');
    });

    it('should update company name', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
        type: 'COMMERCIAL',
        companyName: 'Old Corp',
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        type: 'COMMERCIAL',
        companyName: 'New Corp',
        addresses: [],
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { companyName: 'New Corp' }
      );

      // Assert
      expect(result?.companyName).toBe('New Corp');
    });

    it('should update notes', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        notes: 'Updated notes',
        addresses: [],
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { notes: 'Updated notes' }
      );

      // Assert
      expect(result?.notes).toBe('Updated notes');
    });

    it('should update doNotService flag', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
        doNotService: false,
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        doNotService: true,
        doNotServiceReason: 'Payment issues',
        addresses: [],
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        {
          doNotService: true,
          doNotServiceReason: 'Payment issues',
        }
      );

      // Assert
      expect(result?.doNotService).toBe(true);
      expect(result?.doNotServiceReason).toBe('Payment issues');
    });

    it('should update notifications setting', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
        notificationsEnabled: true,
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        notificationsEnabled: false,
        addresses: [],
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { notificationsEnabled: false }
      );

      // Assert
      expect(result?.notificationsEnabled).toBe(false);
    });

    it('should update verification status', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
        verificationStatus: 'UNVERIFIED',
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        verificationStatus: 'VERIFIED',
        addresses: [],
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { verificationStatus: 'VERIFIED' }
      );

      // Assert
      expect(result?.verificationStatus).toBe('VERIFIED');
    });
  });

  describe('Multi-tenant Security', () => {
    it('should not update customer from different tenant', async () => {
      // Arrange
      const tenantId = 'tenant-A';
      const customerId = 'customer-123';

      // Customer doesn't exist for this tenant
      mockPrismaClient.customer.findFirst.mockResolvedValue(null);

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { firstName: 'Hacker' }
      );

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaClient.customer.update).not.toHaveBeenCalled();
    });

    it('should verify tenant ownership before update', async () => {
      // Arrange
      const tenantId = 'tenant-B';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId: 'tenant-B',
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId: 'tenant-B',
        firstName: 'Updated',
        addresses: [],
        updatedAt: new Date(),
      });

      // Act
      await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { firstName: 'Updated' }
      );

      // Assert
      expect(mockPrismaClient.customer.findFirst).toHaveBeenCalledWith({
        where: { id: customerId, tenantId },
      });
    });
  });

  describe('Partial Updates', () => {
    it('should update only provided fields', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'newemail@example.com',
        addresses: [],
        updatedAt: new Date(),
      });

      // Act - only update email
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { email: 'newemail@example.com' }
      );

      // Assert
      expect(mockPrismaClient.customer.update).toHaveBeenCalledWith({
        where: { id: customerId },
        data: expect.objectContaining({
          email: 'newemail@example.com',
        }),
        include: { addresses: true },
      });
    });

    it('should handle empty update object', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        addresses: [],
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        {}
      );

      // Assert
      expect(result).toBeDefined();
      expect(mockPrismaClient.customer.update).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return null when customer not found', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'nonexistent';

      mockPrismaClient.customer.findFirst.mockResolvedValue(null);

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { firstName: 'Test' }
      );

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaClient.customer.update).not.toHaveBeenCalled();
    });

    it('should throw error when database update fails', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
      });

      mockPrismaClient.customer.update.mockRejectedValue(
        new Error('Database connection lost')
      );

      // Act & Assert
      await expect(
        customerPostgresService.updateCustomer(
          tenantId,
          customerId,
          { firstName: 'Test' }
        )
      ).rejects.toThrow('Database connection lost');
    });

    it('should throw error when findFirst fails', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockRejectedValue(
        new Error('Database query failed')
      );

      // Act & Assert
      await expect(
        customerPostgresService.updateCustomer(
          tenantId,
          customerId,
          { firstName: 'Test' }
        )
      ).rejects.toThrow('Database query failed');
    });
  });

  describe('Return Value', () => {
    it('should return updated customer with addresses', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
      });

      const mockAddress = {
        id: 'address-1',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
      };

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        firstName: 'Updated',
        addresses: [mockAddress],
        updatedAt: new Date(),
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { firstName: 'Updated' }
      );

      // Assert
      expect(result?.addresses).toHaveLength(1);
      expect(result?.addresses[0].street).toBe('123 Main St');
    });

    it('should include updatedAt timestamp', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const customerId = 'customer-123';
      const now = new Date();

      mockPrismaClient.customer.findFirst.mockResolvedValue({
        id: customerId,
        tenantId,
      });

      mockPrismaClient.customer.update.mockResolvedValue({
        id: customerId,
        tenantId,
        addresses: [],
        updatedAt: now,
      });

      // Act
      const result = await customerPostgresService.updateCustomer(
        tenantId,
        customerId,
        { firstName: 'Test' }
      );

      // Assert
      expect(result?.updatedAt).toBeDefined();
      expect(result?.updatedAt).toEqual(now);
    });
  });
});
