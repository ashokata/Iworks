/**
 * LLM Function Executor - Executes function calls from Bedrock LLM
 * Uses PostgreSQL via Prisma for data operations
 */

import { customerPostgresService } from './customer.postgres.service';
import { jobPostgresService } from './job.postgres.service';
import { invoicePostgresService } from './invoice.postgres.service';
import { getPrismaClient } from './prisma.service';

// Simple logger class
class Logger {
  private context: Record<string, any> = {};
  
  constructor(initialContext: Record<string, any> = {}) {
    this.context = initialContext;
  }
  
  setContext(ctx: Record<string, any>) {
    this.context = { ...this.context, ...ctx };
  }
  
  info(message: string, data?: any) {
    console.log(JSON.stringify({ level: 'INFO', message, ...this.context, ...data }));
  }
  
  error(message: string, error?: any, data?: any) {
    console.error(JSON.stringify({ level: 'ERROR', message, error: error?.message, ...this.context, ...data }));
  }
  
  warn(message: string, data?: any) {
    console.warn(JSON.stringify({ level: 'WARN', message, ...this.context, ...data }));
  }
  
  debug(message: string, data?: any) {
    console.debug(JSON.stringify({ level: 'DEBUG', message, ...this.context, ...data }));
  }
}

export interface FunctionResult {
  status: 'success' | 'error';
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class LLMFunctionExecutor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ component: 'llm-function-executor' });
  }

  /**
   * Execute a function call from the LLM
   */
  async executeFunction(
    functionName: string,
    args: Record<string, any>,
    userId: string,
    tenantId: string
  ): Promise<FunctionResult> {
    this.logger.info(`Executing function: ${functionName}`, { functionName, userId, tenantId });

    try {
      switch (functionName) {
        case 'createCustomer':
          return await this.createCustomer(args as any, tenantId);

        case 'searchCustomer':
          return await this.searchCustomer(args as any, tenantId);

        case 'getCustomer':
          return await this.getCustomer(args as any, tenantId);

        case 'updateCustomer':
          return await this.updateCustomer(args as any, tenantId);

        case 'createJob':
          return await this.createJob(args as any, tenantId, userId);

        case 'getJobStatus':
          return await this.getJobStatus(args as any, tenantId);

        case 'updateJob':
          return await this.updateJob(args as any, tenantId, userId);

        case 'createInvoice':
          return await this.createInvoice(args as any, tenantId, userId);

        case 'updateInvoice':
          return await this.updateInvoice(args as any, tenantId);

        case 'getInvoice':
          return await this.getInvoice(args as any, tenantId);

        case 'sendNotification':
          return await this.sendNotification(args as any);

        default:
          return {
            status: 'error',
            error: {
              code: 'UNKNOWN_FUNCTION',
              message: `Unknown function: ${functionName}`,
            },
          };
      }
    } catch (error: any) {
      this.logger.error(`Function execution failed: ${functionName}`, error);
      return {
        status: 'error',
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message || 'Function execution failed',
          details: error,
        },
      };
    }
  }

  /**
   * Create a new customer in PostgreSQL
   */
  private async createCustomer(
    args: {
      firstName: string;
      lastName: string;
      email?: string;
      phone: string;
      companyName?: string;
      type?: 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR';
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      notes?: string;
    },
    tenantId: string
  ): Promise<FunctionResult> {
    this.logger.info('Creating customer', { firstName: args.firstName, lastName: args.lastName });

    const customer = await customerPostgresService.createCustomer({
      tenantId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      mobilePhone: args.phone,
      companyName: args.companyName,
      type: args.type || 'RESIDENTIAL',
      street: args.street,
      city: args.city,
      state: args.state,
      zip: args.zip,
      notes: args.notes,
    });

    this.logger.info('Customer created successfully', { customerId: customer.id });

    return {
      status: 'success',
      data: {
        customerId: customer.id,
        customerNumber: customer.customerNumber,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.mobilePhone,
        message: `Customer ${customer.firstName} ${customer.lastName} (${customer.customerNumber}) created successfully`,
      },
    };
  }

  /**
   * Search for customers
   */
  private async searchCustomer(
    args: {
      query?: string;
      phone?: string;
      email?: string;
      customerId?: string;
      customerNumber?: string;
      type?: 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR';
      limit?: number;
    },
    tenantId: string
  ): Promise<FunctionResult> {
    this.logger.info('Searching customers', { query: args.query, tenantId });

    // If customerId is provided, get specific customer
    if (args.customerId) {
      const customer = await customerPostgresService.getCustomer(tenantId, args.customerId);
      if (customer) {
        return {
          status: 'success',
          data: {
            customers: [this.formatCustomerResponse(customer)],
            count: 1,
          },
        };
      }
      return {
        status: 'success',
        data: {
          customers: [],
          count: 0,
          message: 'No customer found with that ID',
        },
      };
    }

    // If customerNumber is provided, get by number
    if (args.customerNumber) {
      const customer = await customerPostgresService.getCustomerByNumber(tenantId, args.customerNumber);
      if (customer) {
        return {
          status: 'success',
          data: {
            customers: [this.formatCustomerResponse(customer)],
            count: 1,
          },
        };
      }
      return {
        status: 'success',
        data: {
          customers: [],
          count: 0,
          message: 'No customer found with that customer number',
        },
      };
    }

    // Search by query (name, email, phone)
    const searchQuery = args.query || args.phone || args.email;
    if (searchQuery) {
      const customers = await customerPostgresService.searchCustomers({
        tenantId,
        query: searchQuery,
        type: args.type,
        limit: args.limit || 10,
      });
      return {
        status: 'success',
        data: {
          customers: customers.map(c => this.formatCustomerResponse(c)),
          count: customers.length,
        },
      };
    }

    // List all customers for tenant
    const { customers, total } = await customerPostgresService.listCustomers(tenantId, { 
      limit: args.limit || 10 
    });
    return {
      status: 'success',
      data: {
        customers: customers.map(c => this.formatCustomerResponse(c)),
        count: customers.length,
        total,
      },
    };
  }

  /**
   * Get a specific customer by ID
   */
  private async getCustomer(args: { customerId: string }, tenantId: string): Promise<FunctionResult> {
    this.logger.info('Getting customer', { customerId: args.customerId });

    const customer = await customerPostgresService.getCustomer(tenantId, args.customerId);

    if (!customer) {
      return {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: `Customer with ID ${args.customerId} not found`,
        },
      };
    }

    return {
      status: 'success',
      data: this.formatCustomerResponse(customer),
    };
  }

  /**
   * Update a customer
   */
  private async updateCustomer(
    args: {
      customerId: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      companyName?: string;
      notes?: string;
      doNotService?: boolean;
    },
    tenantId: string
  ): Promise<FunctionResult> {
    this.logger.info('Updating customer', { customerId: args.customerId });

    const { customerId, phone, ...updates } = args;
    const updatedCustomer = await customerPostgresService.updateCustomer(tenantId, customerId, {
      ...updates,
      ...(phone && { mobilePhone: phone }),
    });

    if (!updatedCustomer) {
      return {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: `Customer with ID ${customerId} not found`,
        },
      };
    }

    return {
      status: 'success',
      data: {
        ...this.formatCustomerResponse(updatedCustomer),
        message: `Customer ${updatedCustomer.firstName} ${updatedCustomer.lastName} updated successfully`,
      },
    };
  }

  /**
   * Create a job
   */
  private async createJob(
    args: {
      customerId: string;
      addressId?: string;
      title: string;
      description?: string;
      jobTypeId?: string;
      scheduledStart?: string;
      scheduledEnd?: string;
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
      estimatedDuration?: number;
    },
    tenantId: string,
    userId: string
  ): Promise<FunctionResult> {
    this.logger.info('Creating job', { customerId: args.customerId, title: args.title });

    // Get customer to find address if not provided
    const customer = await customerPostgresService.getCustomer(tenantId, args.customerId);
    if (!customer) {
      return {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: `Customer with ID ${args.customerId} not found`,
        },
      };
    }

    // Use provided addressId or find primary address
    let addressId = args.addressId;
    if (!addressId && customer.addresses.length > 0) {
      const primaryAddress = customer.addresses.find(a => a.isPrimary) || customer.addresses[0];
      addressId = primaryAddress.id;
    }

    if (!addressId) {
      return {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Customer has no address. Please add an address first.',
        },
      };
    }

    const job = await jobPostgresService.createJob({
      tenantId,
      customerId: args.customerId,
      addressId,
      title: args.title,
      description: args.description,
      jobTypeId: args.jobTypeId,
      priority: args.priority || 'NORMAL',
      scheduledStart: args.scheduledStart ? new Date(args.scheduledStart) : undefined,
      scheduledEnd: args.scheduledEnd ? new Date(args.scheduledEnd) : undefined,
      estimatedDuration: args.estimatedDuration || 60,
      createdById: userId,
    });

    return {
      status: 'success',
      data: {
        jobId: job.id,
        jobNumber: job.jobNumber,
        customerId: job.customerId,
        customerName: `${job.customer.firstName || ''} ${job.customer.lastName || ''}`.trim() || job.customer.companyName,
        title: job.title,
        status: job.status,
        priority: job.priority,
        scheduledStart: job.scheduledStart,
        scheduledEnd: job.scheduledEnd,
        message: `Job ${job.jobNumber} created successfully for ${job.customer.firstName || job.customer.companyName}`,
      },
    };
  }

  /**
   * Get job status
   */
  private async getJobStatus(
    args: { jobId?: string; jobNumber?: string },
    tenantId: string
  ): Promise<FunctionResult> {
    this.logger.info('Getting job status', { jobId: args.jobId, jobNumber: args.jobNumber });

    let job;
    if (args.jobId) {
      job = await jobPostgresService.getJob(tenantId, args.jobId);
    } else if (args.jobNumber) {
      job = await jobPostgresService.getJobByNumber(tenantId, args.jobNumber);
    } else {
      return {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide either jobId or jobNumber',
        },
      };
    }

    if (!job) {
      return {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: `Job not found`,
        },
      };
    }

    return {
      status: 'success',
      data: {
        jobId: job.id,
        jobNumber: job.jobNumber,
        title: job.title,
        status: job.status,
        priority: job.priority,
        customerName: `${job.customer.firstName || ''} ${job.customer.lastName || ''}`.trim() || job.customer.companyName,
        address: `${job.address.street}, ${job.address.city}, ${job.address.state} ${job.address.zip}`,
        scheduledStart: job.scheduledStart,
        scheduledEnd: job.scheduledEnd,
        actualStart: job.actualStart,
        actualEnd: job.actualEnd,
        assignedTechnicians: job.assignments.map(a => ({
          name: a.employee.user ? `${a.employee.user.firstName} ${a.employee.user.lastName}` : 'Unknown',
          role: a.role,
        })),
        total: job.total,
      },
    };
  }

  /**
   * Update a job
   */
  private async updateJob(
    args: {
      jobId?: string;
      jobNumber?: string;
      status?: 'UNSCHEDULED' | 'SCHEDULED' | 'DISPATCHED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
      scheduledStart?: string;
      scheduledEnd?: string;
      cancellationReason?: string;
    },
    tenantId: string,
    userId: string
  ): Promise<FunctionResult> {
    this.logger.info('Updating job', { jobId: args.jobId, jobNumber: args.jobNumber });

    // Find job by ID or number
    let jobId = args.jobId;
    if (!jobId && args.jobNumber) {
      const job = await jobPostgresService.getJobByNumber(tenantId, args.jobNumber);
      if (job) {
        jobId = job.id;
      }
    }

    if (!jobId) {
      return {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: 'Job not found',
        },
      };
    }

    const updatedJob = await jobPostgresService.updateJob(
      tenantId,
      jobId,
      {
        status: args.status,
        priority: args.priority,
        scheduledStart: args.scheduledStart ? new Date(args.scheduledStart) : undefined,
        scheduledEnd: args.scheduledEnd ? new Date(args.scheduledEnd) : undefined,
        cancellationReason: args.cancellationReason,
      },
      userId
    );

    if (!updatedJob) {
      return {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: 'Job not found',
        },
      };
    }

    return {
      status: 'success',
      data: {
        jobId: updatedJob.id,
        jobNumber: updatedJob.jobNumber,
        status: updatedJob.status,
        priority: updatedJob.priority,
        message: `Job ${updatedJob.jobNumber} updated successfully`,
      },
    };
  }

  /**
   * Create an invoice from a job
   */
  private async createInvoice(
    args: {
      jobId: string;
      dueDate?: string;
      terms?: 'DUE_ON_RECEIPT' | 'NET_7' | 'NET_15' | 'NET_30' | 'NET_60';
    },
    tenantId: string,
    userId: string
  ): Promise<FunctionResult> {
    this.logger.info('Creating invoice', { jobId: args.jobId });

    const invoice = await invoicePostgresService.createInvoiceFromJob(tenantId, args.jobId, {
      dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
      terms: args.terms,
      createdById: userId,
    });

    if (!invoice) {
      return {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: `Job with ID ${args.jobId} not found`,
        },
      };
    }

    return {
      status: 'success',
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        jobId: invoice.jobId,
        jobNumber: invoice.job?.jobNumber,
        customerName: `${invoice.customer.firstName || ''} ${invoice.customer.lastName || ''}`.trim() || invoice.customer.companyName,
        status: invoice.status,
        total: invoice.total,
        dueDate: invoice.dueDate,
        message: `Invoice ${invoice.invoiceNumber} created successfully`,
      },
    };
  }

  /**
   * Update an invoice
   */
  private async updateInvoice(
    args: {
      invoiceId?: string;
      invoiceNumber?: string;
      status?: 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';
      paymentAmount?: number;
      paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'ACH' | 'CHECK' | 'CASH' | 'FINANCING' | 'OTHER';
      voidReason?: string;
    },
    tenantId: string
  ): Promise<FunctionResult> {
    this.logger.info('Updating invoice', { invoiceId: args.invoiceId, invoiceNumber: args.invoiceNumber });

    // Find invoice by ID or number
    let invoiceId = args.invoiceId;
    if (!invoiceId && args.invoiceNumber) {
      const invoice = await invoicePostgresService.getInvoiceByNumber(tenantId, args.invoiceNumber);
      if (invoice) {
        invoiceId = invoice.id;
      }
    }

    if (!invoiceId) {
      return {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      };
    }

    // If payment amount is provided, add payment
    if (args.paymentAmount && args.paymentMethod) {
      const payment = await invoicePostgresService.addPayment(tenantId, invoiceId, {
        amount: args.paymentAmount,
        method: args.paymentMethod,
      });

      if (!payment) {
        return {
          status: 'error',
          error: {
            code: 'NOT_FOUND',
            message: 'Invoice not found',
          },
        };
      }

      const updatedInvoice = await invoicePostgresService.getInvoice(tenantId, invoiceId);
      return {
        status: 'success',
        data: {
          invoiceId: updatedInvoice?.id,
          invoiceNumber: updatedInvoice?.invoiceNumber,
          status: updatedInvoice?.status,
          total: updatedInvoice?.total,
          amountPaid: updatedInvoice?.amountPaid,
          balanceDue: Number(updatedInvoice?.total) - Number(updatedInvoice?.amountPaid),
          message: `Payment of $${args.paymentAmount} recorded successfully`,
        },
      };
    }

    // Otherwise, update status
    const updatedInvoice = await invoicePostgresService.updateInvoice(tenantId, invoiceId, {
      status: args.status,
      voidReason: args.voidReason,
    });

    if (!updatedInvoice) {
      return {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      };
    }

    return {
      status: 'success',
      data: {
        invoiceId: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        status: updatedInvoice.status,
        message: `Invoice ${updatedInvoice.invoiceNumber} updated successfully`,
      },
    };
  }

  /**
   * Get an invoice
   */
  private async getInvoice(
    args: { invoiceId?: string; invoiceNumber?: string },
    tenantId: string
  ): Promise<FunctionResult> {
    this.logger.info('Getting invoice', { invoiceId: args.invoiceId, invoiceNumber: args.invoiceNumber });

    let invoice;
    if (args.invoiceId) {
      invoice = await invoicePostgresService.getInvoice(tenantId, args.invoiceId);
    } else if (args.invoiceNumber) {
      invoice = await invoicePostgresService.getInvoiceByNumber(tenantId, args.invoiceNumber);
    } else {
      return {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide either invoiceId or invoiceNumber',
        },
      };
    }

    if (!invoice) {
      return {
        status: 'error',
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      };
    }

    return {
      status: 'success',
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: `${invoice.customer.firstName || ''} ${invoice.customer.lastName || ''}`.trim() || invoice.customer.companyName,
        jobNumber: invoice.job?.jobNumber,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        balanceDue: Number(invoice.total) - Number(invoice.amountPaid),
        lineItems: invoice.lineItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        payments: invoice.payments.map(p => ({
          amount: p.amount,
          method: p.method,
          status: p.status,
          date: p.processedAt,
        })),
      },
    };
  }

  /**
   * Send notification (placeholder - needs SNS/SES implementation)
   */
  private async sendNotification(args: {
    to: string;
    channel: 'sms' | 'email' | 'push';
    message: string;
    subject?: string;
  }): Promise<FunctionResult> {
    this.logger.info('Sending notification', { to: args.to, channel: args.channel });

    // TODO: Implement notification sending with SNS/SES
    return {
      status: 'success',
      data: {
        notificationId: `notif-${Date.now()}`,
        to: args.to,
        channel: args.channel,
        status: 'sent',
        message: `Notification sent to ${args.to} via ${args.channel}`,
      },
    };
  }

  /**
   * Format customer response for consistency
   */
  private formatCustomerResponse(customer: any) {
    const primaryAddress = customer.addresses?.find((a: any) => a.isPrimary) || customer.addresses?.[0];
    return {
      customerId: customer.id,
      customerNumber: customer.customerNumber,
      type: customer.type,
      firstName: customer.firstName,
      lastName: customer.lastName,
      companyName: customer.companyName,
      displayName: customer.companyName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      email: customer.email,
      phone: customer.mobilePhone,
      homePhone: customer.homePhone,
      workPhone: customer.workPhone,
      address: primaryAddress ? {
        street: primaryAddress.street,
        city: primaryAddress.city,
        state: primaryAddress.state,
        zip: primaryAddress.zip,
      } : null,
      totalJobs: customer.totalJobs,
      lifetimeValue: customer.lifetimeValue,
      notes: customer.notes,
      createdAt: customer.createdAt,
    };
  }
}

export const llmFunctionExecutor = new LLMFunctionExecutor();
