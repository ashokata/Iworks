/**
 * PUT /api/estimates/:id
 * Update an existing estimate
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('[UpdateEstimate] Event:', JSON.stringify(event, null, 2));

  try {
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'];
    
    if (!tenantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Tenant ID is required' }),
      };
    }

    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Estimate ID is required' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    // Verify estimate exists
    const existing = await prisma.estimate.findFirst({
      where: { id, tenantId },
      include: {
        options: {
          include: {
            lineItems: true,
          },
        },
      },
    });

    if (!existing) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Estimate not found' }),
      };
    }

    const body = JSON.parse(event.body);
    const {
      title,
      message,
      termsAndConditions,
      validUntil,
      status,
      options,
    } = body;

    // Build update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (termsAndConditions !== undefined) updateData.termsAndConditions = termsAndConditions;
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null;
    
    // Handle status changes with timestamps
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'SENT' && !existing.sentAt) {
        updateData.sentAt = new Date();
      } else if (status === 'VIEWED' && !existing.viewedAt) {
        updateData.viewedAt = new Date();
      } else if (status === 'APPROVED' && !existing.approvedAt) {
        updateData.approvedAt = new Date();
      } else if (status === 'DECLINED' && !existing.declinedAt) {
        updateData.declinedAt = new Date();
      } else if (status === 'EXPIRED' && !existing.expiredAt) {
        updateData.expiredAt = new Date();
      }
    }

    // Handle options update if provided
    if (options && Array.isArray(options)) {
      // First, get all option IDs for this estimate
      const existingOptions = await prisma.estimateOption.findMany({
        where: { estimateId: id },
        select: { id: true },
      });
      
      const optionIds = existingOptions.map(opt => opt.id);
      
      // Delete existing line items using option IDs
      if (optionIds.length > 0) {
        await prisma.estimateLineItem.deleteMany({
          where: {
            estimateOptionId: {
              in: optionIds,
            },
          },
        });
      }
      
      // Delete existing options
      await prisma.estimateOption.deleteMany({
        where: { estimateId: id },
      });

      // Get tax rate from first option or use existing
      const taxRate = options[0]?.taxRate || existing.options[0]?.taxRate || 0;

      // Process and create new options
      const processedOptions = options.map((option: any, optionIndex: number) => {
        const lineItems = option.lineItems || [];
        
        const subtotal = lineItems.reduce((sum: number, item: any) => {
          return sum + (item.quantity * item.unitPrice);
        }, 0);

        let discountAmount = 0;
        if (option.discountType === 'PERCENTAGE') {
          discountAmount = subtotal * (option.discountValue / 100);
        } else if (option.discountType === 'FIXED_AMOUNT') {
          discountAmount = option.discountValue || 0;
        }

        const taxableAmount = lineItems
          .filter((item: any) => item.isTaxable !== false)
          .reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
        
        const afterDiscount = taxableAmount - (taxableAmount / subtotal) * discountAmount;
        const taxAmount = afterDiscount * (taxRate / 100);
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

      const estimateSubtotal = processedOptions.reduce((sum, opt) => sum + opt.subtotal, 0);
      const estimateDiscountAmount = processedOptions.reduce((sum, opt) => sum + opt.discountAmount, 0);
      const estimateTaxAmount = processedOptions.reduce((sum, opt) => sum + opt.taxAmount, 0);
      const estimateTotal = processedOptions.reduce((sum, opt) => sum + opt.total, 0);

      updateData.subtotal = estimateSubtotal;
      updateData.discountAmount = estimateDiscountAmount;
      updateData.taxAmount = estimateTaxAmount;
      updateData.total = estimateTotal;

      updateData.options = {
        create: processedOptions,
      };
    }

    // Update estimate
    const estimate = await prisma.estimate.update({
      where: { id },
      data: updateData,
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

    console.log('[UpdateEstimate] Updated:', estimate.id);

    return {
      statusCode: 200,
      body: JSON.stringify(estimate),
    };
  } catch (error: any) {
    console.error('[UpdateEstimate] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to update estimate',
        message: error.message,
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
