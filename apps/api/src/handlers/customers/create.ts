import { APIGatewayProxyHandler } from 'aws-lambda';
import { prisma } from '../../utils/db';
import { z } from 'zod';

const createCustomerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

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
    const data = createCustomerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        ...data,
        tenantId,
      },
    });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create customer' }),
    };
  }
};

export const createCustomerHandler = handler;
