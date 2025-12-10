import { APIGatewayProxyHandler } from 'aws-lambda';

// Mock customer data for testing
const mockCustomers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '555-1001',
    address: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    notes: 'VIP customer - priority service',
    tenantId: 'tenant1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    phone: '555-1002',
    address: '456 Oak Avenue',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62702',
    notes: null,
    tenantId: 'tenant1',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    firstName: 'Robert',
    lastName: 'Brown',
    email: 'robert.brown@example.com',
    phone: '555-1003',
    address: '789 Pine Road',
    city: 'Riverside',
    state: 'IL',
    zipCode: '60546',
    notes: 'Commercial account - office building',
    tenantId: 'tenant1',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: '4',
    firstName: 'Jennifer',
    lastName: 'Wilson',
    email: 'jennifer.wilson@example.com',
    phone: '555-1004',
    address: '321 Elm Street',
    city: 'Aurora',
    state: 'IL',
    zipCode: '60505',
    notes: null,
    tenantId: 'tenant1',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
  {
    id: '5',
    firstName: 'Michael',
    lastName: 'Taylor',
    email: 'michael.taylor@example.com',
    phone: '555-1005',
    address: '654 Maple Drive',
    city: 'Naperville',
    state: 'IL',
    zipCode: '60540',
    notes: 'New customer - first service call',
    tenantId: 'tenant1',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
];

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('List customers called:', event);
    
    const tenantId = event.headers['x-tenant-id'] || event.headers['X-Tenant-Id'];
    console.log('Tenant ID:', tenantId);
    
    if (!tenantId) {
      return {
        statusCode: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Missing tenant ID' }),
      };
    }

    const { page = '1', limit = '20', search } = event.queryStringParameters || {};
    console.log('Query params:', { page, limit, search });

    // Filter mock customers by tenant and search
    let filteredCustomers = mockCustomers.filter(c => c.tenantId === tenantId);
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(c => 
        c.firstName.toLowerCase().includes(searchLower) ||
        c.lastName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone.includes(search)
      );
    }

    const total = filteredCustomers.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const customers = filteredCustomers.slice(skip, skip + parseInt(limit));

    console.log(`Returning ${customers.length} customers out of ${total} total`);

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      }),
    };
  } catch (error) {
    console.error('Error listing customers:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to list customers',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export const listCustomersHandler = handler;
