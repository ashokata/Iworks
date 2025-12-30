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
        lineItems: true,
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
      expirationDate,
      customerCanApprove,
      multipleOptionsAllowed,
      useSameAsPrimary,
      validUntil,
      status,
      taxRate,
      lineItems,
    } = body;

    // Build update data
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (termsAndConditions !== undefined) updateData.termsAndConditions = termsAndConditions;
    if (expirationDate !== undefined) updateData.expirationDate = expirationDate ? new Date(expirationDate) : null;
    if (customerCanApprove !== undefined) updateData.customerCanApprove = customerCanApprove;
    if (multipleOptionsAllowed !== undefined) updateData.multipleOptionsAllowed = multipleOptionsAllowed;
    if (useSameAsPrimary !== undefined) updateData.useSameAsPrimary = useSameAsPrimary;
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null;
    if (taxRate !== undefined) updateData.taxRate = taxRate;
    
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

    // Handle line items update if provided
    if (lineItems && Array.isArray(lineItems)) {
      // Delete existing line items
      await prisma.estimateLineItem.deleteMany({
        where: { estimateId: id },
      });

      // Calculate totals
      const subtotal = lineItems.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);

      const discountAmount = 0; // Can be added later if needed

      const taxableAmount = lineItems
        .filter((item: any) => item.isTaxable !== false)
        .reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
      
      const estimateTaxRate = taxRate !== undefined ? taxRate : existing.taxRate;
      const taxAmount = taxableAmount * (Number(estimateTaxRate) / 100);
      const total = subtotal - discountAmount + taxAmount;

      updateData.subtotal = subtotal;
      updateData.discountAmount = discountAmount;
      updateData.taxAmount = taxAmount;
      updateData.total = total;

      updateData.lineItems = {
        create: lineItems.map((item: any, itemIndex: number) => ({
          type: item.type,
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost || 0,
          isTaxable: item.isTaxable !== false,
          isOptional: item.isOptional || false,
          sortOrder: item.sortOrder !== undefined ? item.sortOrder : itemIndex,
        })),
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
        lineItems: {
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
