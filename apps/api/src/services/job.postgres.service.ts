import { getPrismaClient, Job, JobAssignment, JobLineItem } from './prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateJobInput {
  tenantId: string;
  customerId: string;
  addressId: string;
  jobTypeId?: string;
  title: string;
  description?: string;
  internalNotes?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  source?: 'MANUAL' | 'ONLINE_BOOKING' | 'PHONE' | 'API' | 'RECURRING' | 'ESTIMATE';
  scheduledStart?: Date;
  scheduledEnd?: Date;
  estimatedDuration?: number;
  estimateId?: string;
  serviceAgreementId?: string;
  createdById?: string;
}

export interface UpdateJobInput {
  title?: string;
  description?: string;
  internalNotes?: string;
  status?: 'UNSCHEDULED' | 'SCHEDULED' | 'DISPATCHED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'INVOICED' | 'PAID' | 'CANCELLED';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  cancellationReason?: string;
}

export interface JobWithRelations extends Job {
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    mobilePhone: string | null;
    email: string | null;
  };
  address: {
    id: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  assignments: (JobAssignment & {
    employee: {
      id: string;
      user: {
        firstName: string | null;
        lastName: string | null;
      } | null;
    };
  })[];
  lineItems: JobLineItem[];
}

export interface SearchJobsParams {
  tenantId: string;
  status?: string | string[];
  customerId?: string;
  employeeId?: string;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  query?: string;
  limit?: number;
  offset?: number;
}

class JobPostgresService {
  /**
   * Create a new job
   */
  async createJob(input: CreateJobInput): Promise<JobWithRelations> {
    const prisma = getPrismaClient();
    
    // Generate job number
    const jobCount = await prisma.job.count({
      where: { tenantId: input.tenantId },
    });
    const jobNumber = `JOB-${String(jobCount + 1).padStart(6, '0')}`;

    const job = await prisma.job.create({
      data: {
        tenantId: input.tenantId,
        jobNumber,
        customerId: input.customerId,
        addressId: input.addressId,
        jobTypeId: input.jobTypeId,
        title: input.title,
        description: input.description,
        internalNotes: input.internalNotes,
        priority: input.priority || 'NORMAL',
        source: input.source || 'MANUAL',
        status: input.scheduledStart ? 'SCHEDULED' : 'UNSCHEDULED',
        scheduledStart: input.scheduledStart,
        scheduledEnd: input.scheduledEnd,
        estimatedDuration: input.estimatedDuration || 60,
        estimateId: input.estimateId,
        serviceAgreementId: input.serviceAgreementId,
        createdById: input.createdById,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            mobilePhone: true,
            email: true,
          },
        },
        address: {
          select: {
            id: true,
            street: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        lineItems: true,
      },
    });

    // Record status history
    await prisma.jobStatusHistory.create({
      data: {
        jobId: job.id,
        toStatus: job.status,
        changedById: input.createdById,
        notes: 'Job created',
      },
    });

    console.log('[PG-Job] Created job:', job.id, job.jobNumber);
    return job as JobWithRelations;
  }

  /**
   * Get a job by ID with relations
   */
  async getJob(tenantId: string, jobId: string): Promise<JobWithRelations | null> {
    const prisma = getPrismaClient();
    
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            mobilePhone: true,
            email: true,
          },
        },
        address: {
          select: {
            id: true,
            street: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        lineItems: true,
      },
    });

    console.log('[PG-Job] Get job:', jobId, job ? 'found' : 'not found');
    return job as JobWithRelations | null;
  }

  /**
   * List jobs for a tenant with filters
   */
  async listJobs(params: SearchJobsParams): Promise<{ jobs: JobWithRelations[]; total: number }> {
    const prisma = getPrismaClient();
    const { tenantId, status, customerId, employeeId, scheduledFrom, scheduledTo, query, limit = 50, offset = 0 } = params;

    const where: Prisma.JobWhereInput = {
      tenantId,
      ...(status && {
        status: Array.isArray(status) 
          ? { in: status as any[] }
          : status as any,
      }),
      ...(customerId && { customerId }),
      ...(employeeId && {
        assignments: {
          some: { employeeId },
        },
      }),
      ...(scheduledFrom && {
        scheduledStart: { gte: scheduledFrom },
      }),
      ...(scheduledTo && {
        scheduledEnd: { lte: scheduledTo },
      }),
      ...(query && {
        OR: [
          { jobNumber: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      }),
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              mobilePhone: true,
              email: true,
            },
          },
          address: {
            select: {
              id: true,
              street: true,
              city: true,
              state: true,
              zip: true,
            },
          },
          assignments: {
            include: {
              employee: {
                select: {
                  id: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          lineItems: true,
        },
        orderBy: [
          { scheduledStart: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.job.count({ where }),
    ]);

    console.log('[PG-Job] List jobs for tenant:', tenantId, 'count:', jobs.length);
    return { jobs: jobs as JobWithRelations[], total };
  }

  /**
   * Update a job
   */
  async updateJob(
    tenantId: string, 
    jobId: string, 
    input: UpdateJobInput,
    changedById?: string
  ): Promise<JobWithRelations | null> {
    const prisma = getPrismaClient();

    // Get existing job to track status changes
    const existing = await prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!existing) {
      console.log('[PG-Job] Job not found for update:', jobId);
      return null;
    }

    const updateData: Prisma.JobUpdateInput = {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.internalNotes !== undefined && { internalNotes: input.internalNotes }),
      ...(input.status && { status: input.status }),
      ...(input.priority && { priority: input.priority }),
      ...(input.scheduledStart && { scheduledStart: input.scheduledStart }),
      ...(input.scheduledEnd && { scheduledEnd: input.scheduledEnd }),
      ...(input.actualStart && { actualStart: input.actualStart }),
      ...(input.actualEnd && { actualEnd: input.actualEnd }),
    };

    // Handle status-specific updates
    if (input.status === 'DISPATCHED') {
      updateData.dispatchedAt = new Date();
    } else if (input.status === 'COMPLETED') {
      updateData.completedAt = new Date();
      if (!input.actualEnd) {
        updateData.actualEnd = new Date();
      }
    } else if (input.status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = input.cancellationReason;
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            mobilePhone: true,
            email: true,
          },
        },
        address: {
          select: {
            id: true,
            street: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        lineItems: true,
      },
    });

    // Record status change if status changed
    if (input.status && input.status !== existing.status) {
      await prisma.jobStatusHistory.create({
        data: {
          jobId: job.id,
          fromStatus: existing.status,
          toStatus: input.status,
          changedById,
        },
      });
    }

    console.log('[PG-Job] Updated job:', jobId);
    return job as JobWithRelations;
  }

  /**
   * Assign an employee to a job
   */
  async assignEmployee(
    tenantId: string,
    jobId: string,
    employeeId: string,
    role: 'PRIMARY' | 'SECONDARY' | 'HELPER' = 'PRIMARY'
  ): Promise<JobAssignment | null> {
    const prisma = getPrismaClient();

    // Verify job exists and belongs to tenant
    const job = await prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      return null;
    }

    // Verify employee exists and belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
    });

    if (!employee) {
      return null;
    }

    const assignment = await prisma.jobAssignment.upsert({
      where: {
        jobId_employeeId: { jobId, employeeId },
      },
      update: { role },
      create: {
        jobId,
        employeeId,
        role,
      },
    });

    console.log('[PG-Job] Assigned employee:', employeeId, 'to job:', jobId);
    return assignment;
  }

  /**
   * Remove an employee from a job
   */
  async unassignEmployee(
    tenantId: string,
    jobId: string,
    employeeId: string
  ): Promise<boolean> {
    const prisma = getPrismaClient();

    // Verify job exists and belongs to tenant
    const job = await prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      return false;
    }

    await prisma.jobAssignment.delete({
      where: {
        jobId_employeeId: { jobId, employeeId },
      },
    });

    console.log('[PG-Job] Unassigned employee:', employeeId, 'from job:', jobId);
    return true;
  }

  /**
   * Add a line item to a job
   */
  async addLineItem(
    tenantId: string,
    jobId: string,
    lineItem: {
      type: 'SERVICE' | 'MATERIAL' | 'LABOR' | 'FEE' | 'DISCOUNT' | 'TAX';
      serviceId?: string;
      materialId?: string;
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      unitCost?: number;
      isTaxable?: boolean;
    }
  ): Promise<JobLineItem | null> {
    const prisma = getPrismaClient();

    // Verify job exists and belongs to tenant
    const job = await prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      return null;
    }

    // Get next sort order
    const maxSort = await prisma.jobLineItem.aggregate({
      where: { jobId },
      _max: { sortOrder: true },
    });

    const item = await prisma.jobLineItem.create({
      data: {
        jobId,
        type: lineItem.type,
        serviceId: lineItem.serviceId,
        materialId: lineItem.materialId,
        name: lineItem.name,
        description: lineItem.description,
        quantity: lineItem.quantity,
        unitPrice: lineItem.unitPrice,
        unitCost: lineItem.unitCost || 0,
        isTaxable: lineItem.isTaxable ?? true,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
    });

    // Recalculate job totals
    await this.recalculateJobTotals(jobId);

    console.log('[PG-Job] Added line item:', item.id, 'to job:', jobId);
    return item;
  }

  /**
   * Recalculate job totals based on line items
   */
  private async recalculateJobTotals(jobId: string): Promise<void> {
    const prisma = getPrismaClient();

    const lineItems = await prisma.jobLineItem.findMany({
      where: { jobId },
    });

    let subtotal = 0;
    let taxAmount = 0;
    const defaultTaxRate = 0.0825; // 8.25% default tax rate

    for (const item of lineItems) {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount);
      
      if (item.type === 'DISCOUNT') {
        subtotal -= Math.abs(itemTotal);
      } else if (item.type === 'TAX') {
        taxAmount += itemTotal;
      } else {
        subtotal += itemTotal;
        if (item.isTaxable) {
          taxAmount += itemTotal * defaultTaxRate;
        }
      }
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
      },
    });
  }

  /**
   * Get jobs for a specific date range (for scheduling/dispatch)
   */
  async getJobsForSchedule(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    employeeId?: string
  ): Promise<JobWithRelations[]> {
    const prisma = getPrismaClient();

    const where: Prisma.JobWhereInput = {
      tenantId,
      status: { notIn: ['CANCELLED', 'PAID'] },
      OR: [
        {
          scheduledStart: { gte: startDate, lte: endDate },
        },
        {
          scheduledEnd: { gte: startDate, lte: endDate },
        },
        {
          AND: [
            { scheduledStart: { lte: startDate } },
            { scheduledEnd: { gte: endDate } },
          ],
        },
      ],
      ...(employeeId && {
        assignments: {
          some: { employeeId },
        },
      }),
    };

    const jobs = await prisma.job.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            mobilePhone: true,
            email: true,
          },
        },
        address: {
          select: {
            id: true,
            street: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        lineItems: true,
      },
      orderBy: { scheduledStart: 'asc' },
    });

    console.log('[PG-Job] Schedule jobs:', startDate, 'to', endDate, 'count:', jobs.length);
    return jobs as JobWithRelations[];
  }

  /**
   * Get job by job number
   */
  async getJobByNumber(tenantId: string, jobNumber: string): Promise<JobWithRelations | null> {
    const prisma = getPrismaClient();
    
    const job = await prisma.job.findFirst({
      where: {
        tenantId,
        jobNumber,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            mobilePhone: true,
            email: true,
          },
        },
        address: {
          select: {
            id: true,
            street: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        lineItems: true,
      },
    });

    return job as JobWithRelations | null;
  }
}

export const jobPostgresService = new JobPostgresService();

