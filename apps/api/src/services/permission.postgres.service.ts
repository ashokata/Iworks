import { getPrismaClient } from './prisma.service';
import { Permission, Role, Employee } from '@prisma/client';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface EmployeeWithPermissions {
  id: string;
  userId: string;
  tenantId: string;
  employeeNumber: string;
  jobTitle: string | null;
  department: string | null;
  status: string;
  permissions: Permission[];
  roles: {
    id: string;
    roleId: string;
    role: Role;
  }[];
}

export interface RoleWithPermissions extends Role {
  employeeAssignments?: {
    id: string;
    employeeId: string;
    employee: Employee;
  }[];
}

export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
}

// ============================================================================
// Service Class
// ============================================================================

class PermissionPostgresService {
  /**
   * Get all available permissions (from enum)
   */
  getAllPermissions(): Permission[] {
    // Return all Permission enum values
    const permissions: Permission[] = [
      // Customer permissions
      Permission.CUSTOMERS_VIEW,
      Permission.CUSTOMERS_CREATE,
      Permission.CUSTOMERS_EDIT,
      Permission.CUSTOMERS_DELETE,
      Permission.CUSTOMERS_EXPORT,

      // Job permissions
      Permission.JOBS_VIEW,
      Permission.JOBS_CREATE,
      Permission.JOBS_EDIT,
      Permission.JOBS_DELETE,
      Permission.JOBS_ASSIGN,
      Permission.JOBS_COMPLETE,

      // Estimate permissions
      Permission.ESTIMATES_VIEW,
      Permission.ESTIMATES_CREATE,
      Permission.ESTIMATES_EDIT,
      Permission.ESTIMATES_DELETE,
      Permission.ESTIMATES_APPROVE,

      // Invoice permissions
      Permission.INVOICES_VIEW,
      Permission.INVOICES_CREATE,
      Permission.INVOICES_EDIT,
      Permission.INVOICES_DELETE,
      Permission.INVOICES_SEND,

      // Payment permissions
      Permission.PAYMENTS_VIEW,
      Permission.PAYMENTS_COLLECT,
      Permission.PAYMENTS_REFUND,

      // Schedule permissions
      Permission.SCHEDULE_VIEW,
      Permission.SCHEDULE_MANAGE,
      Permission.DISPATCH_JOBS,

      // Employee permissions
      Permission.EMPLOYEES_VIEW,
      Permission.EMPLOYEES_MANAGE,
      Permission.PERMISSIONS_MANAGE,

      // Pricebook permissions
      Permission.PRICEBOOK_VIEW,
      Permission.PRICEBOOK_EDIT,

      // Reports permissions
      Permission.REPORTS_VIEW,
      Permission.REPORTS_EXPORT,

      // Settings permissions
      Permission.SETTINGS_VIEW,
      Permission.SETTINGS_MANAGE,
      Permission.INTEGRATIONS_MANAGE,
    ];

    console.log('[PG-Permission] Retrieved all permissions:', permissions.length);
    return permissions;
  }

  /**
   * Get permissions grouped by category
   */
  getPermissionsByCategory(): Record<string, Permission[]> {
    const permissions = {
      Customers: [
        Permission.CUSTOMERS_VIEW,
        Permission.CUSTOMERS_CREATE,
        Permission.CUSTOMERS_EDIT,
        Permission.CUSTOMERS_DELETE,
        Permission.CUSTOMERS_EXPORT,
      ],
      Jobs: [
        Permission.JOBS_VIEW,
        Permission.JOBS_CREATE,
        Permission.JOBS_EDIT,
        Permission.JOBS_DELETE,
        Permission.JOBS_ASSIGN,
        Permission.JOBS_COMPLETE,
      ],
      Estimates: [
        Permission.ESTIMATES_VIEW,
        Permission.ESTIMATES_CREATE,
        Permission.ESTIMATES_EDIT,
        Permission.ESTIMATES_DELETE,
        Permission.ESTIMATES_APPROVE,
      ],
      Invoices: [
        Permission.INVOICES_VIEW,
        Permission.INVOICES_CREATE,
        Permission.INVOICES_EDIT,
        Permission.INVOICES_DELETE,
        Permission.INVOICES_SEND,
      ],
      Payments: [
        Permission.PAYMENTS_VIEW,
        Permission.PAYMENTS_COLLECT,
        Permission.PAYMENTS_REFUND,
      ],
      Schedule: [
        Permission.SCHEDULE_VIEW,
        Permission.SCHEDULE_MANAGE,
        Permission.DISPATCH_JOBS,
      ],
      Employees: [
        Permission.EMPLOYEES_VIEW,
        Permission.EMPLOYEES_MANAGE,
        Permission.PERMISSIONS_MANAGE,
      ],
      Pricebook: [
        Permission.PRICEBOOK_VIEW,
        Permission.PRICEBOOK_EDIT,
      ],
      Reports: [
        Permission.REPORTS_VIEW,
        Permission.REPORTS_EXPORT,
      ],
      Settings: [
        Permission.SETTINGS_VIEW,
        Permission.SETTINGS_MANAGE,
        Permission.INTEGRATIONS_MANAGE,
      ],
    };

    console.log('[PG-Permission] Retrieved permissions by category:', Object.keys(permissions).length);
    return permissions;
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const prisma = getPrismaClient();

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { permissions: true },
    });

    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    console.log('[PG-Permission] Retrieved role permissions:', roleId, role.permissions.length);
    return role.permissions;
  }

  /**
   * Update permissions for a role
   */
  async updateRolePermissions(roleId: string, permissions: Permission[]): Promise<Role> {
    const prisma = getPrismaClient();

    const role = await prisma.role.update({
      where: { id: roleId },
      data: { permissions },
    });

    console.log('[PG-Permission] Updated role permissions:', roleId, permissions.length);
    return role;
  }

  /**
   * Get all permissions for an employee (aggregated from all assigned roles)
   */
  async getEmployeePermissions(employeeId: string): Promise<Permission[]> {
    const prisma = getPrismaClient();

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        roleAssignments: {
          include: {
            role: {
              select: { permissions: true },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`);
    }

    // Aggregate permissions from all roles (remove duplicates)
    const permissionSet = new Set<Permission>();
    for (const assignment of employee.roleAssignments) {
      for (const permission of assignment.role.permissions) {
        permissionSet.add(permission);
      }
    }

    const permissions = Array.from(permissionSet);
    console.log('[PG-Permission] Retrieved employee permissions:', employeeId, permissions.length);
    return permissions;
  }

  /**
   * Check if an employee has a specific permission
   */
  async hasPermission(employeeId: string, permission: Permission): Promise<PermissionCheckResult> {
    try {
      const permissions = await this.getEmployeePermissions(employeeId);
      const granted = permissions.includes(permission);

      console.log('[PG-Permission] Permission check:', employeeId, permission, granted ? 'GRANTED' : 'DENIED');

      return {
        granted,
        reason: granted ? undefined : `Missing permission: ${permission}`,
      };
    } catch (error: any) {
      console.error('[PG-Permission] Permission check error:', error.message);
      return {
        granted: false,
        reason: error.message,
      };
    }
  }

  /**
   * Check if an employee has ANY of the specified permissions
   */
  async hasAnyPermission(employeeId: string, permissions: Permission[]): Promise<PermissionCheckResult> {
    try {
      const employeePermissions = await this.getEmployeePermissions(employeeId);
      const granted = permissions.some(p => employeePermissions.includes(p));

      console.log('[PG-Permission] Any permission check:', employeeId, granted ? 'GRANTED' : 'DENIED');

      return {
        granted,
        reason: granted ? undefined : `Missing any of permissions: ${permissions.join(', ')}`,
      };
    } catch (error: any) {
      console.error('[PG-Permission] Permission check error:', error.message);
      return {
        granted: false,
        reason: error.message,
      };
    }
  }

  /**
   * Check if an employee has ALL of the specified permissions
   */
  async hasAllPermissions(employeeId: string, permissions: Permission[]): Promise<PermissionCheckResult> {
    try {
      const employeePermissions = await this.getEmployeePermissions(employeeId);
      const missingPermissions = permissions.filter(p => !employeePermissions.includes(p));
      const granted = missingPermissions.length === 0;

      console.log('[PG-Permission] All permissions check:', employeeId, granted ? 'GRANTED' : 'DENIED');

      return {
        granted,
        reason: granted ? undefined : `Missing permissions: ${missingPermissions.join(', ')}`,
      };
    } catch (error: any) {
      console.error('[PG-Permission] Permission check error:', error.message);
      return {
        granted: false,
        reason: error.message,
      };
    }
  }

  /**
   * Check if employee is active and has permission
   */
  async hasPermissionAndActive(employeeId: string, permission: Permission): Promise<PermissionCheckResult> {
    const prisma = getPrismaClient();

    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { status: true },
      });

      if (!employee) {
        return {
          granted: false,
          reason: 'Employee not found',
        };
      }

      if (employee.status !== 'ACTIVE') {
        return {
          granted: false,
          reason: `Employee status is ${employee.status}`,
        };
      }

      return await this.hasPermission(employeeId, permission);
    } catch (error: any) {
      console.error('[PG-Permission] Permission check error:', error.message);
      return {
        granted: false,
        reason: error.message,
      };
    }
  }

  /**
   * Get employee with full permission details
   */
  async getEmployeeWithPermissions(employeeId: string): Promise<EmployeeWithPermissions | null> {
    const prisma = getPrismaClient();

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        roleAssignments: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!employee) {
      return null;
    }

    // Aggregate permissions from all roles
    const permissionSet = new Set<Permission>();
    for (const assignment of employee.roleAssignments) {
      for (const permission of assignment.role.permissions) {
        permissionSet.add(permission);
      }
    }

    const result: EmployeeWithPermissions = {
      ...employee,
      permissions: Array.from(permissionSet),
    };

    console.log('[PG-Permission] Retrieved employee with permissions:', employeeId);
    return result;
  }

  /**
   * Get all employees with a specific permission
   */
  async getEmployeesWithPermission(tenantId: string, permission: Permission): Promise<EmployeeWithPermissions[]> {
    const prisma = getPrismaClient();

    // Get all roles that have this permission
    const rolesWithPermission = await prisma.role.findMany({
      where: {
        tenantId,
        permissions: {
          has: permission,
        },
      },
      include: {
        employeeAssignments: {
          include: {
            employee: {
              include: {
                roleAssignments: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Extract unique employees
    const employeeMap = new Map<string, EmployeeWithPermissions>();
    for (const role of rolesWithPermission) {
      for (const assignment of role.employeeAssignments) {
        if (!employeeMap.has(assignment.employee.id)) {
          // Aggregate permissions for this employee
          const permissionSet = new Set<Permission>();
          for (const roleAssignment of assignment.employee.roleAssignments) {
            for (const perm of roleAssignment.role.permissions) {
              permissionSet.add(perm);
            }
          }

          employeeMap.set(assignment.employee.id, {
            ...assignment.employee,
            permissions: Array.from(permissionSet),
          });
        }
      }
    }

    const employees = Array.from(employeeMap.values());
    console.log('[PG-Permission] Found employees with permission:', permission, employees.length);
    return employees;
  }
}

// Export singleton instance
export const permissionService = new PermissionPostgresService();
export default permissionService;
