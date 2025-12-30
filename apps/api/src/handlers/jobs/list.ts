import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPrismaClient } from '../../services/prisma.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[Jobs-List] Handler invoked');
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id,Authorization',
  };

  try {
    const prisma = getPrismaClient();
    
    // Get tenant ID from header - REQUIRED for tenant isolation
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'] || event.headers['X-Tenant-ID'];
    
    if (!tenantId) {
      console.error('[Jobs-List] ❌ Missing tenant ID in request headers');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Tenant ID is required',
          message: 'Please ensure you are logged in and your session is valid'
        }),
      };
    }
    
    console.log('[Jobs-List] Tenant ID:', tenantId);

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const limit = Math.min(parseInt(queryParams.limit || '50', 10), 100);
    const offset = parseInt(queryParams.offset || '0', 10);
    const status = queryParams.status;

    console.log('[Jobs-List] Query params:', { limit, offset, status });

    // Use raw SQL to avoid schema mismatch
    let jobs: any[];
    let total: number;

    if (status) {
      jobs = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          j.id, j."jobNumber", j.title, j.description, j.status, j.priority,
          j."scheduledDate", j."completedDate", j."estimatedDuration", j."actualDuration",
          j.address, j.city, j.state, j."zipCode",
          j."customerId", j."assignedToId", j."tenantId",
          j."createdAt", j."updatedAt",
          c."firstName" as customer_first_name, c."lastName" as customer_last_name, c.email as customer_email
        FROM jobs j
        LEFT JOIN customers c ON j."customerId" = c.id
        WHERE j."tenantId" = $1 AND j.status = $2
        ORDER BY j."scheduledDate" DESC
        LIMIT $3 OFFSET $4
      `, tenantId, status, limit, offset);

      const countResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) as count FROM jobs WHERE "tenantId" = $1 AND status = $2
      `, tenantId, status);
      total = parseInt(countResult[0]?.count || '0', 10);
    } else {
      jobs = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          j.id, j."jobNumber", j.title, j.description, j.status, j.priority,
          j."scheduledDate", j."completedDate", j."estimatedDuration", j."actualDuration",
          j.address, j.city, j.state, j."zipCode",
          j."customerId", j."assignedToId", j."tenantId",
          j."createdAt", j."updatedAt",
          c."firstName" as customer_first_name, c."lastName" as customer_last_name, c.email as customer_email
        FROM jobs j
        LEFT JOIN customers c ON j."customerId" = c.id
        WHERE j."tenantId" = $1
        ORDER BY j."scheduledDate" DESC
        LIMIT $2 OFFSET $3
      `, tenantId, limit, offset);

      const countResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) as count FROM jobs WHERE "tenantId" = $1
      `, tenantId);
      total = parseInt(countResult[0]?.count || '0', 10);
    }

    console.log('[Jobs-List] Found jobs:', jobs.length);

    // Format response for frontend compatibility
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      jobId: job.id,
      jobNumber: job.jobNumber,
      title: job.title,
      description: job.description,
      status: job.status,
      priority: job.priority,
      scheduledDate: job.scheduledDate,
      scheduledStart: job.scheduledDate,
      completedDate: job.completedDate,
      estimatedDuration: job.estimatedDuration,
      actualDuration: job.actualDuration,
      address: job.address ? {
        street: job.address,
        city: job.city,
        state: job.state,
        zip: job.zipCode,
        fullAddress: `${job.address}, ${job.city}, ${job.state} ${job.zipCode}`.trim(),
      } : null,
      location: job.address ? `${job.address}, ${job.city}, ${job.state} ${job.zipCode}`.trim() : '',
      customer: {
        id: job.customerId,
        firstName: job.customer_first_name,
        lastName: job.customer_last_name,
        email: job.customer_email,
        fullName: `${job.customer_first_name || ''} ${job.customer_last_name || ''}`.trim(),
      },
      customerId: job.customerId,
      assignedToId: job.assignedToId,
      tenantId: job.tenantId,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        jobs: formattedJobs,
        total,
        limit,
        offset,
      }),
    };
  } catch (error: any) {
    console.error('[Jobs-List] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }),
    };
  }
};

