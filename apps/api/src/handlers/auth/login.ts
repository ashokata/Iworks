import { APIGatewayProxyHandler } from 'aws-lambda';
import { getPrismaClient } from '../../services/prisma.service';
import * as bcrypt from 'bcryptjs';

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

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid email or password' }),
      };
    }

    // Check if tenant is active
    if (!user.tenant || (user.tenant.status !== 'ACTIVE' && user.tenant.status !== 'TRIAL')) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Your company account is not active' }),
      };
    }

    // Check password
    let passwordValid = false;
    if (user.passwordHash) {
      const isBcryptHash = /^\$2[ayb]\$.{56}$/.test(user.passwordHash);
      if (isBcryptHash) {
        try {
          passwordValid = await bcrypt.compare(password, user.passwordHash);
        } catch {
          passwordValid = false;
        }
      } else {
        passwordValid = password === user.passwordHash;
      }
    }

    if (!passwordValid) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid email or password' }),
      };
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

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
          tenant: user.tenant,
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

