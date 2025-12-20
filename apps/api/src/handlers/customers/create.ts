import { APIGatewayProxyHandler } from 'aws-lambda';
import { prisma } from '../../utils/db';
import { z } from 'zod';

const createCustomerSchema = z.object({
  // Basic fields - matching Prisma schema (all optional except tenantId which is added later)
  customerNumber: z.string().optional(),
  type: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'CONTRACTOR', 'HOMEOWNER', 'BUSINESS']).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  mobilePhone: z.string().optional(),
  homePhone: z.string().optional(),
  workPhone: z.string().optional(),
  preferredContactMethod: z.enum(['SMS', 'EMAIL', 'PHONE', 'WHATSAPP']).optional(),
  notificationsEnabled: z.boolean().optional(),
  doNotService: z.boolean().optional(),
  doNotServiceReason: z.string().optional(),
  leadSourceId: z.string().optional(),
  referredByCustomerId: z.string().optional(),
  notes: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  verificationStatus: z.enum(['UNVERIFIED', 'VERIFIED', 'REJECTED']).optional(),
  createdSource: z.enum(['WEB', 'MOBILE', 'VOICE', 'API']).optional(),
  // Job title and contractor flag (not in Prisma but might be in customFields)
  jobTitle: z.string().optional(),
  isContractor: z.boolean().optional(),
}).passthrough(); // Allow extra fields for backward compatibility

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const tenantId = event.headers['x-tenant-id'];
    if (!tenantId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing tenant ID' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    console.log('[Create Customer] Received payload:', body);
    
    // Validate the request
    const validatedData = createCustomerSchema.parse(body);
    console.log('[Create Customer] Validated data:', validatedData);
    
    // Map fields to Prisma schema (use camelCase, ignore snake_case duplicates)
    const customerData: any = {
      tenantId,
    };
    
    // Only add fields that are defined and not empty strings
    if (validatedData.customerNumber) customerData.customerNumber = validatedData.customerNumber;
    
    // Map customer type - convert old values to Prisma enum values
    if (validatedData.type) {
      const typeUpper = validatedData.type.toUpperCase();
      const typeMap: Record<string, string> = {
        'HOMEOWNER': 'RESIDENTIAL',
        'BUSINESS': 'COMMERCIAL',
        'CONTRACTOR': 'CONTRACTOR',
        'RESIDENTIAL': 'RESIDENTIAL',
        'COMMERCIAL': 'COMMERCIAL',
      };
      customerData.type = typeMap[typeUpper] || 'RESIDENTIAL';
    }
    
    if (validatedData.firstName) customerData.firstName = validatedData.firstName;
    if (validatedData.lastName) customerData.lastName = validatedData.lastName;
    if (validatedData.companyName) customerData.companyName = validatedData.companyName;
    if (validatedData.email) customerData.email = validatedData.email;
    if (validatedData.mobilePhone) customerData.mobilePhone = validatedData.mobilePhone;
    if (validatedData.homePhone) customerData.homePhone = validatedData.homePhone;
    if (validatedData.workPhone) customerData.workPhone = validatedData.workPhone;
    if (validatedData.preferredContactMethod) customerData.preferredContactMethod = validatedData.preferredContactMethod;
    if (validatedData.notificationsEnabled !== undefined) customerData.notificationsEnabled = validatedData.notificationsEnabled;
    if (validatedData.doNotService !== undefined) customerData.doNotService = validatedData.doNotService;
    if (validatedData.doNotServiceReason) customerData.doNotServiceReason = validatedData.doNotServiceReason;
    if (validatedData.leadSourceId) customerData.leadSourceId = validatedData.leadSourceId;
    if (validatedData.referredByCustomerId) customerData.referredByCustomerId = validatedData.referredByCustomerId;
    if (validatedData.notes) customerData.notes = validatedData.notes;
    if (validatedData.verificationStatus) customerData.verificationStatus = validatedData.verificationStatus;
    if (validatedData.createdSource) customerData.createdSource = validatedData.createdSource;
    
    // Handle customFields - add jobTitle and isContractor if provided
    const customFields: any = validatedData.customFields || {};
    if (validatedData.jobTitle) customFields.jobTitle = validatedData.jobTitle;
    if (validatedData.isContractor !== undefined) customFields.isContractor = validatedData.isContractor;
    if (Object.keys(customFields).length > 0) {
      customerData.customFields = customFields;
    }
    
    console.log('[Create Customer] Creating customer with data:', customerData);
    
    const customer = await prisma.customer.create({
      data: customerData,
      include: {
        addresses: true,
        tags: true,
      },
    });
    
    console.log('[Create Customer] Customer created successfully:', customer.id);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    };
  } catch (error: any) {
    console.error('[Create Customer] Error:', error);
    
    // Better error response
    if (error.name === 'ZodError') {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Validation failed', 
          details: error.errors 
        }),
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create customer',
        message: error.message 
      }),
    };
  }
};

export const createCustomerHandler = handler;
