import { getPrismaClient } from './prisma.service';
import { EmployeeRoleAssignment, Role, Employee } from '@prisma/client';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface EmployeeRoleAssignmentWithDetails extends EmployeeRoleAssignment {
  employee?: Employee;
  role?: Role;
}

export interface AssignRoleInput {
  employeeId: string;
  roleId: string;
  assignedBy?: string;
}

export interface GetEmployeeRolesParams {
  employeeId: string;
  includeRoleDetails?: boolean;
}

export interface GetRoleEmployeesParams {
  roleId: string;
  tenantId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  includeEmployeeDetails?: boolean;
}

// ============================================================================
// Service Class
// ============================================================================

class EmployeeRolePostgresService {
  /**
   * Assign a role to an employee
   */
  async assignRole(input: AssignRoleInput): Promise<EmployeeRoleAssignmentWithDetails> {
    const prisma = getPrismaClient();

    // Check if assignment already exists
    const existing = await prisma.employeeRoleAssignment.findUnique({
      where: {
        employeeId_roleId: {
          employeeId: input.employeeId,
          roleId: input.roleId,
        },
      },
    });

    if (existing) {
      console.log('[PG-EmployeeRole] Role already assigned:', input.employeeId, input.roleId);
      return existing;
    }

    // Create new assignment
    const assignment = await prisma.employeeRoleAssignment.create({
      data: {
        employeeId: input.employeeId,
        roleId: input.roleId,
        assignedBy: input.assignedBy,
      },
      include: {
        employee: true,
        role: true,
      },
    });

    console.log('[PG-EmployeeRole] Assigned role:', assignment.id, input.roleId, 'to', input.employeeId);
    return assignment;
  }

  /**
   * Remove a role from an employee
   */
  async removeRole(employeeId: string, roleId: string): Promise<void> {
    const prisma = getPrismaClient();

    await prisma.employeeRoleAssignment.delete({
      where: {
        employeeId_roleId: {
          employeeId,
          roleId,
        },
      },
    });

    console.log('[PG-EmployeeRole] Removed role:', roleId, 'from', employeeId);
  }

  /**
   * Get all roles assigned to an employee
   */
  async getEmployeeRoles(params: GetEmployeeRolesParams): Promise<EmployeeRoleAssignmentWithDetails[]> {
    const prisma = getPrismaClient();
    const { employeeId, includeRoleDetails = true } = params;

    const assignments = await prisma.employeeRoleAssignment.findMany({
      where: { employeeId },
      include: {
        role: includeRoleDetails,
      },
      orderBy: { assignedAt: 'desc' },
    });

    console.log('[PG-EmployeeRole] Retrieved employee roles:', employeeId, assignments.length);
    return assignments;
  }

  /**
   * Get all employees assigned to a role
   */
  async getRoleEmployees(params: GetRoleEmployeesParams): Promise<EmployeeRoleAssignmentWithDetails[]> {
    const prisma = getPrismaClient();
    const { roleId, tenantId, status, includeEmployeeDetails = true } = params;

    // Build where clause
    const where: any = { roleId };

    if (includeEmployeeDetails && (tenantId || status)) {
      where.employee = {};
      if (tenantId) {
        where.employee.tenantId = tenantId;
      }
      if (status) {
        where.employee.status = status;
      }
    }

    const assignments = await prisma.employeeRoleAssignment.findMany({
      where,
      include: {
        employee: includeEmployeeDetails,
      },
      orderBy: { assignedAt: 'desc' },
    });

    console.log('[PG-EmployeeRole] Retrieved role employees:', roleId, assignments.length);
    return assignments;
  }

  /**
   * Replace all roles for an employee (removes all existing and assigns new ones)
   */
  async replaceEmployeeRoles(
    employeeId: string,
    roleIds: string[],
    assignedBy?: string
  ): Promise<EmployeeRoleAssignmentWithDetails[]> {
    const prisma = getPrismaClient();

    // Use transaction to ensure atomicity
    const assignments = await prisma.$transaction(async (tx) => {
      // Remove all existing role assignments
      await tx.employeeRoleAssignment.deleteMany({
        where: { employeeId },
      });

      // Create new assignments
      const newAssignments = await Promise.all(
        roleIds.map(roleId =>
          tx.employeeRoleAssignment.create({
            data: {
              employeeId,
              roleId,
              assignedBy,
            },
            include: {
              role: true,
            },
          })
        )
      );

      return newAssignments;
    });

    console.log('[PG-EmployeeRole] Replaced employee roles:', employeeId, assignments.length);
    return assignments;
  }

  /**
   * Check if an employee has a specific role
   */
  async hasRole(employeeId: string, roleId: string): Promise<boolean> {
    const prisma = getPrismaClient();

    const assignment = await prisma.employeeRoleAssignment.findUnique({
      where: {
        employeeId_roleId: {
          employeeId,
          roleId,
        },
      },
    });

    const hasRole = assignment !== null;
    console.log('[PG-EmployeeRole] Check has role:', employeeId, roleId, hasRole);
    return hasRole;
  }

  /**
   * Check if an employee has any of the specified roles
   */
  async hasAnyRole(employeeId: string, roleIds: string[]): Promise<boolean> {
    const prisma = getPrismaClient();

    const count = await prisma.employeeRoleAssignment.count({
      where: {
        employeeId,
        roleId: { in: roleIds },
      },
    });

    const hasAny = count > 0;
    console.log('[PG-EmployeeRole] Check has any role:', employeeId, hasAny);
    return hasAny;
  }

  /**
   * Check if an employee has all of the specified roles
   */
  async hasAllRoles(employeeId: string, roleIds: string[]): Promise<boolean> {
    const prisma = getPrismaClient();

    const count = await prisma.employeeRoleAssignment.count({
      where: {
        employeeId,
        roleId: { in: roleIds },
      },
    });

    const hasAll = count === roleIds.length;
    console.log('[PG-EmployeeRole] Check has all roles:', employeeId, hasAll);
    return hasAll;
  }

  /**
   * Get count of employees per role
   */
  async getRoleEmployeeCount(roleId: string, tenantId?: string): Promise<number> {
    const prisma = getPrismaClient();

    const where: any = { roleId };
    if (tenantId) {
      where.employee = { tenantId };
    }

    const count = await prisma.employeeRoleAssignment.count({
      where,
    });

    console.log('[PG-EmployeeRole] Role employee count:', roleId, count);
    return count;
  }

  /**
   * Get count of roles per employee
   */
  async getEmployeeRoleCount(employeeId: string): Promise<number> {
    const prisma = getPrismaClient();

    const count = await prisma.employeeRoleAssignment.count({
      where: { employeeId },
    });

    console.log('[PG-EmployeeRole] Employee role count:', employeeId, count);
    return count;
  }

  /**
   * Get all employees with their role assignments for a tenant
   */
  async getTenantEmployeeRoles(
    tenantId: string,
    status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED'
  ): Promise<(Employee & { roleAssignments: EmployeeRoleAssignmentWithDetails[] })[]> {
    const prisma = getPrismaClient();

    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        roleAssignments: {
          include: {
            role: true,
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
      orderBy: { employeeNumber: 'asc' },
    });

    console.log('[PG-EmployeeRole] Retrieved tenant employee roles:', tenantId, employees.length);
    return employees;
  }

  /**
   * Bulk assign a role to multiple employees
   */
  async bulkAssignRole(
    employeeIds: string[],
    roleId: string,
    assignedBy?: string
  ): Promise<EmployeeRoleAssignment[]> {
    const prisma = getPrismaClient();

    const assignments = await prisma.$transaction(
      employeeIds.map(employeeId =>
        prisma.employeeRoleAssignment.upsert({
          where: {
            employeeId_roleId: {
              employeeId,
              roleId,
            },
          },
          update: {},
          create: {
            employeeId,
            roleId,
            assignedBy,
          },
        })
      )
    );

    console.log('[PG-EmployeeRole] Bulk assigned role:', roleId, 'to', assignments.length, 'employees');
    return assignments;
  }

  /**
   * Bulk remove a role from multiple employees
   */
  async bulkRemoveRole(employeeIds: string[], roleId: string): Promise<number> {
    const prisma = getPrismaClient();

    const result = await prisma.employeeRoleAssignment.deleteMany({
      where: {
        employeeId: { in: employeeIds },
        roleId,
      },
    });

    console.log('[PG-EmployeeRole] Bulk removed role:', roleId, 'from', result.count, 'employees');
    return result.count;
  }

  /**
   * Transfer all role assignments from one employee to another
   * (useful for employee replacement scenarios)
   */
  async transferRoles(
    fromEmployeeId: string,
    toEmployeeId: string,
    assignedBy?: string
  ): Promise<EmployeeRoleAssignment[]> {
    const prisma = getPrismaClient();

    // Get source employee's roles
    const sourceRoles = await this.getEmployeeRoles({ employeeId: fromEmployeeId });

    // Transfer in transaction
    const assignments = await prisma.$transaction(async (tx) => {
      // Remove from source employee
      await tx.employeeRoleAssignment.deleteMany({
        where: { employeeId: fromEmployeeId },
      });

      // Assign to target employee
      const newAssignments = await Promise.all(
        sourceRoles.map(assignment =>
          tx.employeeRoleAssignment.upsert({
            where: {
              employeeId_roleId: {
                employeeId: toEmployeeId,
                roleId: assignment.roleId,
              },
            },
            update: {},
            create: {
              employeeId: toEmployeeId,
              roleId: assignment.roleId,
              assignedBy,
            },
          })
        )
      );

      return newAssignments;
    });

    console.log('[PG-EmployeeRole] Transferred roles:', fromEmployeeId, 'to', toEmployeeId, assignments.length);
    return assignments;
  }
}

// Export singleton instance
export const employeeRoleService = new EmployeeRolePostgresService();
export default employeeRoleService;
