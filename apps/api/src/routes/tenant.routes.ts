import { Router } from 'express';
import { getPrismaClient } from '../services/prisma.service';

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
    const { email, password, tenantSlug } = req.body;

    // Validate required fields
    if (!email || !password || !tenantSlug) {
      return res.status(400).json({
        error: 'Email, password, and company selection are required',
      });
    }

    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'Company not found',
      });
    }

    // Find user by email and tenant
    const user = await prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant.id,
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Check password (in production, use bcrypt.compare)
    if (user.passwordHash !== password) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Generate a simple token (in production, use JWT)
    const token = `token-${user.id}-${Date.now()}`;

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
    res.status(500).json({ error: error.message });
  }
});

export default router;
