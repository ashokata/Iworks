/**
 * Employee Role Service - Unit Tests
 *
 * Tests for employee role service layer covering:
 * - Assign/remove roles
 * - Get employee roles / role employees
 * - Replace roles
 * - Bulk operations
 * - Role checking
 */

import { employeeRoleService } from './employee-role.postgres.service';
import { getPrismaClient } from './prisma.service';

// Mock Prisma client
jest.mock('./prisma.service');

describe('EmployeeRoleService - Assign/Remove Roles', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = {
      employeeRoleAssignment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('assignRole', () => {
    it('should create new role assignment', async () => {
      const mockAssignment = {
        id: 'assign-1',
        employeeId: 'emp-1',
        roleId: 'role-1',
      };
      mockPrismaClient.employeeRoleAssignment.findUnique.mockResolvedValue(null);
      mockPrismaClient.employeeRoleAssignment.create.mockResolvedValue(mockAssignment);

      const result = await employeeRoleService.assignRole({
        employeeId: 'emp-1',
        roleId: 'role-1',
        assignedBy: 'user-1',
      });

      expect(result).toEqual(mockAssignment);
      expect(mockPrismaClient.employeeRoleAssignment.create).toHaveBeenCalledWith({
        data: {
          employeeId: 'emp-1',
          roleId: 'role-1',
          assignedBy: 'user-1',
        },
        include: {
          employee: true,
          role: true,
        },
      });
    });

    it('should return existing assignment if already assigned', async () => {
      const existingAssignment = { id: 'assign-1', employeeId: 'emp-1', roleId: 'role-1' };
      mockPrismaClient.employeeRoleAssignment.findUnique.mockResolvedValue(existingAssignment);

      const result = await employeeRoleService.assignRole({
        employeeId: 'emp-1',
        roleId: 'role-1',
      });

      expect(result).toEqual(existingAssignment);
      expect(mockPrismaClient.employeeRoleAssignment.create).not.toHaveBeenCalled();
    });
  });

  describe('removeRole', () => {
    it('should delete role assignment', async () => {
      mockPrismaClient.employeeRoleAssignment.delete.mockResolvedValue({});

      await employeeRoleService.removeRole('emp-1', 'role-1');

      expect(mockPrismaClient.employeeRoleAssignment.delete).toHaveBeenCalledWith({
        where: {
          employeeId_roleId: {
            employeeId: 'emp-1',
            roleId: 'role-1',
          },
        },
      });
    });
  });
});

describe('EmployeeRoleService - Get Roles', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = {
      employeeRoleAssignment: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('getEmployeeRoles', () => {
    it('should return all roles assigned to an employee', async () => {
      const mockAssignments = [
        { id: 'assign-1', employeeId: 'emp-1', roleId: 'role-1', role: { name: 'Admin' } },
        { id: 'assign-2', employeeId: 'emp-1', roleId: 'role-2', role: { name: 'Manager' } },
      ];
      mockPrismaClient.employeeRoleAssignment.findMany.mockResolvedValue(mockAssignments);

      const result = await employeeRoleService.getEmployeeRoles({
        employeeId: 'emp-1',
      });

      expect(result).toEqual(mockAssignments);
      expect(result).toHaveLength(2);
    });

    it('should include role details when requested', async () => {
      mockPrismaClient.employeeRoleAssignment.findMany.mockResolvedValue([]);

      await employeeRoleService.getEmployeeRoles({
        employeeId: 'emp-1',
        includeRoleDetails: true,
      });

      expect(mockPrismaClient.employeeRoleAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            role: true,
          },
        })
      );
    });
  });

  describe('getRoleEmployees', () => {
    it('should return all employees with a specific role', async () => {
      const mockAssignments = [
        { id: 'assign-1', employeeId: 'emp-1', roleId: 'role-1' },
        { id: 'assign-2', employeeId: 'emp-2', roleId: 'role-1' },
      ];
      mockPrismaClient.employeeRoleAssignment.findMany.mockResolvedValue(mockAssignments);

      const result = await employeeRoleService.getRoleEmployees({
        roleId: 'role-1',
      });

      expect(result).toEqual(mockAssignments);
    });

    it('should filter by tenant ID when provided', async () => {
      mockPrismaClient.employeeRoleAssignment.findMany.mockResolvedValue([]);

      await employeeRoleService.getRoleEmployees({
        roleId: 'role-1',
        tenantId: 'tenant-1',
      });

      expect(mockPrismaClient.employeeRoleAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employee: expect.objectContaining({
              tenantId: 'tenant-1',
            }),
          }),
        })
      );
    });

    it('should filter by employee status when provided', async () => {
      mockPrismaClient.employeeRoleAssignment.findMany.mockResolvedValue([]);

      await employeeRoleService.getRoleEmployees({
        roleId: 'role-1',
        status: 'ACTIVE',
      });

      expect(mockPrismaClient.employeeRoleAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employee: expect.objectContaining({
              status: 'ACTIVE',
            }),
          }),
        })
      );
    });
  });
});

describe('EmployeeRoleService - Replace Roles', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = {
      employeeRoleAssignment: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaClient)),
    };
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('replaceEmployeeRoles', () => {
    it('should delete all existing roles and create new ones', async () => {
      const newRoleIds = ['role-1', 'role-2'];
      mockPrismaClient.employeeRoleAssignment.create.mockResolvedValue({});

      await employeeRoleService.replaceEmployeeRoles('emp-1', newRoleIds, 'user-1');

      expect(mockPrismaClient.employeeRoleAssignment.deleteMany).toHaveBeenCalledWith({
        where: { employeeId: 'emp-1' },
      });
      expect(mockPrismaClient.employeeRoleAssignment.create).toHaveBeenCalledTimes(2);
    });
  });
});

describe('EmployeeRoleService - Role Checking', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = {
      employeeRoleAssignment: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
    };
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('hasRole', () => {
    it('should return true when employee has role', async () => {
      mockPrismaClient.employeeRoleAssignment.findUnique.mockResolvedValue({ id: 'assign-1' });

      const result = await employeeRoleService.hasRole('emp-1', 'role-1');

      expect(result).toBe(true);
    });

    it('should return false when employee does not have role', async () => {
      mockPrismaClient.employeeRoleAssignment.findUnique.mockResolvedValue(null);

      const result = await employeeRoleService.hasRole('emp-1', 'role-1');

      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when employee has any of the roles', async () => {
      mockPrismaClient.employeeRoleAssignment.count.mockResolvedValue(1);

      const result = await employeeRoleService.hasAnyRole('emp-1', ['role-1', 'role-2']);

      expect(result).toBe(true);
    });

    it('should return false when employee has none of the roles', async () => {
      mockPrismaClient.employeeRoleAssignment.count.mockResolvedValue(0);

      const result = await employeeRoleService.hasAnyRole('emp-1', ['role-1', 'role-2']);

      expect(result).toBe(false);
    });
  });

  describe('hasAllRoles', () => {
    it('should return true when employee has all roles', async () => {
      mockPrismaClient.employeeRoleAssignment.count.mockResolvedValue(2);

      const result = await employeeRoleService.hasAllRoles('emp-1', ['role-1', 'role-2']);

      expect(result).toBe(true);
    });

    it('should return false when employee missing any role', async () => {
      mockPrismaClient.employeeRoleAssignment.count.mockResolvedValue(1);

      const result = await employeeRoleService.hasAllRoles('emp-1', ['role-1', 'role-2']);

      expect(result).toBe(false);
    });
  });
});

describe('EmployeeRoleService - Bulk Operations', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = {
      employeeRoleAssignment: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaClient)),
    };
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('bulkAssignRole', () => {
    it('should assign role to multiple employees', async () => {
      const employeeIds = ['emp-1', 'emp-2', 'emp-3'];
      mockPrismaClient.employeeRoleAssignment.upsert.mockResolvedValue({});

      await employeeRoleService.bulkAssignRole(employeeIds, 'role-1', 'user-1');

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      expect(mockPrismaClient.employeeRoleAssignment.upsert).toHaveBeenCalledTimes(3);
    });
  });

  describe('bulkRemoveRole', () => {
    it('should remove role from multiple employees', async () => {
      const employeeIds = ['emp-1', 'emp-2', 'emp-3'];
      mockPrismaClient.employeeRoleAssignment.deleteMany.mockResolvedValue({ count: 3 });

      const result = await employeeRoleService.bulkRemoveRole(employeeIds, 'role-1');

      expect(result).toBe(3);
      expect(mockPrismaClient.employeeRoleAssignment.deleteMany).toHaveBeenCalledWith({
        where: {
          employeeId: { in: employeeIds },
          roleId: 'role-1',
        },
      });
    });
  });
});
