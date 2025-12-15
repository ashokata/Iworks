/**
 * Permission Service - Unit Tests
 *
 * Tests for permission service layer covering:
 * - Get all permissions
 * - Get permissions by category
 * - Role permissions (get, update)
 * - Employee permissions (get, check)
 * - Permission checking (single, any, all)
 */

import { permissionService } from './permission.postgres.service';
import { getPrismaClient } from './prisma.service';
import { Permission } from '@prisma/client';

// Mock Prisma client
jest.mock('./prisma.service');

describe('PermissionService - List Permissions', () => {
  it('should return all available permissions', () => {
    const result = permissionService.getAllPermissions();

    expect(result).toHaveLength(36); // Total permissions
    expect(result).toContain(Permission.CUSTOMERS_VIEW);
    expect(result).toContain(Permission.JOBS_CREATE);
    expect(result).toContain(Permission.INVOICES_EDIT);
  });

  it('should return permissions grouped by category', () => {
    const result = permissionService.getPermissionsByCategory();

    expect(result).toHaveProperty('Customers');
    expect(result).toHaveProperty('Jobs');
    expect(result).toHaveProperty('Invoices');
    expect(result.Customers).toContain(Permission.CUSTOMERS_VIEW);
    expect(result.Jobs).toContain(Permission.JOBS_CREATE);
  });
});

describe('PermissionService - Role Permissions', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = {
      role: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('getRolePermissions', () => {
    it('should return permissions for a role', async () => {
      const mockPermissions = [Permission.CUSTOMERS_VIEW, Permission.CUSTOMERS_CREATE];
      mockPrismaClient.role.findUnique.mockResolvedValue({
        id: 'role-1',
        permissions: mockPermissions,
      });

      const result = await permissionService.getRolePermissions('role-1');

      expect(result).toEqual(mockPermissions);
      expect(mockPrismaClient.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        select: { permissions: true },
      });
    });

    it('should throw error when role not found', async () => {
      mockPrismaClient.role.findUnique.mockResolvedValue(null);

      await expect(
        permissionService.getRolePermissions('nonexistent')
      ).rejects.toThrow('Role not found');
    });
  });

  describe('updateRolePermissions', () => {
    it('should update role permissions', async () => {
      const newPermissions = [Permission.CUSTOMERS_VIEW, Permission.CUSTOMERS_EDIT];
      const mockRole = { id: 'role-1', permissions: newPermissions };
      mockPrismaClient.role.update.mockResolvedValue(mockRole);

      const result = await permissionService.updateRolePermissions('role-1', newPermissions);

      expect(result).toEqual(mockRole);
      expect(mockPrismaClient.role.update).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        data: { permissions: newPermissions },
      });
    });
  });
});

describe('PermissionService - Employee Permissions', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = {
      employee: {
        findUnique: jest.fn(),
      },
    };
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('getEmployeePermissions', () => {
    it('should aggregate permissions from all assigned roles', async () => {
      const mockEmployee = {
        id: 'emp-1',
        roleAssignments: [
          {
            role: {
              permissions: [Permission.CUSTOMERS_VIEW, Permission.CUSTOMERS_CREATE],
            },
          },
          {
            role: {
              permissions: [Permission.JOBS_VIEW, Permission.CUSTOMERS_VIEW], // Duplicate
            },
          },
        ],
      };
      mockPrismaClient.employee.findUnique.mockResolvedValue(mockEmployee);

      const result = await permissionService.getEmployeePermissions('emp-1');

      expect(result).toHaveLength(3); // Duplicates removed
      expect(result).toContain(Permission.CUSTOMERS_VIEW);
      expect(result).toContain(Permission.CUSTOMERS_CREATE);
      expect(result).toContain(Permission.JOBS_VIEW);
    });

    it('should return empty array when employee has no roles', async () => {
      mockPrismaClient.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        roleAssignments: [],
      });

      const result = await permissionService.getEmployeePermissions('emp-1');

      expect(result).toEqual([]);
    });

    it('should throw error when employee not found', async () => {
      mockPrismaClient.employee.findUnique.mockResolvedValue(null);

      await expect(
        permissionService.getEmployeePermissions('nonexistent')
      ).rejects.toThrow('Employee not found');
    });
  });

  describe('hasPermission', () => {
    beforeEach(() => {
      const mockEmployee = {
        id: 'emp-1',
        roleAssignments: [
          {
            role: {
              permissions: [Permission.CUSTOMERS_VIEW, Permission.CUSTOMERS_CREATE],
            },
          },
        ],
      };
      mockPrismaClient.employee.findUnique.mockResolvedValue(mockEmployee);
    });

    it('should return granted=true when permission exists', async () => {
      const result = await permissionService.hasPermission('emp-1', Permission.CUSTOMERS_VIEW);

      expect(result.granted).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return granted=false when permission missing', async () => {
      const result = await permissionService.hasPermission('emp-1', Permission.JOBS_DELETE);

      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Missing permission: JOBS_DELETE');
    });
  });

  describe('hasAnyPermission', () => {
    beforeEach(() => {
      const mockEmployee = {
        id: 'emp-1',
        roleAssignments: [
          {
            role: {
              permissions: [Permission.CUSTOMERS_VIEW],
            },
          },
        ],
      };
      mockPrismaClient.employee.findUnique.mockResolvedValue(mockEmployee);
    });

    it('should return granted=true when employee has any of the permissions', async () => {
      const result = await permissionService.hasAnyPermission('emp-1', [
        Permission.JOBS_CREATE,
        Permission.CUSTOMERS_VIEW, // Has this one
      ]);

      expect(result.granted).toBe(true);
    });

    it('should return granted=false when employee has none', async () => {
      const result = await permissionService.hasAnyPermission('emp-1', [
        Permission.JOBS_CREATE,
        Permission.JOBS_DELETE,
      ]);

      expect(result.granted).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    beforeEach(() => {
      const mockEmployee = {
        id: 'emp-1',
        roleAssignments: [
          {
            role: {
              permissions: [Permission.CUSTOMERS_VIEW, Permission.CUSTOMERS_CREATE],
            },
          },
        ],
      };
      mockPrismaClient.employee.findUnique.mockResolvedValue(mockEmployee);
    });

    it('should return granted=true when employee has all permissions', async () => {
      const result = await permissionService.hasAllPermissions('emp-1', [
        Permission.CUSTOMERS_VIEW,
        Permission.CUSTOMERS_CREATE,
      ]);

      expect(result.granted).toBe(true);
    });

    it('should return granted=false when employee missing any permission', async () => {
      const result = await permissionService.hasAllPermissions('emp-1', [
        Permission.CUSTOMERS_VIEW,
        Permission.CUSTOMERS_DELETE, // Missing this one
      ]);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('CUSTOMERS_DELETE');
    });
  });

  describe('hasPermissionAndActive', () => {
    it('should check both permission and active status', async () => {
      mockPrismaClient.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        status: 'ACTIVE',
        roleAssignments: [
          {
            role: {
              permissions: [Permission.CUSTOMERS_VIEW],
            },
          },
        ],
      });

      const result = await permissionService.hasPermissionAndActive('emp-1', Permission.CUSTOMERS_VIEW);

      expect(result.granted).toBe(true);
    });

    it('should deny when employee is inactive', async () => {
      mockPrismaClient.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        status: 'INACTIVE',
      });

      const result = await permissionService.hasPermissionAndActive('emp-1', Permission.CUSTOMERS_VIEW);

      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Employee status is INACTIVE');
    });
  });
});
