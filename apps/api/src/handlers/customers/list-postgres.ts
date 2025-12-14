import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { customerPostgresService } from '../../services/customer.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[PG-List] Handler invoked');
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    // Get tenant ID from header
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'] || 'default-tenant';
    console.log('[PG-List] Tenant ID:', tenantId);

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '50', 10);
    const offset = parseInt(queryParams.offset || '0', 10);
    const search = queryParams.search || queryParams.query;
    const type = queryParams.type as 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR' | undefined;
    const includeArchived = queryParams.includeArchived === 'true';

    console.log('[PG-List] Query params:', { limit, offset, search, type, includeArchived });

    let result;
    
    if (search) {
      // Search customers
      const customers = await customerPostgresService.searchCustomers({
        tenantId,
        query: search,
        type,
        limit,
        offset,
      });
      result = { customers, total: customers.length };
    } else {
      // List all customers
      result = await customerPostgresService.listCustomers(tenantId, {
        limit,
        offset,
        includeArchived,
      });
    }

    console.log('[PG-List] Found customers:', result.customers.length);

    // Format response for frontend compatibility
    const formattedCustomers = result.customers.map(customer => {
      const primaryAddress = customer.addresses?.find(a => a.isPrimary) || customer.addresses?.[0];
      return {
        id: customer.id,
        customerId: customer.id,
        customerNumber: customer.customerNumber,
        type: customer.type,
        firstName: customer.firstName,
        lastName: customer.lastName,
        first_name: customer.firstName,
        last_name: customer.lastName,
        display_name: customer.companyName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        companyName: customer.companyName,
        company: customer.companyName,
        email: customer.email,
        mobilePhone: customer.mobilePhone,
        mobile_number: customer.mobilePhone,
        homePhone: customer.homePhone,
        home_number: customer.homePhone,
        workPhone: customer.workPhone,
        work_number: customer.workPhone,
        notes: customer.notes,
        address: primaryAddress ? {
          street: primaryAddress.street,
          city: primaryAddress.city,
          state: primaryAddress.state,
          zip: primaryAddress.zip,
        } : null,
        addresses: customer.addresses,
        totalJobs: customer.totalJobs,
        lifetimeValue: customer.lifetimeValue,
        tenantId: customer.tenantId,
        verificationStatus: (customer as any).verificationStatus || 'VERIFIED',
        verification_status: (customer as any).verificationStatus || 'VERIFIED',
        createdSource: (customer as any).createdSource || 'WEB',
        created_source: (customer as any).createdSource || 'WEB',
        createdAt: customer.createdAt,
        created_at: customer.createdAt,
        updatedAt: customer.updatedAt,
        updated_at: customer.updatedAt,
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        customers: formattedCustomers,
        total: result.total,
        limit,
        offset,
      }),
    };
  } catch (error: any) {
    console.error('[PG-List] Error:', error);
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

