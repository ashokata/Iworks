import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../services/prisma.service';
import { employeePostgresService } from '../services/employee.postgres.service';
import * as bcrypt from 'bcryptjs';

const router = Router();
const prisma = getPrismaClient();

// Password hashing using bcryptjs
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

// Helper to get tenant ID from request
const getTenantId = (req: Request): string | null => {
  return (req.headers['x-tenant-id'] || 
          req.headers['X-Tenant-Id'] || 
          req.headers['X-Tenant-ID']) as string | null;
};

// List all users for the tenant
router.get('/api/users', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            jobTitle: true,
            department: true,
          },
        },
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    res.json({ users });
  } catch (error: any) {
    console.error('[Users] List users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single user
router.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            jobTitle: true,
            department: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('[Users] Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new user
router.post('/api/users', async (req: Request, res: Response) => {
  try {
    console.log('[Users] Create user request received:', {
      body: req.body,
      headers: { tenantId: req.headers['x-tenant-id'] }
    });

    const tenantId = getTenantId(req);
    if (!tenantId) {
      console.error('[Users] Missing tenant ID');
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { email, firstName, lastName, phone, role, password, isActive, isVerified } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      console.error('[Users] Missing required fields:', { email: !!email, firstName: !!firstName, lastName: !!lastName });
      return res.status(400).json({ error: 'Email, first name, and last name are required' });
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        tenantId,
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password if provided
    let passwordHash = '';
    if (password) {
      passwordHash = await hashPassword(password);
    } else {
      // Generate a temporary password (user should reset it)
      passwordHash = await hashPassword('temp-' + Date.now());
    }

    console.log('[Users] Creating user with data:', {
      tenantId,
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      role: role || 'FIELD_TECH',
      hasPassword: !!passwordHash
    });

    const userData: any = {
      tenantId: tenantId || undefined, // Set to undefined if null (schema allows optional)
      email: email.toLowerCase().trim(),
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || null,
      role: role || 'FIELD_TECH',
      passwordHash: passwordHash || undefined,
      isActive: isActive !== undefined ? isActive : true,
      isVerified: isVerified !== undefined ? isVerified : false,
    };

    console.log('[Users] User data to create:', { ...userData, passwordHash: '[REDACTED]' });

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            jobTitle: true,
            department: true,
          },
        },
      },
    });

    console.log('[Users] User created successfully:', user.id);

    // Try to match with existing employee by email
    let matchedEmployee = false;
    try {
      matchedEmployee = await employeePostgresService.matchEmployeeWithUser(tenantId, email.toLowerCase().trim(), user.id);
      if (matchedEmployee) {
        console.log('[Users] Employee matched successfully');
        // Re-fetch user with employee relation
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            isVerified: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            employee: {
              select: {
                id: true,
                employeeNumber: true,
                jobTitle: true,
                department: true,
              },
            },
          },
        });
        return res.status(201).json({ user: updatedUser || user });
      } else {
        console.log('[Users] No employee found with matching email');
      }
    } catch (e: any) {
      console.error('[Users] Error matching employee:', e);
      console.error('[Users] Error details:', e.message, e.stack);
    }

    res.status(201).json({ user });
  } catch (error: any) {
    console.error('[Users] Create user error:', error);
    console.error('[Users] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ 
      error: error.message || 'Failed to create user',
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        meta: error.meta
      } : undefined
    });
  }
});

// Update a user
router.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { id } = req.params;
    const { email, firstName, lastName, phone, role, password, isActive, isVerified } = req.body;

    // Verify user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being changed and if it conflicts
    if (email && email.toLowerCase().trim() !== existingUser.email) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          tenantId,
          NOT: { id },
        },
      });

      if (emailConflict) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    // Hash password if provided
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            jobTitle: true,
            department: true,
          },
        },
      },
    });

    res.json({ user });
  } catch (error: any) {
    console.error('[Users] Update user error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Manually link an employee to a user
router.post('/api/users/:userId/link-employee/:employeeId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { userId, employeeId } = req.params;

    // Verify user exists and belongs to tenant
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify employee exists and belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee is already linked to another user
    if (employee.userId && employee.userId !== userId) {
      return res.status(409).json({ error: 'Employee is already linked to another user' });
    }

    // Link employee to user
    await prisma.employee.update({
      where: { id: employeeId },
      data: { userId },
    });

    // Update employee email if not set
    if (!(employee as any).email && user.email) {
      await prisma.employee.update({
        where: { id: employeeId },
        data: { email: user.email.toLowerCase().trim() } as any,
      });
    }

    // Fetch updated user with employee
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            jobTitle: true,
            department: true,
          },
        },
      },
    });

    res.json({ user: updatedUser, message: 'Employee linked successfully' });
  } catch (error: any) {
    console.error('[Users] Link employee error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a user
router.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { id } = req.params;

    // Verify user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deleting the last admin/owner
    const adminCount = await prisma.user.count({
      where: {
        tenantId,
        role: { in: ['OWNER', 'ADMIN'] },
        isActive: true,
      },
    });

    if (adminCount <= 1 && (existingUser.role === 'OWNER' || existingUser.role === 'ADMIN')) {
      return res.status(400).json({ error: 'Cannot delete the last admin/owner user' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('[Users] Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

