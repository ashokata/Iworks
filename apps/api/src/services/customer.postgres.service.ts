import { getPrismaClient, Customer, Address } from './prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateCustomerInput {
  tenantId: string;
  type?: 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  mobilePhone?: string;
  homePhone?: string;
  workPhone?: string;
  preferredContactMethod?: 'SMS' | 'EMAIL' | 'VOICE' | 'PUSH' | 'IN_APP';
  notificationsEnabled?: boolean;
  notes?: string;
  customFields?: Record<string, any>;
  // Address
  street?: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface UpdateCustomerInput {
  type?: 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  mobilePhone?: string;
  homePhone?: string;
  workPhone?: string;
  preferredContactMethod?: 'SMS' | 'EMAIL' | 'VOICE' | 'PUSH' | 'IN_APP';
  notes?: string;
  customFields?: Record<string, any>;
  doNotService?: boolean;
  doNotServiceReason?: string;
  notificationsEnabled?: boolean;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED';
}

export interface CustomerWithAddresses extends Customer {
  addresses: Address[];
}

export interface SearchCustomersParams {
  tenantId: string;
  query?: string;
  type?: 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR';
  limit?: number;
  offset?: number;
}

class CustomerPostgresService {
  /**
   * Create a new customer with optional primary address
   */
  async createCustomer(input: CreateCustomerInput): Promise<CustomerWithAddresses> {
    const prisma = getPrismaClient();
    
    // Normalize tenant ID: remove whitespace, take first value if comma-separated
    const normalizedTenantId = String(input.tenantId).trim().split(',')[0].trim();
    
    // Validate tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: normalizedTenantId },
      select: { id: true, name: true, status: true },
    });

    if (!tenant) {
      throw new Error(`Tenant with ID '${normalizedTenantId}' does not exist. Please verify your tenant configuration.`);
    }

    if (tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
      throw new Error(`Tenant '${tenant.name}' (${input.tenantId}) is ${tenant.status.toLowerCase()}. Please contact your administrator.`);
    }

    console.log('[PG-Customer] Validated tenant:', { tenantId: tenant.id, tenantName: tenant.name, status: tenant.status });
    
    // Generate customer number
    const customerCount = await prisma.customer.count({
      where: { tenantId: normalizedTenantId },
    });
    const customerNumber = `CUST-${String(customerCount + 1).padStart(6, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        tenantId: normalizedTenantId,
        customerNumber,
        type: input.type || 'RESIDENTIAL',
        firstName: input.firstName,
        lastName: input.lastName,
        companyName: input.companyName,
        email: input.email,
        mobilePhone: input.mobilePhone,
        homePhone: input.homePhone,
        workPhone: input.workPhone,
        preferredContactMethod: input.preferredContactMethod,
        notificationsEnabled: input.notificationsEnabled,
        notes: input.notes,
        customFields: input.customFields || {},
        // Create primary address if street is provided
        addresses: input.street ? {
          create: {
            type: 'SERVICE',
            street: input.street,
            streetLine2: input.streetLine2,
            city: input.city || '',
            state: input.state || '',
            zip: input.zip || '',
            country: input.country || 'US',
            isPrimary: true,
          },
        } : undefined,
      },
      include: {
        addresses: true,
      },
    });

    console.log('[PG-Customer] Created customer:', customer.id, customer.customerNumber);
    return customer;
  }

  /**
   * Get a customer by ID with addresses
   */
  async getCustomer(tenantId: string, customerId: string): Promise<CustomerWithAddresses | null> {
    const prisma = getPrismaClient();
    
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId,
        isArchived: false,
      },
      include: {
        addresses: true,
      },
    });

    console.log('[PG-Customer] Get customer:', customerId, customer ? 'found' : 'not found');
    return customer;
  }

  /**
   * List customers for a tenant with pagination
   */
  async listCustomers(
    tenantId: string, 
    options?: { limit?: number; offset?: number; includeArchived?: boolean }
  ): Promise<{ customers: CustomerWithAddresses[]; total: number }> {
    const prisma = getPrismaClient();
    const { limit = 50, offset = 0, includeArchived = false } = options || {};

    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(includeArchived ? {} : { isArchived: false }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          addresses: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.customer.count({ where }),
    ]);

    console.log('[PG-Customer] List customers for tenant:', tenantId, 'count:', customers.length);
    return { customers, total };
  }

  /**
   * Update a customer
   */
  async updateCustomer(
    tenantId: string, 
    customerId: string, 
    input: UpdateCustomerInput
  ): Promise<CustomerWithAddresses | null> {
    const prisma = getPrismaClient();

    // Verify customer exists and belongs to tenant
    const existing = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!existing) {
      console.log('[PG-Customer] Customer not found for update:', customerId);
      return null;
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        type: input.type,
        firstName: input.firstName,
        lastName: input.lastName,
        companyName: input.companyName,
        email: input.email,
        mobilePhone: input.mobilePhone,
        homePhone: input.homePhone,
        workPhone: input.workPhone,
        preferredContactMethod: input.preferredContactMethod,
        notes: input.notes,
        customFields: input.customFields,
        doNotService: input.doNotService,
        doNotServiceReason: input.doNotServiceReason,
        notificationsEnabled: input.notificationsEnabled,
        verificationStatus: input.verificationStatus,
      },
      include: {
        addresses: true,
      },
    });

    console.log('[PG-Customer] Updated customer:', customerId);
    return customer;
  }

  /**
   * Soft delete (archive) a customer
   */
  async deleteCustomer(tenantId: string, customerId: string): Promise<boolean> {
    const prisma = getPrismaClient();

    const result = await prisma.customer.updateMany({
      where: { id: customerId, tenantId },
      data: { 
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    console.log('[PG-Customer] Archived customer:', customerId, 'affected:', result.count);
    return result.count > 0;
  }

  /**
   * Search customers by name, email, phone
   */
  async searchCustomers(params: SearchCustomersParams): Promise<CustomerWithAddresses[]> {
    const prisma = getPrismaClient();
    const { tenantId, query, type, limit = 20, offset = 0 } = params;

    const where: Prisma.CustomerWhereInput = {
      tenantId,
      isArchived: false,
      ...(type && { type }),
      ...(query && {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { mobilePhone: { contains: query } },
          { homePhone: { contains: query } },
          { workPhone: { contains: query } },
          { customerNumber: { contains: query, mode: 'insensitive' } },
        ],
      }),
    };

    const customers = await prisma.customer.findMany({
      where,
      include: {
        addresses: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
      take: limit,
      skip: offset,
    });

    console.log('[PG-Customer] Search:', query, 'found:', customers.length);
    return customers;
  }

  /**
   * Add an address to a customer
   */
  async addAddress(
    tenantId: string,
    customerId: string,
    address: {
      type?: 'SERVICE' | 'BILLING' | 'PRIMARY';
      name?: string;
      street: string;
      streetLine2?: string;
      city: string;
      state: string;
      zip: string;
      country?: string;
      accessNotes?: string;
      gateCode?: string;
      isPrimary?: boolean;
    }
  ): Promise<Address | null> {
    const prisma = getPrismaClient();

    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      return null;
    }

    // If this is primary, unset other primary addresses
    if (address.isPrimary) {
      await prisma.address.updateMany({
        where: { customerId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        customerId,
        type: address.type || 'SERVICE',
        name: address.name,
        street: address.street,
        streetLine2: address.streetLine2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country || 'US',
        accessNotes: address.accessNotes,
        gateCode: address.gateCode,
        isPrimary: address.isPrimary || false,
      },
    });

    console.log('[PG-Customer] Added address:', newAddress.id, 'to customer:', customerId);
    return newAddress;
  }

  /**
   * Update an address
   */
  async updateAddress(
    tenantId: string,
    customerId: string,
    addressId: string,
    address: {
      type?: 'SERVICE' | 'BILLING' | 'PRIMARY';
      name?: string;
      street?: string;
      streetLine2?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      accessNotes?: string;
      gateCode?: string;
      isPrimary?: boolean;
    }
  ): Promise<Address | null> {
    const prisma = getPrismaClient();

    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      return null;
    }

    // Verify address belongs to customer
    const existingAddress = await prisma.address.findFirst({
      where: { id: addressId, customerId },
    });

    if (!existingAddress) {
      return null;
    }

    // If setting this as primary, unset other primary addresses
    if (address.isPrimary) {
      await prisma.address.updateMany({
        where: { customerId, isPrimary: true, id: { not: addressId } },
        data: { isPrimary: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        type: address.type,
        name: address.name,
        street: address.street,
        streetLine2: address.streetLine2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        accessNotes: address.accessNotes,
        gateCode: address.gateCode,
        isPrimary: address.isPrimary,
      },
    });

    console.log('[PG-Customer] Updated address:', addressId);
    return updatedAddress;
  }

  /**
   * Delete an address
   */
  async deleteAddress(
    tenantId: string,
    customerId: string,
    addressId: string
  ): Promise<boolean> {
    const prisma = getPrismaClient();

    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      return false;
    }

    // Verify address belongs to customer
    const existingAddress = await prisma.address.findFirst({
      where: { id: addressId, customerId },
    });

    if (!existingAddress) {
      return false;
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    console.log('[PG-Customer] Deleted address:', addressId);
    return true;
  }

  /**
   * Get customer by customer number
   */
  async getCustomerByNumber(tenantId: string, customerNumber: string): Promise<CustomerWithAddresses | null> {
    const prisma = getPrismaClient();
    
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId,
        customerNumber,
        isArchived: false,
      },
      include: {
        addresses: true,
      },
    });

    return customer;
  }

  /**
   * Get customers with jobs summary (for dashboard)
   */
  async getCustomersWithJobSummary(tenantId: string, limit = 10): Promise<any[]> {
    const prisma = getPrismaClient();
    
    const customers = await prisma.customer.findMany({
      where: { tenantId, isArchived: false },
      include: {
        addresses: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: { jobs: true, invoices: true },
        },
      },
      orderBy: { lifetimeValue: 'desc' },
      take: limit,
    });

    return customers.map(c => ({
      ...c,
      jobCount: c._count.jobs,
      invoiceCount: c._count.invoices,
      primaryAddress: c.addresses[0] || null,
    }));
  }
}

export const customerPostgresService = new CustomerPostgresService();

