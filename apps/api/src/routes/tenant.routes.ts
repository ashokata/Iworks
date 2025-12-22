import { Router } from 'express';
import { getPrismaClient } from '../services/prisma.service';
import * as bcrypt from 'bcryptjs';

const router = Router();
const prisma = getPrismaClient();

// List all tenants (for login dropdown)
router.get('/api/tenants', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        status: {
          in: ['TRIAL', 'ACTIVE']
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({ tenants });
  } catch (error: any) {
    console.error('[API] List tenants error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single tenant
router.get('/api/tenants/:id', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          where: { isActive: true },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ tenant });
  } catch (error: any) {
    console.error('[API] Get tenant error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Register new tenant
router.post('/api/tenants/register', async (req, res) => {
  try {
    const { company, admin } = req.body;

    // Validate required fields
    if (!company?.name || !company?.domain || !admin?.email || !admin?.password) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['company.name', 'company.domain', 'admin.email', 'admin.password'],
      });
    }

    // Generate slug from company name
    const slug = company.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if tenant with this slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return res.status(409).json({
        error: 'A company with this name already exists. Please choose a different name.',
      });
    }

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: company.name,
          slug,
          status: 'TRIAL',
          settings: {
            domain: company.domain,
            email: company.email,
            phone: company.phone,
            address: company.address,
            city: company.city,
            state: company.state,
            zipCode: company.zipCode,
            country: company.country || 'United States',
          },
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          tenant: {
            connect: { id: tenant.id }
          },
          email: admin.email,
          passwordHash: admin.password, // In production, hash this!
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: 'OWNER', // Use OWNER role for the first admin
          isActive: true,
          isVerified: true,
        },
      });

      return { tenant, user };
    });

    console.log('[API] Tenant registered successfully:', result.tenant.name);

    res.status(201).json({
      message: 'Registration successful',
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
    });
  } catch (error: any) {
    console.error('[API] Register tenant error:', error);

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'A company with this information already exists',
      });
    }

    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('[API] Login attempt:', { email: email?.substring(0, 5) + '***', hasPassword: !!password });

    // Validate required fields
    if (!email || !password) {
      console.log('[API] Login failed: missing email or password');
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Find user by email (across all tenants)
    // Note: In a multi-tenant system, email should be unique per tenant, but we search across all tenants
    // to automatically identify which tenant the user belongs to
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

    console.log('[API] User lookup result:', { found: !!user, userId: user?.id, tenantId: user?.tenantId });

    if (!user) {
      console.log('[API] Login failed: user not found');
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Check if tenant is active
    if (!user.tenant || (user.tenant.status !== 'ACTIVE' && user.tenant.status !== 'TRIAL')) {
      console.log('[API] Login failed: tenant not active', { tenantStatus: user.tenant?.status });
      return res.status(403).json({
        error: 'Your company account is not active. Please contact your administrator.',
      });
    }

    // Check password - handle both bcrypt hashed and plain text passwords
    let passwordValid = false;
    if (user.passwordHash) {
      // Check if passwordHash looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
      const isBcryptHash = /^\$2[ayb]\$.{56}$/.test(user.passwordHash);
      
      if (isBcryptHash) {
        // Use bcrypt.compare for hashed passwords
        try {
          passwordValid = await bcrypt.compare(password, user.passwordHash);
          console.log('[API] Password check (bcrypt):', passwordValid);
        } catch (bcryptError: any) {
          console.error('[API] Bcrypt compare error:', bcryptError);
          passwordValid = false;
        }
      } else {
        // Plain text password - compare directly (for local development)
        // This handles passwords like 'demo-hash' or 'password123'
        passwordValid = password === user.passwordHash;
        console.log('[API] Password check (plain text):', passwordValid, { provided: password, stored: user.passwordHash });
      }
    } else {
      // Fallback for development/testing if passwordHash is null
      passwordValid = password === 'password123';
      console.log('[API] Password check (fallback - no hash):', passwordValid);
    }

    if (!passwordValid) {
      console.log('[API] Login failed: invalid password');
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate a simple token (in production, use JWT)
    const token = `token-${user.id}-${Date.now()}`;

    console.log('[API] Login successful:', { userId: user.id, tenantId: user.tenantId });

    res.json({
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
    });
  } catch (error: any) {
    console.error('[API] Login error:', error);
    console.error('[API] Login error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
