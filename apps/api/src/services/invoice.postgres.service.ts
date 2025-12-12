import { getPrismaClient, Invoice, InvoiceLineItem, Payment } from './prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateInvoiceInput {
  tenantId: string;
  customerId: string;
  jobId?: string;
  dueDate: Date;
  terms?: 'DUE_ON_RECEIPT' | 'NET_7' | 'NET_15' | 'NET_30' | 'NET_60';
  poNumber?: string;
  message?: string;
  footerNotes?: string;
  taxRate?: number;
  createdById?: string;
}

export interface UpdateInvoiceInput {
  status?: 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID' | 'REFUNDED';
  dueDate?: Date;
  terms?: 'DUE_ON_RECEIPT' | 'NET_7' | 'NET_15' | 'NET_30' | 'NET_60';
  poNumber?: string;
  message?: string;
  footerNotes?: string;
  taxRate?: number;
  voidReason?: string;
}

export interface InvoiceWithRelations extends Invoice {
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string | null;
    mobilePhone: string | null;
  };
  job: {
    id: string;
    jobNumber: string;
    title: string;
  } | null;
  lineItems: InvoiceLineItem[];
  payments: Payment[];
}

export interface SearchInvoicesParams {
  tenantId: string;
  status?: string | string[];
  customerId?: string;
  jobId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  query?: string;
  limit?: number;
  offset?: number;
}

class InvoicePostgresService {
  /**
   * Create a new invoice
   */
  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceWithRelations> {
    const prisma = getPrismaClient();
    
    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { tenantId: input.tenantId },
    });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: input.tenantId,
        invoiceNumber,
        customerId: input.customerId,
        jobId: input.jobId,
        status: 'DRAFT',
        issueDate: new Date(),
        dueDate: input.dueDate,
        terms: input.terms || 'DUE_ON_RECEIPT',
        poNumber: input.poNumber,
        message: input.message,
        footerNotes: input.footerNotes,
        taxRate: input.taxRate || 0,
        createdById: input.createdById,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            mobilePhone: true,
          },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
        lineItems: true,
        payments: true,
      },
    });

    console.log('[PG-Invoice] Created invoice:', invoice.id, invoice.invoiceNumber);
    return invoice as InvoiceWithRelations;
  }

  /**
   * Create invoice from a job (copy line items)
   */
  async createInvoiceFromJob(
    tenantId: string,
    jobId: string,
    options?: {
      dueDate?: Date;
      terms?: 'DUE_ON_RECEIPT' | 'NET_7' | 'NET_15' | 'NET_30' | 'NET_60';
      createdById?: string;
    }
  ): Promise<InvoiceWithRelations | null> {
    const prisma = getPrismaClient();

    // Get the job with line items
    const job = await prisma.job.findFirst({
      where: { id: jobId, tenantId },
      include: {
        lineItems: true,
      },
    });

    if (!job) {
      console.log('[PG-Invoice] Job not found:', jobId);
      return null;
    }

    // Calculate due date based on terms
    const terms = options?.terms || 'DUE_ON_RECEIPT';
    let dueDate = options?.dueDate || new Date();
    
    if (!options?.dueDate) {
      const daysMap: Record<string, number> = {
        'DUE_ON_RECEIPT': 0,
        'NET_7': 7,
        'NET_15': 15,
        'NET_30': 30,
        'NET_60': 60,
      };
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (daysMap[terms] || 0));
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { tenantId },
    });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Create invoice with line items
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        customerId: job.customerId,
        jobId: job.id,
        status: 'DRAFT',
        issueDate: new Date(),
        dueDate,
        terms,
        subtotal: job.subtotal,
        taxRate: Number(job.taxAmount) / Number(job.subtotal) * 100 || 0,
        taxAmount: job.taxAmount,
        total: job.total,
        createdById: options?.createdById,
        lineItems: {
          create: job.lineItems.map((item, index) => ({
            jobLineItemId: item.id,
            type: item.type,
            serviceId: item.serviceId,
            materialId: item.materialId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            isTaxable: item.isTaxable,
            sortOrder: index,
          })),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            mobilePhone: true,
          },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
        lineItems: true,
        payments: true,
      },
    });

    // Update job status to INVOICED
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'INVOICED' },
    });

    console.log('[PG-Invoice] Created invoice from job:', invoice.invoiceNumber, 'job:', job.jobNumber);
    return invoice as InvoiceWithRelations;
  }

  /**
   * Get an invoice by ID
   */
  async getInvoice(tenantId: string, invoiceId: string): Promise<InvoiceWithRelations | null> {
    const prisma = getPrismaClient();
    
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            mobilePhone: true,
          },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    console.log('[PG-Invoice] Get invoice:', invoiceId, invoice ? 'found' : 'not found');
    return invoice as InvoiceWithRelations | null;
  }

  /**
   * List invoices with filters
   */
  async listInvoices(params: SearchInvoicesParams): Promise<{ invoices: InvoiceWithRelations[]; total: number }> {
    const prisma = getPrismaClient();
    const { tenantId, status, customerId, jobId, dueBefore, dueAfter, query, limit = 50, offset = 0 } = params;

    const where: Prisma.InvoiceWhereInput = {
      tenantId,
      ...(status && {
        status: Array.isArray(status) 
          ? { in: status as any[] }
          : status as any,
      }),
      ...(customerId && { customerId }),
      ...(jobId && { jobId }),
      ...(dueBefore && { dueDate: { lte: dueBefore } }),
      ...(dueAfter && { dueDate: { gte: dueAfter } }),
      ...(query && {
        OR: [
          { invoiceNumber: { contains: query, mode: 'insensitive' } },
          { poNumber: { contains: query, mode: 'insensitive' } },
        ],
      }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
              mobilePhone: true,
            },
          },
          job: {
            select: {
              id: true,
              jobNumber: true,
              title: true,
            },
          },
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.invoice.count({ where }),
    ]);

    console.log('[PG-Invoice] List invoices for tenant:', tenantId, 'count:', invoices.length);
    return { invoices: invoices as InvoiceWithRelations[], total };
  }

  /**
   * Update an invoice
   */
  async updateInvoice(
    tenantId: string,
    invoiceId: string,
    input: UpdateInvoiceInput
  ): Promise<InvoiceWithRelations | null> {
    const prisma = getPrismaClient();

    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!existing) {
      console.log('[PG-Invoice] Invoice not found for update:', invoiceId);
      return null;
    }

    const updateData: Prisma.InvoiceUpdateInput = {
      ...(input.status && { status: input.status }),
      ...(input.dueDate && { dueDate: input.dueDate }),
      ...(input.terms && { terms: input.terms }),
      ...(input.poNumber !== undefined && { poNumber: input.poNumber }),
      ...(input.message !== undefined && { message: input.message }),
      ...(input.footerNotes !== undefined && { footerNotes: input.footerNotes }),
      ...(input.taxRate !== undefined && { taxRate: input.taxRate }),
    };

    // Handle status-specific updates
    if (input.status === 'SENT' && !existing.sentAt) {
      updateData.sentAt = new Date();
    } else if (input.status === 'VIEWED' && !existing.viewedAt) {
      updateData.viewedAt = new Date();
    } else if (input.status === 'PAID') {
      updateData.paidAt = new Date();
    } else if (input.status === 'VOID') {
      updateData.voidedAt = new Date();
      updateData.voidReason = input.voidReason;
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            mobilePhone: true,
          },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        payments: true,
      },
    });

    console.log('[PG-Invoice] Updated invoice:', invoiceId);
    return invoice as InvoiceWithRelations;
  }

  /**
   * Add a payment to an invoice
   */
  async addPayment(
    tenantId: string,
    invoiceId: string,
    payment: {
      amount: number;
      method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'ACH' | 'CHECK' | 'CASH' | 'FINANCING' | 'OTHER';
      transactionId?: string;
      authorizationCode?: string;
      cardBrand?: string;
      cardLastFour?: string;
      checkNumber?: string;
      collectedById?: string;
      notes?: string;
    }
  ): Promise<Payment | null> {
    const prisma = getPrismaClient();

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      return null;
    }

    const newPayment = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount: payment.amount,
        method: payment.method,
        status: 'COMPLETED',
        transactionId: payment.transactionId,
        authorizationCode: payment.authorizationCode,
        cardBrand: payment.cardBrand,
        cardLastFour: payment.cardLastFour,
        checkNumber: payment.checkNumber,
        collectedById: payment.collectedById,
        notes: payment.notes,
        processedAt: new Date(),
      },
    });

    // Update invoice amount paid
    const newAmountPaid = Number(invoice.amountPaid) + payment.amount;
    const newStatus = newAmountPaid >= Number(invoice.total) ? 'PAID' : 'PARTIAL';

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
        ...(newStatus === 'PAID' && { paidAt: new Date() }),
      },
    });

    // If invoice is paid and linked to a job, update job status
    if (newStatus === 'PAID' && invoice.jobId) {
      await prisma.job.update({
        where: { id: invoice.jobId },
        data: { status: 'PAID' },
      });
    }

    console.log('[PG-Invoice] Added payment:', newPayment.id, 'amount:', payment.amount, 'to invoice:', invoiceId);
    return newPayment;
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(tenantId: string): Promise<InvoiceWithRelations[]> {
    const prisma = getPrismaClient();

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['SENT', 'VIEWED', 'PARTIAL'] },
        dueDate: { lt: new Date() },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            mobilePhone: true,
          },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
        lineItems: true,
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    // Update status to OVERDUE
    const overdueIds = invoices.filter(i => i.status !== 'OVERDUE').map(i => i.id);
    if (overdueIds.length > 0) {
      await prisma.invoice.updateMany({
        where: { id: { in: overdueIds } },
        data: { status: 'OVERDUE' },
      });
    }

    console.log('[PG-Invoice] Overdue invoices:', invoices.length);
    return invoices as InvoiceWithRelations[];
  }

  /**
   * Get invoice by invoice number
   */
  async getInvoiceByNumber(tenantId: string, invoiceNumber: string): Promise<InvoiceWithRelations | null> {
    const prisma = getPrismaClient();
    
    const invoice = await prisma.invoice.findFirst({
      where: {
        tenantId,
        invoiceNumber,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            mobilePhone: true,
          },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        payments: true,
      },
    });

    return invoice as InvoiceWithRelations | null;
  }

  /**
   * Get invoice summary for dashboard
   */
  async getInvoiceSummary(tenantId: string): Promise<{
    totalOutstanding: number;
    totalOverdue: number;
    countDraft: number;
    countSent: number;
    countOverdue: number;
    countPaid: number;
  }> {
    const prisma = getPrismaClient();

    const [outstanding, overdue, counts] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['SENT', 'VIEWED', 'PARTIAL', 'OVERDUE'] },
        },
        _sum: {
          total: true,
          amountPaid: true,
        },
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'OVERDUE',
        },
        _sum: {
          total: true,
          amountPaid: true,
        },
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
    ]);

    const countMap = counts.reduce((acc, c) => {
      acc[c.status] = c._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOutstanding: Number(outstanding._sum.total || 0) - Number(outstanding._sum.amountPaid || 0),
      totalOverdue: Number(overdue._sum.total || 0) - Number(overdue._sum.amountPaid || 0),
      countDraft: countMap['DRAFT'] || 0,
      countSent: (countMap['SENT'] || 0) + (countMap['VIEWED'] || 0),
      countOverdue: countMap['OVERDUE'] || 0,
      countPaid: countMap['PAID'] || 0,
    };
  }
}

export const invoicePostgresService = new InvoicePostgresService();

