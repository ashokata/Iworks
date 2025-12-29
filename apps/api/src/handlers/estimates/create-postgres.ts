/**
 * POST /api/estimates
 * Create a new estimate
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('[CreateEstimate] Event:', JSON.stringify(event, null, 2));

  try {
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'];
    
    if (!tenantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Tenant ID is required' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body = JSON.parse(event.body);
    const {
      customerId,
      addressId,
      title,
      message,
      termsAndConditions,
      validUntil,
      status = 'DRAFT',
      taxRate = 0,
      options = [],
    } = body;

    // Validate required fields
    if (!customerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Customer ID is required' }),
      };
    }

    if (!addressId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Address ID is required' }),
      };
    }

    if (!options || options.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'At least one estimate option is required' }),
      };
    }

    // Verify customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Customer not found' }),
      };
    }

    // Verify address exists
    const address = await prisma.address.findFirst({
      where: { 
        id: addressId, 
        customerId,
        customer: {
          tenantId,
        },
      },
    });

    if (!address) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Address not found' }),
      };
    }

    // Generate estimate number with retry logic to prevent duplicates
    let estimateNumber: string;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (retryCount < maxRetries) {
      const lastEstimate = await prisma.estimate.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: { estimateNumber: true },
      });

      let nextNumber = 1;
      if (lastEstimate?.estimateNumber) {
        const match = lastEstimate.estimateNumber.match(/EST-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      estimateNumber = `EST-${nextNumber.toString().padStart(4, '0')}`;
      
      // Check if this number already exists (race condition protection)
      const existingEstimate = await prisma.estimate.findFirst({
        where: { 
          tenantId,
          estimateNumber 
        },
      });
      
      if (!existingEstimate) {
        break; // Number is unique, proceed
      }
      
      retryCount++;
      if (retryCount >= maxRetries) {
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Failed to generate unique estimate number. Please try again.' 
          }),
        };
      }
    }

    // Calculate totals for each option
    const processedOptions = options.map((option: any, optionIndex: number) => {
      const lineItems = option.lineItems || [];
      
      // Calculate subtotal from line items
      const subtotal = lineItems.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);

      // Calculate discount
      let discountAmount = 0;
      if (option.discountType === 'PERCENTAGE') {
        discountAmount = subtotal * (option.discountValue / 100);
      } else if (option.discountType === 'FIXED_AMOUNT') {
        discountAmount = option.discountValue || 0;
      }

      // Calculate tax
      const taxableAmount = lineItems
        .filter((item: any) => item.isTaxable !== false)
        .reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
      
      const afterDiscount = taxableAmount - (taxableAmount / subtotal) * discountAmount;
      const taxAmount = afterDiscount * (taxRate / 100);

      // Calculate total
      const total = subtotal - discountAmount + taxAmount;

      return {
        name: option.name,
        description: option.description || null,
        coverImageUrl: option.coverImageUrl || null,
        isRecommended: option.isRecommended || false,
        subtotal,
        discountType: option.discountType || 'NONE',
        discountValue: option.discountValue || 0,
        discountAmount,
        taxRate,
        taxAmount,
        total,
        sortOrder: option.sortOrder !== undefined ? option.sortOrder : optionIndex,
        lineItems: {
          create: lineItems.map((item: any, itemIndex: number) => ({
            type: item.type,
            name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost || 0,
            isTaxable: item.isTaxable !== false,
            isOptional: item.isOptional || false,
            isSelected: item.isSelected !== false,
            sortOrder: item.sortOrder !== undefined ? item.sortOrder : itemIndex,
          })),
        },
      };
    });

    // Calculate estimate totals
    const estimateSubtotal = processedOptions.reduce((sum, opt) => sum + opt.subtotal, 0);
    const estimateDiscountAmount = processedOptions.reduce((sum, opt) => sum + opt.discountAmount, 0);
    const estimateTaxAmount = processedOptions.reduce((sum, opt) => sum + opt.taxAmount, 0);
    const estimateTotal = processedOptions.reduce((sum, opt) => sum + opt.total, 0);

    // Create estimate with options and line items
    const estimate = await prisma.estimate.create({
      data: {
        tenantId,
        customerId,
        addressId,
        estimateNumber,
        status,
        title: title || null,
        message: message || null,
        termsAndConditions: termsAndConditions || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        subtotal: estimateSubtotal,
        discountAmount: estimateDiscountAmount,
        taxAmount: estimateTaxAmount,
        total: estimateTotal,
        sentAt: status === 'SENT' ? new Date() : null,
        options: {
          create: processedOptions,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            mobilePhone: true,
          },
        },
        address: {
          select: {
            street: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        options: {
          include: {
            lineItems: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    console.log('[CreateEstimate] Created:', estimate.id);

    return {
      statusCode: 201,
      body: JSON.stringify(estimate),
    };
  } catch (error: any) {
    console.error('[CreateEstimate] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create estimate',
        message: error.message,
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
