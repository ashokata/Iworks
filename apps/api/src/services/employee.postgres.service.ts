import { getPrismaClient } from './prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateEmployeeInput {
  tenantId: string;
  email?: string; // Optional - for matching with User accounts
  firstName?: string; // Optional - can be set when user account is created
  lastName?: string; // Optional - can be set when user account is created
  phone?: string;
  role?: 'OWNER' | 'ADMIN' | 'DISPATCHER' | 'FIELD_TECH' | 'OFFICE_STAFF';
  jobTitle?: string;
  department?: string;
  colorHex?: string;
  hourlyRate?: number;
  overtimeRate?: number;
  canBeBookedOnline?: boolean;
  isDispatchEnabled?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED'; // Employee status
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  colorHex?: string;
  hourlyRate?: number;
  overtimeRate?: number;
  commissionRate?: number;
  canBeBookedOnline?: boolean;
  isDispatchEnabled?: boolean;
  receivesDispatchNotifications?: boolean;
  maxDailyJobs?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export interface EmployeeFilters {
  search?: string;
  role?: string;
  department?: string;
  isDispatchEnabled?: boolean;
  includeArchived?: boolean;
}

class EmployeePostgresService {
  /**
   * Create a new employee WITHOUT automatically creating a User account
   * Employee can exist independently and be matched with User by email later
   */
  async createEmployee(input: CreateEmployeeInput) {
    const prisma = getPrismaClient();
    
    // Generate employee number
    const employeeCount = await prisma.employee.count({
      where: { tenantId: input.tenantId },
    });
    const employeeNumber = `EMP-${String(employeeCount + 1).padStart(4, '0')}`;

    // Try to find existing user by email if email is provided
    let userId: string | null = null;
    if (input.email) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          email: input.email.toLowerCase().trim(), 
          tenantId: input.tenantId 
        },
      });
      
      if (existingUser) {
        userId = existingUser.id;
        console.log('[PG-Employee] Found existing user for email:', input.email);
      } else {
        console.log('[PG-Employee] No user account found for email:', input.email, '- Employee will be created without user association');
      }
    }

    // Create the employee (with or without user association)
    // Note: email, firstName, lastName, phone fields will be available after migration
    const employeeData: any = {
      tenantId: input.tenantId,
      userId: userId || undefined, // Only set if user exists
      employeeNumber,
      jobTitle: input.jobTitle,
      department: input.department,
      colorHex: input.colorHex || '#3B82F6',
      hourlyRate: input.hourlyRate,
      overtimeRate: input.overtimeRate,
      canBeBookedOnline: input.canBeBookedOnline ?? true,
      isDispatchEnabled: input.isDispatchEnabled ?? true,
      status: input.status || 'ACTIVE',
      hireDate: new Date(),
    };

    // Add email/name fields if they exist in schema (after migration)
    if (input.email) {
      employeeData.email = input.email.toLowerCase().trim();
    }
    if (input.firstName) {
      employeeData.firstName = input.firstName;
    }
    if (input.lastName) {
      employeeData.lastName = input.lastName;
    }
    if (input.phone) {
      employeeData.phone = input.phone;
    }

    const employee = await prisma.employee.create({
      data: employeeData,
      include: {
        user: true,
        skills: {
          include: { skill: true },
        },
      },
    });

    console.log('[PG-Employee] Created employee:', employee.id, userId ? `linked to user: ${userId}` : 'without user account');
    return employee;
  }

  /**
   * Match employees with users by email address
   * This should be called when a user verifies their email and creates an account
   */
  async matchEmployeeWithUser(tenantId: string, userEmail: string, userId: string): Promise<boolean> {
    const prisma = getPrismaClient();
    
    console.log('[PG-Employee] Attempting to match employee with user:', { tenantId, userEmail, userId });
    
    // Get all employees for this tenant without user association
    const employeesWithoutUser = await prisma.employee.findMany({
      where: {
        tenantId,
        userId: null, // Only match if not already linked
      },
      include: {
        user: false, // We know userId is null, but include for clarity
      },
    });

    console.log('[PG-Employee] Found', employeesWithoutUser.length, 'employees without user association');

    // Try to match by email field (if migration has been run and email field exists)
    let employee = employeesWithoutUser.find((emp: any) => {
      const empEmail = emp.email;
      if (empEmail) {
        const matches = empEmail.toLowerCase().trim() === userEmail.toLowerCase().trim();
        console.log('[PG-Employee] Checking employee:', emp.id, 'email:', empEmail, 'matches:', matches);
        return matches;
      }
      return false;
    });

    if (employee) {
      console.log('[PG-Employee] Found matching employee by email:', employee.id);
    } else {
      console.log('[PG-Employee] No employee found with matching email:', userEmail);
      console.log('[PG-Employee] Available employee emails:', employeesWithoutUser.map((e: any) => ({
        id: e.id,
        email: e.email || 'no email',
        employeeNumber: e.employeeNumber
      })));
      
      // Also check if we can match by user's email in employee's user relation (backward compatibility)
      // This handles cases where employee was created before email field was added
      for (const emp of employeesWithoutUser) {
        if ((emp as any).user && (emp as any).user.email === userEmail.toLowerCase().trim()) {
          console.log('[PG-Employee] Found matching employee via user relation:', emp.id);
          employee = emp;
          break;
        }
      }
    }

    if (employee) {
      // Link employee to user and update email if not set
      const updateData: any = { userId };
      
      // Update employee email if not set (for employees created before migration)
      if (!(employee as any).email) {
        updateData.email = userEmail.toLowerCase().trim();
        console.log('[PG-Employee] Updating employee email field:', userEmail);
      }
      
      await prisma.employee.update({
        where: { id: employee.id },
        data: updateData,
      });
      
      console.log('[PG-Employee] Successfully matched employee:', employee.id, 'with user:', userId);
      return true;
    }

    console.log('[PG-Employee] No matching employee found for email:', userEmail);
    return false;
  }

  /**
   * Sync employee data with user account (when user account is created/updated)
   */
  async syncEmployeeWithUser(tenantId: string, userId: string, userData: { firstName?: string; lastName?: string; email?: string; phone?: string }) {
    const prisma = getPrismaClient();
    
    const employee = await prisma.employee.findFirst({
      where: {
        tenantId,
        userId,
      },
    });

    if (employee) {
      // Update employee with user data if employee fields are empty
      // Note: These fields will be available after migration
      const updateData: any = {};
      try {
        if ((employee as any).firstName === null && userData.firstName) updateData.firstName = userData.firstName;
        if ((employee as any).lastName === null && userData.lastName) updateData.lastName = userData.lastName;
        if ((employee as any).email === null && userData.email) updateData.email = userData.email.toLowerCase().trim();
        if ((employee as any).phone === null && userData.phone) updateData.phone = userData.phone;
      } catch (e) {
        // Fields don't exist yet, skip
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.employee.update({
          where: { id: employee.id },
          data: updateData,
        });
        console.log('[PG-Employee] Synced employee data with user:', employee.id);
      }
    }
  }

  /**
   * Get an employee by ID
   */
  async getEmployee(tenantId: string, employeeId: string) {
    const prisma = getPrismaClient();

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      include: {
        user: true,
        skills: {
          include: { skill: true },
        },
        schedules: true,
      },
    });

    return employee;
  }

  /**
   * List employees by tenant with filters
   */
  async listEmployees(tenantId: string, filters?: EmployeeFilters) {
    const prisma = getPrismaClient();
    const { search, role, department, isDispatchEnabled, includeArchived } = filters || {};

    const where: Prisma.EmployeeWhereInput = {
      tenantId,
      ...(includeArchived ? {} : { isArchived: false }),
      ...(isDispatchEnabled !== undefined && { isDispatchEnabled }),
      ...(department && { department }),
      ...(search && {
        OR: [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { employeeNumber: { contains: search, mode: 'insensitive' } },
          { jobTitle: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role && { user: { role: role as any } }),
    };

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: true,
        skills: {
          include: { skill: true },
        },
      },
      orderBy: [
        // Sort by user firstName/lastName (employee fields will be available after migration)
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
      ],
    });

    console.log('[PG-Employee] Listed employees:', employees.length);
    return employees;
  }

  /**
   * Update an employee
   */
  async updateEmployee(tenantId: string, employeeId: string, input: UpdateEmployeeInput) {
    const prisma = getPrismaClient();

    // Update employee
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        jobTitle: input.jobTitle,
        department: input.department,
        colorHex: input.colorHex,
        hourlyRate: input.hourlyRate,
        overtimeRate: input.overtimeRate,
        commissionRate: input.commissionRate,
        canBeBookedOnline: input.canBeBookedOnline,
        isDispatchEnabled: input.isDispatchEnabled,
        receivesDispatchNotifications: input.receivesDispatchNotifications,
        maxDailyJobs: input.maxDailyJobs,
        emergencyContactName: input.emergencyContactName,
        emergencyContactPhone: input.emergencyContactPhone,
        notes: input.notes,
      },
      include: {
        user: true,
        skills: {
          include: { skill: true },
        },
      },
    });

    // Update user if name/phone changed
    if ((input.firstName || input.lastName || input.phone) && employee.userId) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        },
      });
    }

    console.log('[PG-Employee] Updated employee:', employeeId);
    return employee;
  }

  /**
   * Archive (soft delete) an employee
   */
  async archiveEmployee(tenantId: string, employeeId: string): Promise<boolean> {
    const prisma = getPrismaClient();

    const result = await prisma.employee.updateMany({
      where: { id: employeeId, tenantId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    console.log('[PG-Employee] Archived employee:', employeeId, 'affected:', result.count);
    return result.count > 0;
  }

  /**
   * Get dispatch-enabled employees (technicians)
   */
  async getDispatchableEmployees(tenantId: string) {
    return this.listEmployees(tenantId, { isDispatchEnabled: true });
  }

  /**
   * Get employee schedule
   */
  async getEmployeeSchedule(tenantId: string, employeeId: string) {
    const prisma = getPrismaClient();

    const schedules = await prisma.employeeSchedule.findMany({
      where: { employeeId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return schedules;
  }

  /**
   * Update employee schedule
   */
  async updateEmployeeSchedule(
    tenantId: string,
    employeeId: string,
    schedules: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      breakStart?: string;
      breakDuration?: number;
      isAvailable?: boolean;
    }>
  ) {
    const prisma = getPrismaClient();

    // Delete existing schedules
    await prisma.employeeSchedule.deleteMany({
      where: { employeeId },
    });

    // Create new schedules
    const createdSchedules = await Promise.all(
      schedules.map(schedule =>
        prisma.employeeSchedule.create({
          data: {
            employeeId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: new Date(`1970-01-01T${schedule.startTime}:00Z`),
            endTime: new Date(`1970-01-01T${schedule.endTime}:00Z`),
            breakStart: schedule.breakStart
              ? new Date(`1970-01-01T${schedule.breakStart}:00Z`)
              : null,
            breakDuration: schedule.breakDuration || 0,
            isAvailable: schedule.isAvailable ?? true,
          },
        })
      )
    );

    return createdSchedules;
  }

  /**
   * Add skill to employee
   */
  async addSkill(
    tenantId: string,
    employeeId: string,
    skillId: string,
    proficiencyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  ) {
    const prisma = getPrismaClient();

    const employeeSkill = await prisma.employeeSkill.create({
      data: {
        employeeId,
        skillId,
        proficiencyLevel: proficiencyLevel || 'INTERMEDIATE',
      },
      include: { skill: true },
    });

    return employeeSkill;
  }

  /**
   * Remove skill from employee
   */
  async removeSkill(tenantId: string, employeeId: string, skillId: string) {
    const prisma = getPrismaClient();

    await prisma.employeeSkill.deleteMany({
      where: { employeeId, skillId },
    });
  }
}

export const employeePostgresService = new EmployeePostgresService();

