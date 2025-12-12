import { getPrismaClient } from './prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateEmployeeInput {
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'OWNER' | 'ADMIN' | 'DISPATCHER' | 'FIELD_TECH' | 'OFFICE_STAFF';
  jobTitle?: string;
  department?: string;
  colorHex?: string;
  hourlyRate?: number;
  overtimeRate?: number;
  canBeBookedOnline?: boolean;
  isDispatchEnabled?: boolean;
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
   * Create a new employee with associated user
   */
  async createEmployee(input: CreateEmployeeInput) {
    const prisma = getPrismaClient();
    
    // Generate employee number
    const employeeCount = await prisma.employee.count({
      where: { tenantId: input.tenantId },
    });
    const employeeNumber = `EMP-${String(employeeCount + 1).padStart(4, '0')}`;

    // First create or find the user
    let user = await prisma.user.findFirst({
      where: { email: input.email, tenantId: input.tenantId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          tenantId: input.tenantId,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: input.role || 'FIELD_TECH',
          isActive: true,
        },
      });
    }

    // Create the employee linked to the user
    const employee = await prisma.employee.create({
      data: {
        tenantId: input.tenantId,
        userId: user.id,
        employeeNumber,
        jobTitle: input.jobTitle,
        department: input.department,
        colorHex: input.colorHex || '#3B82F6',
        hourlyRate: input.hourlyRate,
        overtimeRate: input.overtimeRate,
        canBeBookedOnline: input.canBeBookedOnline ?? true,
        isDispatchEnabled: input.isDispatchEnabled ?? true,
        hireDate: new Date(),
      },
      include: {
        user: true,
        skills: {
          include: { skill: true },
        },
      },
    });

    console.log('[PG-Employee] Created employee:', employee.id, 'for user:', user.id);
    return employee;
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

