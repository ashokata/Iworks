import express from 'express';
import cors from 'cors';
import { getPrismaClient, disconnectPrisma } from './services/prisma.service';

// Import PostgreSQL handlers
import { handler as createCustomerHandler } from './handlers/customers/create-postgres';
import { handler as listCustomersHandler } from './handlers/customers/list-postgres';
import { handler as getCustomerHandler } from './handlers/customers/get-postgres';
import { handler as updateCustomerHandler } from './handlers/customers/update-postgres';

// Import other handlers
import { createJobHandler } from './handlers/jobs/create';
import { chatHandler } from './handlers/chat/index';
import { healthHandler } from './handlers/health/index';

// Import LLM chat handler if available
let llmChatHandler: any = null;
try {
  const llmModule = require('./handlers/llm-chat/index');
  llmChatHandler = llmModule.handler;
} catch (e) {
  console.log('LLM chat handler not available for local development');
}

// Import VAPI routes
import vapiRoutes from './routes/vapi.routes';

// Import Pricebook routes
import pricebookRoutes from './routes/pricebook.routes';

// Import Service Requests routes
import serviceRequestsRoutes from './routes/service-requests.routes';

// Import Tenant routes
import tenantRoutes from './routes/tenant.routes';

// Import Configurations routes
import configurationsRoutes from './routes/configurations.routes';

// Import Users routes
import usersRoutes from './routes/users.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Tenant isolation middleware - CRITICAL for multi-tenancy
app.use((req, res, next) => {
  const isHealthCheck = req.path === '/health' || req.path === '/health/db';
  const isAuthRoute = req.path.startsWith('/api/auth/') || req.path.startsWith('/api/tenants');

  // Normalize tenant ID from various header formats
  const tenantId = req.headers['x-tenant-id'] ||
                   req.headers['X-Tenant-Id'] ||
                   req.headers['X-Tenant-ID'] ||
                   req.headers['x-tenant-ID'];

  if (tenantId) {
    // Use the provided tenant ID
    req.headers['x-tenant-id'] = tenantId as string;
    console.log(`[API] 🔐 Request to ${req.method} ${req.path} with Tenant ID: ${tenantId}`);
  } else if (!isAuthRoute && !isHealthCheck) {
    // CRITICAL: Reject requests without tenant ID for data endpoints
    console.error(`[API] ❌ BLOCKED: Request to ${req.method} ${req.path} without tenant ID!`);
    return res.status(400).json({
      error: 'Tenant ID is required',
      message: 'Please login again to refresh your session'
    });
  }

  // Set default user ID if not provided
  if (!req.headers['x-user-id'] && !req.headers['X-User-Id']) {
    req.headers['x-user-id'] = 'system-user';
  }

  next();
});

// Register VAPI routes
app.use(vapiRoutes);

// Register Pricebook routes
app.use(pricebookRoutes);

// Register Service Requests routes
app.use(serviceRequestsRoutes);

// Register Tenant routes
app.use(tenantRoutes);

// Register Configurations routes
app.use(configurationsRoutes);

// Register Users routes
app.use(usersRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    const event = { httpMethod: 'GET', headers: req.headers };
    const result = await healthHandler(event as any, {} as any, {} as any);
    if (result) {
      res.status(result.statusCode).json(JSON.parse(result.body));
    } else {
      res.status(500).json({ error: 'Health check failed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error: any) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// ============================================================================
// CUSTOMER ROUTES (PostgreSQL)
// ============================================================================

app.post('/customers', async (req, res) => {
  try {
    console.log('[API] POST /customers - Request body:', JSON.stringify(req.body));
    const event = {
      httpMethod: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
      pathParameters: null,
      queryStringParameters: null,
    };
    const result = await createCustomerHandler(event as any);
    console.log('[API] POST /customers - Response status:', result.statusCode);
    console.log('[API] POST /customers - Response body:', result.body);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] Create customer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if email exists for tenant
app.get('/customers/check-email', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const email = req.query.email as string;
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }
    
    console.log(`[API] Checking email existence for tenant ${tenantId}: ${email}`);
    
    const prisma = getPrismaClient();
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        tenantId,
        email,
        isArchived: false,
      },
    });
    
    const exists = !!existingCustomer;
    console.log(`[API] Email ${email} exists: ${exists}`);
    
    res.status(200).json({ exists });
  } catch (error: any) {
    console.error('[API] Check email error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/customers', async (req, res) => {
  try {
    const event = {
      httpMethod: 'GET',
      headers: req.headers,
      queryStringParameters: req.query as any,
      pathParameters: null,
      body: null,
    };
    const result = await listCustomersHandler(event as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] List customers error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/customers/:id', async (req, res) => {
  try {
    const event = {
      httpMethod: 'GET',
      headers: req.headers,
      pathParameters: { customerId: req.params.id },
      queryStringParameters: null,
      body: null,
    };
    const result = await getCustomerHandler(event as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] Get customer error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/customers/:id', async (req, res) => {
  try {
    const event = {
      httpMethod: 'PUT',
      headers: req.headers,
      pathParameters: { customerId: req.params.id },
      body: JSON.stringify(req.body),
      queryStringParameters: null,
    };
    const result = await updateCustomerHandler(event as any);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] Update customer error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/customers/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    const customerId = req.params.id;
    
    console.log('[API] Deleting (archiving) customer:', customerId);
    
    const success = await customerPostgresService.deleteCustomer(tenantId, customerId);
    
    if (!success) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.status(200).json({ message: 'Customer archived successfully', customerId });
  } catch (error: any) {
    console.error('[API] Delete customer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ADDRESS ROUTES (PostgreSQL)
// ============================================================================

import { customerPostgresService } from './services/customer.postgres.service';

// Map frontend address type to backend enum
const mapAddressType = (frontendType: string | undefined): 'SERVICE' | 'BILLING' | 'PRIMARY' => {
  if (!frontendType) return 'SERVICE';
  const typeMap: Record<string, 'SERVICE' | 'BILLING' | 'PRIMARY'> = {
    'Primary': 'PRIMARY',
    'primary': 'PRIMARY',
    'Billing': 'BILLING',
    'billing': 'BILLING',
    'Service': 'SERVICE',
    'service': 'SERVICE',
    'Both': 'PRIMARY',
    'both': 'PRIMARY',
    'SERVICE': 'SERVICE',
    'BILLING': 'BILLING',
    'PRIMARY': 'PRIMARY',
  };
  return typeMap[frontendType] || 'SERVICE';
};

// Add address to customer
app.post('/customers/:customerId/addresses', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    const customerId = req.params.customerId;
    
    console.log('[API] Adding address to customer:', customerId, req.body);
    
    // Map frontend field names to backend
    const addressData = {
      type: mapAddressType(req.body.addressType || req.body.type),
      name: req.body.name,
      street: req.body.street || req.body.Street,
      streetLine2: req.body.streetLine2 || req.body.street2 || req.body.Street2,
      city: req.body.city || req.body.City,
      state: req.body.state || req.body.State,
      zip: req.body.zip || req.body.zipCode || req.body.ZipCode || req.body.postalCode,
      country: req.body.country || 'US',
      accessNotes: req.body.accessNotes,
      gateCode: req.body.gateCode,
      isPrimary: req.body.isPrimary ?? false,
    };
    
    const address = await customerPostgresService.addAddress(tenantId, customerId, addressData as any);
    
    if (!address) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.status(201).json({ address });
  } catch (error: any) {
    console.error('[API] Add address error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update address
app.put('/customers/:customerId/addresses/:addressId', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    const { customerId, addressId } = req.params;
    
    console.log('[API] Updating address:', addressId, 'for customer:', customerId, req.body);
    
    // Map frontend field names to backend
    const rawType = req.body.addressType || req.body.type;
    const addressData = {
      type: rawType ? mapAddressType(rawType) : undefined,
      name: req.body.name,
      street: req.body.street || req.body.Street,
      streetLine2: req.body.streetLine2 || req.body.street2 || req.body.Street2,
      city: req.body.city || req.body.City,
      state: req.body.state || req.body.State,
      zip: req.body.zip || req.body.zipCode || req.body.ZipCode || req.body.postalCode,
      country: req.body.country,
      accessNotes: req.body.accessNotes,
      gateCode: req.body.gateCode,
      isPrimary: req.body.isPrimary,
    };
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(addressData).filter(([_, v]) => v !== undefined)
    );
    
    const address = await customerPostgresService.updateAddress(tenantId, customerId, addressId, cleanData as any);
    
    if (!address) {
      return res.status(404).json({ error: 'Address or customer not found' });
    }
    
    res.json({ address });
  } catch (error: any) {
    console.error('[API] Update address error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete address
app.delete('/customers/:customerId/addresses/:addressId', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    const { customerId, addressId } = req.params;
    
    console.log('[API] Deleting address:', addressId, 'for customer:', customerId);
    
    const success = await customerPostgresService.deleteAddress(tenantId, customerId, addressId);
    
    if (!success) {
      return res.status(404).json({ error: 'Address or customer not found' });
    }
    
    res.status(204).send();
  } catch (error: any) {
    console.error('[API] Delete address error:', error);
    
    // Return 400 for validation errors (primary address, last address)
    if (error.message.includes('Cannot delete') || error.message.includes('must have')) {
      return res.status(400).json({ error: error.message });
    }
    
    // Return 404 for not found errors
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    // Return 500 for other errors
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EMPLOYEE ROUTES (PostgreSQL)
// ============================================================================

import { employeePostgresService } from './services/employee.postgres.service';

// List employees
app.get('/employees', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 
                     req.headers['X-Tenant-Id'] as string || 
                     req.headers['X-Tenant-ID'] as string || 
                     'local-tenant';
    
    console.log('[API] List employees - Tenant ID:', tenantId);
    console.log('[API] List employees - Headers:', {
      'x-tenant-id': req.headers['x-tenant-id'],
      'X-Tenant-Id': req.headers['X-Tenant-Id'],
      'X-Tenant-ID': req.headers['X-Tenant-ID']
    });
    
    const filters = {
      search: req.query.search as string | undefined,
      role: req.query.role as string | undefined,
      department: req.query.department as string | undefined,
      isDispatchEnabled: req.query.isDispatchEnabled === 'true' ? true : 
                         req.query.isDispatchEnabled === 'false' ? false : undefined,
      includeArchived: req.query.includeArchived === 'true',
    };
    
    const employees = await employeePostgresService.listEmployees(tenantId, filters);
    console.log('[API] Found employees for tenant:', tenantId, 'Count:', employees.length);
    
    // Format response for frontend
    const formattedEmployees = employees.map(emp => {
      // Get employee's own fields (will be available after migration)
      const empEmail = (emp as any).email || emp.user?.email || null;
      const empFirstName = (emp as any).firstName || emp.user?.firstName || null;
      const empLastName = (emp as any).lastName || emp.user?.lastName || null;
      const empPhone = (emp as any).phone || emp.user?.phone || null;
      
      return {
        id: emp.id,
        employeeId: emp.id,
        userId: emp.userId,
        // Include employee's own email/name fields (for employees without user accounts)
        email: empEmail,
        firstName: empFirstName,
        lastName: empLastName,
        phone: empPhone,
        user: emp.user ? {
        id: emp.user.id,
        email: emp.user.email,
        firstName: emp.user.firstName,
        lastName: emp.user.lastName,
        fullName: `${emp.user.firstName || ''} ${emp.user.lastName || ''}`.trim(),
        phone: emp.user.phone,
        role: emp.user.role,
        avatarUrl: emp.user.avatarUrl,
      } : null,
      employeeNumber: emp.employeeNumber,
      jobTitle: emp.jobTitle,
      department: emp.department,
      colorHex: emp.colorHex,
      hourlyRate: emp.hourlyRate?.toString(),
      overtimeRate: emp.overtimeRate?.toString(),
      commissionRate: emp.commissionRate?.toString(),
      canBeBookedOnline: emp.canBeBookedOnline,
      isDispatchEnabled: emp.isDispatchEnabled,
      receivesDispatchNotifications: emp.receivesDispatchNotifications,
      maxDailyJobs: emp.maxDailyJobs,
      hireDate: emp.hireDate,
      notes: emp.notes,
      isArchived: emp.isArchived,
      skills: emp.skills?.map((s: any) => ({
        id: s.id,
        skillId: s.skillId,
        skill: s.skill,
        proficiencyLevel: s.proficiencyLevel,
      })) || [],
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
      // Frontend compatibility fields
      name: empFirstName && empLastName 
        ? `${empFirstName} ${empLastName}`.trim() 
        : emp.user 
          ? `${emp.user.firstName || ''} ${emp.user.lastName || ''}`.trim() 
          : 'Unknown',
      email: empEmail,
      phone: empPhone,
      status: emp.isArchived ? 'Inactive' : 'Active',
      isTechnician: emp.isDispatchEnabled,
      };
    });
    
    res.json({ employees: formattedEmployees, total: formattedEmployees.length });
  } catch (error: any) {
    console.error('[API] List employees error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single employee
app.get('/employees/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    const employeeId = req.params.id;
    
    const employee = await employeePostgresService.getEmployee(tenantId, employeeId);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Format response
    const response = {
      employee: {
        id: employee.id,
        employeeId: employee.id,
        userId: employee.userId,
        user: employee.user ? {
          id: employee.user.id,
          email: employee.user.email,
          firstName: employee.user.firstName,
          lastName: employee.user.lastName,
          fullName: `${employee.user.firstName || ''} ${employee.user.lastName || ''}`.trim(),
          phone: employee.user.phone,
          role: employee.user.role,
        } : null,
        employeeNumber: employee.employeeNumber,
        jobTitle: employee.jobTitle,
        department: employee.department,
        colorHex: employee.colorHex,
        hourlyRate: employee.hourlyRate?.toString(),
        overtimeRate: employee.overtimeRate?.toString(),
        commissionRate: employee.commissionRate?.toString(),
        canBeBookedOnline: employee.canBeBookedOnline,
        isDispatchEnabled: employee.isDispatchEnabled,
        receivesDispatchNotifications: employee.receivesDispatchNotifications,
        maxDailyJobs: employee.maxDailyJobs,
        hireDate: employee.hireDate,
        notes: employee.notes,
        isArchived: employee.isArchived,
        skills: employee.skills?.map((s: any) => ({
          id: s.id,
          skillId: s.skillId,
          skill: s.skill,
          proficiencyLevel: s.proficiencyLevel,
        })) || [],
        schedules: employee.schedules || [],
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('[API] Get employee error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create employee
app.post('/employees', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    
    console.log('[API] Creating employee:', req.body);
    
    const employeeData = {
      tenantId,
      email: req.body.email,
      firstName: req.body.firstName || req.body.first_name,
      lastName: req.body.lastName || req.body.last_name,
      phone: req.body.phone,
      role: req.body.role,
      jobTitle: req.body.jobTitle || req.body.job_title,
      department: req.body.department,
      colorHex: req.body.colorHex || req.body.color,
      hourlyRate: req.body.hourlyRate ? parseFloat(req.body.hourlyRate) : undefined,
      overtimeRate: req.body.overtimeRate ? parseFloat(req.body.overtimeRate) : undefined,
      canBeBookedOnline: req.body.canBeBookedOnline,
      isDispatchEnabled: req.body.isDispatchEnabled ?? req.body.isTechnician,
    };
    
    const employee = await employeePostgresService.createEmployee(employeeData);
    
    res.status(201).json({
      employee: {
        id: employee.id,
        employeeId: employee.id,
        employeeNumber: employee.employeeNumber,
        user: employee.user ? {
          id: employee.user.id,
          email: employee.user.email,
          firstName: employee.user.firstName,
          lastName: employee.user.lastName,
          fullName: `${employee.user.firstName || ''} ${employee.user.lastName || ''}`.trim(),
        } : null,
        jobTitle: employee.jobTitle,
        colorHex: employee.colorHex,
        isDispatchEnabled: employee.isDispatchEnabled,
        createdAt: employee.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[API] Create employee error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update employee
app.put('/employees/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    const employeeId = req.params.id;
    
    console.log('[API] Updating employee:', employeeId, req.body);
    
    const updateData = {
      firstName: req.body.firstName || req.body.first_name,
      lastName: req.body.lastName || req.body.last_name,
      phone: req.body.phone,
      jobTitle: req.body.jobTitle || req.body.job_title,
      department: req.body.department,
      colorHex: req.body.colorHex || req.body.color,
      hourlyRate: req.body.hourlyRate ? parseFloat(req.body.hourlyRate) : undefined,
      overtimeRate: req.body.overtimeRate ? parseFloat(req.body.overtimeRate) : undefined,
      commissionRate: req.body.commissionRate ? parseFloat(req.body.commissionRate) : undefined,
      canBeBookedOnline: req.body.canBeBookedOnline,
      isDispatchEnabled: req.body.isDispatchEnabled ?? req.body.isTechnician,
      receivesDispatchNotifications: req.body.receivesDispatchNotifications,
      maxDailyJobs: req.body.maxDailyJobs,
      emergencyContactName: req.body.emergencyContactName,
      emergencyContactPhone: req.body.emergencyContactPhone,
      notes: req.body.notes,
    };
    
    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );
    
    const employee = await employeePostgresService.updateEmployee(tenantId, employeeId, cleanData);
    
    res.json({
      employee: {
        id: employee.id,
        user: employee.user ? {
          id: employee.user.id,
          email: employee.user.email,
          firstName: employee.user.firstName,
          lastName: employee.user.lastName,
        } : null,
        jobTitle: employee.jobTitle,
        isDispatchEnabled: employee.isDispatchEnabled,
        updatedAt: employee.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[API] Update employee error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete (archive) employee
app.delete('/employees/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    const employeeId = req.params.id;
    
    console.log('[API] Archiving employee:', employeeId);
    
    const success = await employeePostgresService.archiveEmployee(tenantId, employeeId);
    
    if (!success) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee archived successfully', employeeId });
  } catch (error: any) {
    console.error('[API] Delete employee error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get employee schedule
app.get('/employees/:id/schedule', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    const employeeId = req.params.id;
    
    const schedule = await employeePostgresService.getEmployeeSchedule(tenantId, employeeId);
    
    res.json({ schedule });
  } catch (error: any) {
    console.error('[API] Get employee schedule error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update employee schedule
app.put('/employees/:id/schedule', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    const employeeId = req.params.id;
    
    const schedule = await employeePostgresService.updateEmployeeSchedule(
      tenantId,
      employeeId,
      req.body.schedule
    );
    
    res.json({ schedule });
  } catch (error: any) {
    console.error('[API] Update employee schedule error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add skill to employee
app.post('/employees/:id/skills', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    const employeeId = req.params.id;
    
    const skill = await employeePostgresService.addSkill(
      tenantId,
      employeeId,
      req.body.skillId,
      req.body.proficiencyLevel
    );
    
    res.status(201).json({ skill });
  } catch (error: any) {
    console.error('[API] Add skill error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove skill from employee
app.delete('/employees/:id/skills/:skillId', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string || 'local-tenant';
    const { id: employeeId, skillId } = req.params;
    
    await employeePostgresService.removeSkill(tenantId, employeeId, skillId);
    
    res.status(204).send();
  } catch (error: any) {
    console.error('[API] Remove skill error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// JOB ROUTES
// ============================================================================

app.post('/jobs', async (req, res) => {
  try {
    const event = {
      httpMethod: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
      pathParameters: null,
      queryStringParameters: null,
    };
    const result = await createJobHandler(event as any, {} as any, {} as any);
    if (result) {
      res.status(result.statusCode).json(JSON.parse(result.body));
    } else {
      res.status(500).json({ error: 'Create job failed' });
    }
  } catch (error: any) {
    console.error('[API] Create job error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CHAT ROUTES
// ============================================================================

app.post('/chat', async (req, res) => {
  try {
    const event = {
      httpMethod: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
      pathParameters: null,
      queryStringParameters: null,
    };
    const result = await chatHandler(event as any, {} as any, {} as any);
    if (result) {
      res.status(result.statusCode).json(JSON.parse(result.body));
    } else {
      res.status(500).json({ error: 'Chat failed' });
    }
  } catch (error: any) {
    console.error('[API] Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// LLM Chat with function calling (if available)
if (llmChatHandler) {
  app.post('/llm-chat', async (req, res) => {
    try {
      const event = {
        httpMethod: 'POST',
        headers: req.headers,
        body: JSON.stringify(req.body),
        pathParameters: null,
        queryStringParameters: null,
      };
      const result = await llmChatHandler(event as any);
      res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (error: any) {
      console.error('[API] LLM Chat error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`\n🚀 FieldSmartPro API Server (PostgreSQL)`);
  console.log(`   Running on http://localhost:${PORT}\n`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET  /health      - Health check`);
  console.log(`   GET  /health/db   - Database health check`);
  console.log(`   `);
  console.log(`   👥 Customers (PostgreSQL):`);
  console.log(`   POST /customers   - Create customer`);
  console.log(`   GET  /customers   - List customers`);
  console.log(`   GET  /customers/:id - Get customer`);
  console.log(`   PUT  /customers/:id - Update customer`);
  console.log(`   DELETE /customers/:id - Archive customer`);
  console.log(`   `);
  console.log(`   👷 Employees/Technicians (PostgreSQL):`);
  console.log(`   POST /employees   - Create employee`);
  console.log(`   GET  /employees   - List employees`);
  console.log(`   GET  /employees/:id - Get employee`);
  console.log(`   PUT  /employees/:id - Update employee`);
  console.log(`   DELETE /employees/:id - Archive employee`);
  console.log(`   `);
  console.log(`   🔧 Jobs:`);
  console.log(`   POST /jobs        - Create job`);
  console.log(`   `);
  console.log(`   💬 Chat:`);
  console.log(`   POST /chat        - Chat endpoint`);
  if (llmChatHandler) {
    console.log(`   POST /llm-chat    - LLM chat with function calling`);
  }
  console.log(`   `);
  console.log(`   📞 VAPI Voice Agent:`);
  console.log(`   POST /webhooks/vapi/:tenantId - VAPI webhook`);
  console.log(`   GET  /api/tenants/:tenantId/vapi/config - Get config`);
  console.log(`   PUT  /api/tenants/:tenantId/vapi/config - Update config`);
  console.log(`   POST /api/tenants/:tenantId/vapi/provision - Provision VAPI`);
  console.log(`   GET  /api/tenants/:tenantId/vapi/calls - Call history`);
  console.log(`   GET  /api/tenants/:tenantId/vapi/analytics - Analytics`);
  console.log(`\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, closing server...');
  await disconnectPrisma();
  process.exit(0);
});
