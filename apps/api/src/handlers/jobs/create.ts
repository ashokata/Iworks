import { APIGatewayProxyHandler } from 'aws-lambda';
import { prisma } from '../../utils/db';
import { z } from 'zod';

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  customerId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedDuration: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
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
    const data = createJobSchema.parse(body);

    // Generate job number
    const jobCount = await prisma.job.count({ where: { tenantId } });
    const jobNumber = `JOB-${String(jobCount + 1).padStart(6, '0')}`;

    const job = await prisma.job.create({
      data: {
        ...data,
        jobNumber,
        tenantId,
        scheduledDate: new Date(data.scheduledDate),
      },
      include: {
        customer: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    };
  } catch (error) {
    console.error('Error creating job:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create job' }),
    };
  }
};

export const createJobHandler = handler;
