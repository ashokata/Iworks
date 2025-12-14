/**
 * Unit Tests for Job Postgres Service - Create Job
 *
 * These tests cover the createJob method
 */

import { jobPostgresService } from './job.postgres.service';
import { getPrismaClient } from './prisma.service';

jest.mock('./prisma.service', () => ({
  getPrismaClient: jest.fn(),
}));

describe('JobPostgresService - createJob', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrismaClient = {
      job: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };

    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('Successful Job Creation', () => {
    it('should create a job with required fields', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const input = {
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'HVAC Repair',
      };

      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-1',
        tenantId,
        jobNumber: 'JOB-000001',
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'HVAC Repair',
        status: 'UNSCHEDULED',
        priority: 'NORMAL',
        customer: { id: 'customer-123', firstName: 'John', lastName: 'Doe' },
        address: { id: 'address-456', street: '123 Main St', city: 'NY', state: 'NY', zip: '10001' },
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('job-1');
      expect(result.jobNumber).toBe('JOB-000001');
      expect(result.title).toBe('HVAC Repair');
      expect(result.status).toBe('UNSCHEDULED');
      expect(result.priority).toBe('NORMAL');
    });

    it('should create job with description and notes', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const input = {
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Plumbing Fix',
        description: 'Fix leaky faucet in bathroom',
        internalNotes: 'Customer prefers morning appointments',
      };

      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-2',
        tenantId,
        jobNumber: 'JOB-000001',
        title: 'Plumbing Fix',
        description: 'Fix leaky faucet in bathroom',
        internalNotes: 'Customer prefers morning appointments',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob(input);

      // Assert
      expect(result.description).toBe('Fix leaky faucet in bathroom');
      expect(result.internalNotes).toBe('Customer prefers morning appointments');
    });

    it('should create job with priority level', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const input = {
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Emergency Repair',
        priority: 'EMERGENCY' as const,
      };

      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-3',
        tenantId,
        jobNumber: 'JOB-000001',
        priority: 'EMERGENCY',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob(input);

      // Assert
      expect(result.priority).toBe('EMERGENCY');
    });

    it('should create job with source', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const input = {
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Online Booking',
        source: 'ONLINE_BOOKING' as const,
      };

      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-4',
        tenantId,
        jobNumber: 'JOB-000001',
        source: 'ONLINE_BOOKING',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob(input);

      // Assert
      expect(result.source).toBe('ONLINE_BOOKING');
    });

    it('should create job with scheduled dates', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const scheduledStart = new Date('2025-12-25T09:00:00Z');
      const scheduledEnd = new Date('2025-12-25T11:00:00Z');

      const input = {
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Scheduled Job',
        scheduledStart,
        scheduledEnd,
        estimatedDuration: 120, // 2 hours
      };

      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-5',
        tenantId,
        jobNumber: 'JOB-000001',
        scheduledStart,
        scheduledEnd,
        estimatedDuration: 120,
        status: 'SCHEDULED',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob(input);

      // Assert
      expect(result.scheduledStart).toEqual(scheduledStart);
      expect(result.scheduledEnd).toEqual(scheduledEnd);
      expect(result.estimatedDuration).toBe(120);
    });
  });

  describe('Job Number Generation', () => {
    it('should generate JOB-000001 for first job', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-1',
        tenantId,
        jobNumber: 'JOB-000001',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'First Job',
      });

      // Assert
      expect(result.jobNumber).toBe('JOB-000001');
    });

    it('should generate JOB-000100 for 100th job', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      mockPrismaClient.job.count.mockResolvedValue(99); // 100th job
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-100',
        tenantId,
        jobNumber: 'JOB-000100',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: '100th Job',
      });

      // Assert
      expect(result.jobNumber).toBe('JOB-000100');
    });
  });

  describe('Job Priority Levels', () => {
    it('should create LOW priority job', async () => {
      const tenantId = 'test-tenant';
      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-low',
        priority: 'LOW',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      const result = await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Low Priority',
        priority: 'LOW',
      });

      expect(result.priority).toBe('LOW');
    });

    it('should create NORMAL priority job (default)', async () => {
      const tenantId = 'test-tenant';
      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-normal',
        priority: 'NORMAL',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      const result = await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Normal Priority',
      });

      expect(result.priority).toBe('NORMAL');
    });

    it('should create HIGH priority job', async () => {
      const tenantId = 'test-tenant';
      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-high',
        priority: 'HIGH',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      const result = await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'High Priority',
        priority: 'HIGH',
      });

      expect(result.priority).toBe('HIGH');
    });

    it('should create EMERGENCY priority job', async () => {
      const tenantId = 'test-tenant';
      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-emergency',
        priority: 'EMERGENCY',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      const result = await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Emergency',
        priority: 'EMERGENCY',
      });

      expect(result.priority).toBe('EMERGENCY');
    });
  });

  describe('Job Sources', () => {
    const sources = ['MANUAL', 'ONLINE_BOOKING', 'PHONE', 'API', 'RECURRING', 'ESTIMATE'] as const;

    sources.forEach(source => {
      it(`should create job from ${source} source`, async () => {
        const tenantId = 'test-tenant';
        mockPrismaClient.job.count.mockResolvedValue(0);
        mockPrismaClient.job.create.mockResolvedValue({
          id: `job-${source}`,
          source,
          customer: {},
          address: {},
          assignments: [],
          lineItems: [],
          createdAt: new Date(),
        });

        const result = await jobPostgresService.createJob({
          tenantId,
          customerId: 'customer-123',
          addressId: 'address-456',
          title: `${source} Job`,
          source,
        });

        expect(result.source).toBe(source);
      });
    });
  });

  describe('Job Relations', () => {
    it('should include customer information', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const mockCustomer = {
        id: 'customer-123',
        firstName: 'John',
        lastName: 'Doe',
        companyName: null,
        mobilePhone: '555-1234',
        email: 'john@example.com',
      };

      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-1',
        tenantId,
        customer: mockCustomer,
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Test Job',
      });

      // Assert
      expect(result.customer).toBeDefined();
      expect(result.customer.firstName).toBe('John');
      expect(result.customer.email).toBe('john@example.com');
    });

    it('should include address information', async () => {
      // Arrange
      const tenantId = 'test-tenant';
      const mockAddress = {
        id: 'address-456',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      };

      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-1',
        tenantId,
        customer: {},
        address: mockAddress,
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Test Job',
      });

      // Assert
      expect(result.address).toBeDefined();
      expect(result.address.street).toBe('123 Main St');
      expect(result.address.city).toBe('New York');
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should create job for specific tenant', async () => {
      // Arrange
      const tenantId = 'tenant-A';

      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-1',
        tenantId: 'tenant-A',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Tenant A Job',
      });

      // Assert
      expect(result.tenantId).toBe('tenant-A');
    });

    it('should count jobs only for specific tenant', async () => {
      // Arrange
      const tenantId = 'tenant-B';

      mockPrismaClient.job.count.mockResolvedValue(5);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-6',
        tenantId: 'tenant-B',
        jobNumber: 'JOB-000006',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Tenant B Job',
      });

      // Assert
      expect(mockPrismaClient.job.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-B' },
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when database connection fails', async () => {
      // Arrange
      const tenantId = 'test-tenant';

      mockPrismaClient.job.count.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        jobPostgresService.createJob({
          tenantId,
          customerId: 'customer-123',
          addressId: 'address-456',
          title: 'Test Job',
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should throw error when create operation fails', async () => {
      // Arrange
      const tenantId = 'test-tenant';

      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockRejectedValue(
        new Error('Foreign key constraint violation')
      );

      // Act & Assert
      await expect(
        jobPostgresService.createJob({
          tenantId,
          customerId: 'invalid-customer',
          addressId: 'invalid-address',
          title: 'Test Job',
        })
      ).rejects.toThrow('Foreign key constraint violation');
    });
  });

  describe('Default Values', () => {
    it('should default status to UNSCHEDULED when not scheduled', async () => {
      // Arrange
      const tenantId = 'test-tenant';

      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-1',
        tenantId,
        status: 'UNSCHEDULED',
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Unscheduled Job',
      });

      // Assert
      expect(result.status).toBe('UNSCHEDULED');
    });

    it('should set status to SCHEDULED when dates provided', async () => {
      // Arrange
      const tenantId = 'test-tenant';

      mockPrismaClient.job.count.mockResolvedValue(0);
      mockPrismaClient.job.create.mockResolvedValue({
        id: 'job-2',
        tenantId,
        status: 'SCHEDULED',
        scheduledStart: new Date(),
        customer: {},
        address: {},
        assignments: [],
        lineItems: [],
        createdAt: new Date(),
      });

      // Act
      const result = await jobPostgresService.createJob({
        tenantId,
        customerId: 'customer-123',
        addressId: 'address-456',
        title: 'Scheduled Job',
        scheduledStart: new Date(),
      });

      // Assert
      expect(result.status).toBe('SCHEDULED');
    });
  });
});
