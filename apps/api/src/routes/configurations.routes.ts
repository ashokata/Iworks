/**
 * Configurations API Routes
 * Handles CRUD operations for master/lookup tables
 */

import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../services/prisma.service';
import permissionService from '../services/permission.postgres.service';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const prisma = getPrismaClient();

// Debug logging helper for Node.js
const debugLog = (location: string, message: string, data: any, hypothesisId: string) => {
  const logEntry = {
    location,
    message,
    data,
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId
  };
  const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
  try {
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  } catch (e) {
    // Ignore logging errors
  }
};

// Helper to get tenant ID from headers
const getTenantId = (req: Request): string | null => {
  return (req.headers['x-tenant-id'] || req.headers['X-Tenant-Id'] || req.headers['X-Tenant-ID']) as string || null;
};

// ============================================================================
// PERMISSIONS
// ============================================================================

// Get all available permissions
router.get('/api/configurations/permissions', async (req: Request, res: Response) => {
  try {
    const allPermissions = permissionService.getAllPermissions();
    const permissionsByCategory = permissionService.getPermissionsByCategory();
    
    res.json({
      permissions: allPermissions,
      byCategory: permissionsByCategory
    });
  } catch (error: any) {
    console.error('[Config] Get permissions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ROLES
// ============================================================================

router.get('/api/configurations/roles', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const roles = await prisma.role.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { employeeAssignments: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ roles });
  } catch (error: any) {
    console.error('[Config] List roles error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/configurations/roles/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const role = await prisma.role.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        employeeAssignments: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ role });
  } catch (error: any) {
    console.error('[Config] Get role error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/configurations/roles', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, slug, description, permissions, isSystem } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    // Validate permissions array
    if (permissions && !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    // Ensure permissions is an array (default to empty array)
    const permissionsArray = Array.isArray(permissions) ? permissions : [];

    console.log('[Config] Creating role:', {
      tenantId,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      permissionsCount: permissionsArray.length,
      permissions: permissionsArray
    });

    const role = await prisma.role.create({
      data: {
        tenantId,
        name: name.trim(),
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').trim(),
        description: description || null,
        permissions: permissionsArray,
        isSystem: isSystem || false
      }
    });

    res.status(201).json({ role });
  } catch (error: any) {
    console.error('[Config] Create role error:', error);
    console.error('[Config] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ 
      error: error.message || 'Failed to create role',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

router.put('/api/configurations/roles/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, slug, description, permissions } = req.body;

    const role = await prisma.role.update({
      where: { id: req.params.id },
      data: {
        name,
        slug,
        description,
        permissions: permissions || undefined
      }
    });

    res.json({ role });
  } catch (error: any) {
    console.error('[Config] Update role error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/configurations/roles/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const role = await prisma.role.findFirst({
      where: { id: req.params.id, tenantId }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(400).json({ error: 'Cannot delete system role' });
    }

    await prisma.role.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Config] Delete role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign role to employee
router.post('/api/configurations/roles/:roleId/assign', async (req: Request, res: Response) => {
  // #region agent log
  debugLog('configurations.routes.ts:174', 'Assign role endpoint called', {path:req.path,method:req.method,params:req.params,headers:Object.keys(req.headers)}, 'A');
  // #endregion
  try {
    const tenantId = getTenantId(req);
    // #region agent log
    debugLog('configurations.routes.ts:177', 'Tenant ID extracted', {tenantId,allHeaders:Object.keys(req.headers),xTenantId:req.headers['x-tenant-id'],XTenantId:req.headers['X-Tenant-Id']}, 'B');
    // #endregion
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { employeeId } = req.body;
    const roleId = req.params.roleId;
    // #region agent log
    debugLog('configurations.routes.ts:184', 'Request data extracted', {employeeId,roleId,bodyKeys:Object.keys(req.body || {}),bodyType:typeof req.body}, 'E');
    // #endregion

    console.log('[Config] Assign role request:', { tenantId, employeeId, roleId, body: req.body });

    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    if (!roleId) {
      return res.status(400).json({ error: 'Role ID is required' });
    }

    // Verify employee exists and belongs to tenant
    // #region agent log
    debugLog('configurations.routes.ts:195', 'Before employee lookup', {employeeId,tenantId,employeeIdType:typeof employeeId,tenantIdType:typeof tenantId}, 'C');
    // #endregion
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    // #region agent log
    debugLog('configurations.routes.ts:210', 'After employee lookup', {found:!!employee,employeeId,tenantId,employeeTenantId:employee?.tenantId}, 'C');
    // #endregion

    console.log('[Config] Employee lookup result:', { 
      found: !!employee, 
      employeeId, 
      tenantId,
      employeeTenantId: employee?.tenantId 
    });

    if (!employee) {
      // Check if employee exists at all (for debugging)
      const anyEmployee = await prisma.employee.findFirst({
        where: { id: employeeId },
        select: { id: true, tenantId: true }
      });
      // #region agent log
      debugLog('configurations.routes.ts:221', 'Employee not found - checking any tenant', {employeeId,tenantId,anyEmployeeExists:!!anyEmployee,anyEmployeeTenantId:anyEmployee?.tenantId}, 'C');
      // #endregion
      console.log('[Config] Employee exists in any tenant:', !!anyEmployee);
      if (anyEmployee) {
        console.log('[Config] Employee belongs to tenant:', anyEmployee.tenantId, 'Request tenant:', tenantId);
      }
      
      return res.status(404).json({ 
        error: 'Employee not found or does not belong to this tenant',
        details: { 
          employeeId, 
          tenantId, 
          employeeExists: !!anyEmployee,
          employeeTenantId: anyEmployee?.tenantId
        }
      });
    }

    // Verify role exists and belongs to tenant
    // #region agent log
    debugLog('configurations.routes.ts:242', 'Before role lookup', {roleId,tenantId,roleIdType:typeof roleId}, 'D');
    // #endregion
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId
      }
    });
    // #region agent log
    debugLog('configurations.routes.ts:247', 'After role lookup', {found:!!role,roleId,tenantId,roleTenantId:role?.tenantId}, 'D');
    // #endregion

    console.log('[Config] Role lookup result:', { 
      found: !!role, 
      roleId, 
      tenantId,
      roleTenantId: role?.tenantId 
    });

    if (!role) {
      // Check if role exists at all (for debugging)
      const anyRole = await prisma.role.findFirst({
        where: { id: roleId },
        select: { id: true, tenantId: true, name: true }
      });
      // #region agent log
      debugLog('configurations.routes.ts:256', 'Role not found - checking any tenant', {roleId,tenantId,anyRoleExists:!!anyRole,anyRoleTenantId:anyRole?.tenantId,anyRoleName:anyRole?.name}, 'D');
      // #endregion
      console.log('[Config] Role exists in any tenant:', !!anyRole);
      if (anyRole) {
        console.log('[Config] Role belongs to tenant:', anyRole.tenantId, 'Request tenant:', tenantId);
        console.log('[Config] Role name:', anyRole.name);
      }
      
      return res.status(404).json({ 
        error: 'Role not found or does not belong to this tenant',
        details: { 
          roleId, 
          tenantId, 
          roleExists: !!anyRole,
          roleTenantId: anyRole?.tenantId,
          roleName: anyRole?.name
        }
      });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.employeeRoleAssignment.findUnique({
      where: {
        employeeId_roleId: {
          employeeId,
          roleId
        }
      }
    });

    if (existingAssignment) {
      return res.status(409).json({ error: 'Role is already assigned to this employee' });
    }

    // Create the assignment
    const assignment = await prisma.employeeRoleAssignment.create({
      data: {
        employeeId,
        roleId
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        role: true
      }
    });

    res.status(201).json({ assignment });
  } catch (error: any) {
    console.error('[Config] Assign role error:', error);
    console.error('[Config] Error details:', {
      code: error.code,
      meta: error.meta,
      message: error.message,
      stack: error.stack
    });
    
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Role is already assigned to this employee' });
    }
    
    // Handle foreign key constraint violations
    if (error.code === 'P2003') {
      return res.status(404).json({ error: 'Employee or role not found' });
    }

    res.status(500).json({ 
      error: error.message || 'Failed to assign role',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Unassign role from employee
router.delete('/api/configurations/roles/:roleId/unassign/:employeeId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    await prisma.employeeRoleAssignment.delete({
      where: {
        employeeId_roleId: {
          employeeId: req.params.employeeId,
          roleId: req.params.roleId
        }
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Config] Unassign role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get employee role assignments
router.get('/api/configurations/employees/:employeeId/roles', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const assignments = await prisma.employeeRoleAssignment.findMany({
      where: {
        employeeId: req.params.employeeId,
        employee: {
          tenantId
        }
      },
      include: {
        role: true,
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({ assignments });
  } catch (error: any) {
    console.error('[Config] Get employee roles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LEAD SOURCES
// ============================================================================

router.get('/api/configurations/lead-sources', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const leadSources = await prisma.leadSource.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { customers: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ leadSources });
  } catch (error: any) {
    console.error('[Config] List lead sources error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/configurations/lead-sources', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, description, isActive } = req.body;

    const leadSource = await prisma.leadSource.create({
      data: {
        tenantId,
        name,
        description,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({ leadSource });
  } catch (error: any) {
    console.error('[Config] Create lead source error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/configurations/lead-sources/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, description, isActive } = req.body;

    const leadSource = await prisma.leadSource.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        isActive
      }
    });

    res.json({ leadSource });
  } catch (error: any) {
    console.error('[Config] Update lead source error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/configurations/lead-sources/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    await prisma.leadSource.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Config] Delete lead source error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TAGS
// ============================================================================

router.get('/api/configurations/tags', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { entityType } = req.query;

    const tags = await prisma.tag.findMany({
      where: {
        tenantId,
        ...(entityType && { entityType: entityType as string })
      },
      include: {
        _count: {
          select: { customerTags: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ tags });
  } catch (error: any) {
    console.error('[Config] List tags error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/configurations/tags', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, colorHex, entityType } = req.body;

    const tag = await prisma.tag.create({
      data: {
        tenantId,
        name,
        colorHex: colorHex || '#3B82F6',
        entityType: entityType || 'customer'
      }
    });

    res.status(201).json({ tag });
  } catch (error: any) {
    console.error('[Config] Create tag error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/configurations/tags/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, colorHex, entityType } = req.body;

    const tag = await prisma.tag.update({
      where: { id: req.params.id },
      data: {
        name,
        colorHex,
        entityType
      }
    });

    res.json({ tag });
  } catch (error: any) {
    console.error('[Config] Update tag error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/configurations/tags/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    await prisma.tag.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Config] Delete tag error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SKILLS
// ============================================================================

router.get('/api/configurations/skills', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const skills = await prisma.skill.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { employeeSkills: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ skills });
  } catch (error: any) {
    console.error('[Config] List skills error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/configurations/skills', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, category, description, requiresCertification, certificationName, isActive } = req.body;

    const skill = await prisma.skill.create({
      data: {
        tenantId,
        name,
        category,
        description,
        requiresCertification: requiresCertification || false,
        certificationName,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({ skill });
  } catch (error: any) {
    console.error('[Config] Create skill error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/configurations/skills/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, category, description, requiresCertification, certificationName, isActive } = req.body;

    const skill = await prisma.skill.update({
      where: { id: req.params.id },
      data: {
        name,
        category,
        description,
        requiresCertification,
        certificationName,
        isActive
      }
    });

    res.json({ skill });
  } catch (error: any) {
    console.error('[Config] Update skill error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/configurations/skills/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    await prisma.skill.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Config] Delete skill error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// JOB TYPES
// ============================================================================

router.get('/api/configurations/job-types', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const jobTypes = await prisma.jobType.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { jobs: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({ jobTypes });
  } catch (error: any) {
    console.error('[Config] List job types error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/configurations/job-types', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, description, colorHex, defaultDuration, defaultPriority, sortOrder, isActive } = req.body;

    const jobType = await prisma.jobType.create({
      data: {
        tenantId,
        name,
        description,
        colorHex: colorHex || '#3B82F6',
        defaultDuration: defaultDuration || 60,
        defaultPriority: defaultPriority || 'NORMAL',
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({ jobType });
  } catch (error: any) {
    console.error('[Config] Create job type error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/configurations/job-types/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, description, colorHex, defaultDuration, defaultPriority, sortOrder, isActive } = req.body;

    const jobType = await prisma.jobType.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        colorHex,
        defaultDuration,
        defaultPriority,
        sortOrder,
        isActive
      }
    });

    res.json({ jobType });
  } catch (error: any) {
    console.error('[Config] Update job type error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/configurations/job-types/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    await prisma.jobType.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Config] Delete job type error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LABOR RATES
// ============================================================================

router.get('/api/configurations/labor-rates', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const laborRates = await prisma.laborRate.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });

    res.json({ laborRates });
  } catch (error: any) {
    console.error('[Config] List labor rates error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/configurations/labor-rates', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, description, hourlyRate, overtimeMultiplier, emergencyMultiplier, isDefault, isActive } = req.body;

    const laborRate = await prisma.laborRate.create({
      data: {
        tenantId,
        name,
        description,
        hourlyRate,
        overtimeMultiplier: overtimeMultiplier || 1.5,
        emergencyMultiplier: emergencyMultiplier || 2.0,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({ laborRate });
  } catch (error: any) {
    console.error('[Config] Create labor rate error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/configurations/labor-rates/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { name, description, hourlyRate, overtimeMultiplier, emergencyMultiplier, isDefault, isActive } = req.body;

    const laborRate = await prisma.laborRate.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        hourlyRate,
        overtimeMultiplier,
        emergencyMultiplier,
        isDefault,
        isActive
      }
    });

    res.json({ laborRate });
  } catch (error: any) {
    console.error('[Config] Update labor rate error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/configurations/labor-rates/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    await prisma.laborRate.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Config] Delete labor rate error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

