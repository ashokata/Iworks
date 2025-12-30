import { APIGatewayProxyHandler } from 'aws-lambda';
import { getPrismaClient } from '../../services/prisma.service';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Tenant-Id',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export const handler: APIGatewayProxyHandler = async (event) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  try {
    const prisma = getPrismaClient();
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    console.log('[Auth Login] Attempt:', { email: email?.substring(0, 5) + '***' });

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Email and password are required' }),
      };
    }

    // Find user by email using raw SQL to avoid schema mismatch
    const users = await prisma.$queryRawUnsafe(`
      SELECT 
        u.id, u.email, u."passwordHash", u."firstName", u."lastName", 
        u.role, u."tenantId", u."isActive",
        t.id as "tenant_id", t.name as "tenant_name"
      FROM users u
      LEFT JOIN tenants t ON u."tenantId" = t.id
      WHERE LOWER(u.email) = LOWER($1) AND u."isActive" = true
      LIMIT 1
    `, email.trim()) as any[];

    if (!users || users.length === 0) {
      console.log('[Auth Login] User not found');
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid email or password' }),
      };
    }

    const user = users[0];
    console.log('[Auth Login] Found user:', { id: user.id, email: user.email });

    // Check password - plain text comparison for demo
    const passwordValid = password === user.passwordHash;
    console.log('[Auth Login] Password check:', { valid: passwordValid });

    if (!passwordValid) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid email or password' }),
      };
    }

    // Generate token
    const token = `token-${user.id}-${Date.now()}`;

    console.log('[Auth Login] Success:', { userId: user.id, tenantId: user.tenantId });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: user.role,
          tenantId: user.tenantId,
          tenant: {
            id: user.tenant_id,
            name: user.tenant_name,
          },
        },
      }),
    };
  } catch (error: any) {
    console.error('[Auth Login] Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
