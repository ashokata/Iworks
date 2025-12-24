import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new appointment
 */
export const createAppointment = async (req: Request, res: Response) => {
  try {
    // Get tenant ID from headers (set by tenant isolation middleware)
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID not found' });
    }

    const {
      title,
      description,
      appointmentType,
      customerId,
      addressId,
      scheduledStart,
      scheduledEnd,
      duration,
      status,
      priority,
      assignedToId,
      notes,
    } = req.body;

    // Validate required fields
    if (!title || !customerId || !scheduledStart || !scheduledEnd) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, customerId, scheduledStart, scheduledEnd' 
      });
    }
    
    console.log('[Appointments Handler] RAW request body:', JSON.stringify(req.body, null, 2));
    console.log('[Appointments Handler] addressId value:', {
      value: addressId,
      type: typeof addressId,
      isEmpty: addressId === '',
      isNull: addressId === null,
      isUndefined: addressId === undefined,
      trimmed: addressId && typeof addressId === 'string' ? addressId.trim() : 'N/A',
    });
    console.log('[Appointments Handler] assignedToId value:', {
      value: assignedToId,
      type: typeof assignedToId,
      isEmpty: assignedToId === '',
      isNull: assignedToId === null,
      isUndefined: assignedToId === undefined,
    });

    // Prepare appointment data - only include createdById if user exists
    const appointmentData: any = {
      tenantId,
      title,
      description: description || null,
      appointmentType: appointmentType || null,
      customerId,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      duration: duration ? parseInt(duration.toString()) : 60,
      status: status || 'SCHEDULED',
      priority: priority || 'NORMAL',
      notes: notes || null,
    };

    // Only add optional foreign keys if they have valid values
    if (addressId && addressId.trim()) {
      appointmentData.addressId = addressId;
    }
    if (assignedToId && assignedToId.trim()) {
      appointmentData.assignedToId = assignedToId;
    }

    // Only add createdById if userId exists and is valid (not 'system-user')
    if (userId && userId !== 'system-user') {
      // Verify user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      if (userExists) {
        appointmentData.createdById = userId;
      }
    }

    console.log('[Appointments Handler] Final appointmentData to be saved:', JSON.stringify(appointmentData, null, 2));
    console.log('[Appointments Handler] addressId in appointmentData:', appointmentData.addressId);

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: appointmentData,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
      },
    });

    console.log('[Appointments Handler] Created appointment:', appointment.id);

    res.status(201).json(appointment);
  } catch (error: any) {
    console.error('[Appointments Handler] Error creating appointment:', error);
    console.error('[Appointments Handler] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message || 'Failed to create appointment' });
  }
};

/**
 * Get all appointments for tenant
 */
export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID not found' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { tenantId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
      },
      orderBy: { scheduledStart: 'asc' },
    });

    console.log('[Appointments Handler] Found appointments:', appointments.length);

    res.json({ appointments, total: appointments.length });
  } catch (error: any) {
    console.error('[Appointments Handler] Error fetching appointments:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch appointments' });
  }
};

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID not found' });
    }

    const appointment = await prisma.appointment.findFirst({
      where: { 
        id,
        tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    console.log('[Appointments Handler] Found appointment:', appointment.id);

    res.json(appointment);
  } catch (error: any) {
    console.error('[Appointments Handler] Error fetching appointment:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch appointment' });
  }
};

/**
 * Update appointment
 */
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID not found' });
    }

    // Check appointment exists and belongs to tenant
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const {
      title,
      description,
      appointmentType,
      customerId,
      addressId,
      scheduledStart,
      scheduledEnd,
      duration,
      status,
      priority,
      assignedToId,
      notes,
    } = req.body;

    // Update appointment
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(appointmentType !== undefined && { appointmentType }),
        ...(customerId && { customerId }),
        ...(addressId !== undefined && { addressId }),
        ...(scheduledStart && { scheduledStart: new Date(scheduledStart) }),
        ...(scheduledEnd && { scheduledEnd: new Date(scheduledEnd) }),
        ...(duration && { duration: parseInt(duration) }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
      },
    });

    console.log('[Appointments Handler] Updated appointment:', appointment.id);

    res.json(appointment);
  } catch (error: any) {
    console.error('[Appointments Handler] Error updating appointment:', error);
    res.status(500).json({ error: error.message || 'Failed to update appointment' });
  }
};

/**
 * Delete appointment
 */
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant ID not found' });
    }

    // Check appointment exists and belongs to tenant
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    console.log('[Appointments Handler] Deleted appointment:', id);

    res.status(204).send();
  } catch (error: any) {
    console.error('[Appointments Handler] Error deleting appointment:', error);
    res.status(500).json({ error: error.message || 'Failed to delete appointment' });
  }
};
