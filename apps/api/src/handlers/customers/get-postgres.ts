import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { customerPostgresService } from '../../services/customer.postgres.service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[PG-Get] Handler invoked');
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Tenant-Id,X-User-Id',
  };

  try {
    // Get tenant ID from header
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'] || 'default-tenant';
    console.log('[PG-Get] Tenant ID:', tenantId);

    // Get customer ID from path
    const customerId = event.pathParameters?.customerId || event.pathParameters?.id;
    if (!customerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Customer ID is required' }),
      };
    }

    console.log('[PG-Get] Customer ID:', customerId);

    // Get customer
    const customer = await customerPostgresService.getCustomer(tenantId, customerId);

    if (!customer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Customer not found' }),
      };
    }

    console.log('[PG-Get] Customer found:', customer.id);

    // Format response for frontend compatibility
    const primaryAddress = customer.addresses?.find(a => a.isPrimary) || customer.addresses?.[0];
    const response = {
      customer: {
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
        preferredContactMethod: customer.preferredContactMethod,
        notificationsEnabled: customer.notificationsEnabled,
        doNotService: customer.doNotService,
        doNotServiceReason: customer.doNotServiceReason,
        tenantId: customer.tenantId,
        createdAt: customer.createdAt,
        created_at: customer.createdAt,
        updatedAt: customer.updatedAt,
        updated_at: customer.updatedAt,
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('[PG-Get] Error:', error);
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

