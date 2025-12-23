/**
 * VAPI Tool Function Handlers
 * Handles tool calls from VAPI during voice conversations
 */

import { PrismaClient } from '@prisma/client';
import {
  CreateCustomerAndServiceRequestParams,
  CreateCustomerResult,
  CheckTechnicianAvailabilityParams,
  CheckAvailabilityResult,
  AvailabilitySlot,
  BookAppointmentParams,
  BookAppointmentResult,
  TransferToHumanParams,
} from '../../types/vapi.types';

const prisma = new PrismaClient();

/**
 * Generate a confirmation number for service requests
 */
function generateConfirmationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SR-${timestamp}${random}`;
}

/**
 * Generate a customer number
 */
async function generateCustomerNumber(tenantId: string): Promise<string> {
  const count = await prisma.customer.count({ where: { tenantId } });
  return `C${String(count + 1).padStart(6, '0')}`;
}

/**
 * Generate a service request number
 */
async function generateRequestNumber(tenantId: string): Promise<string> {
  const count = await prisma.serviceRequest.count({ where: { tenantId } });
  return `SR-${String(count + 1).padStart(6, '0')}`;
}

/**
 * Create a customer and service request from voice call data
 */
export async function handleCreateCustomerAndServiceRequest(
  tenantId: string,
  vapiCallId: string,
  params: CreateCustomerAndServiceRequestParams
): Promise<CreateCustomerResult> {
  console.log('[VapiTools] Creating customer and service request:', {
    tenantId,
    vapiCallId,
    customerName: params.customerName,
    problemType: params.problemType,
  });

  try {
    // Parse customer name
    const nameParts = params.customerName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create customer number
    const customerNumber = await generateCustomerNumber(tenantId);
    const requestNumber = await generateRequestNumber(tenantId);
    const confirmationNumber = generateConfirmationNumber();

    // Use transaction to create customer, address, and service request
    const result = await prisma.$transaction(async (tx) => {
      // Create customer with UNVERIFIED status
      const customer = await tx.customer.create({
        data: {
          tenantId,
          customerNumber,
          firstName,
          lastName,
          mobilePhone: params.phoneNumber,
          email: params.email,
          verificationStatus: 'UNVERIFIED',
          createdSource: 'VOICE_AGENT',
          voiceCallId: vapiCallId,
          notes: `Created via voice call. Needs verification.`,
        },
      });

      // Create address
      const address = await tx.address.create({
        data: {
          customerId: customer.id,
          type: 'PRIMARY',
          street: params.address.street,
          city: params.address.city,
          state: params.address.state,
          zip: params.address.zipCode,
          isVerified: false,
        },
      });

      // Create service request
      const serviceRequest = await tx.serviceRequest.create({
        data: {
          tenantId,
          customerId: customer.id,
          requestNumber,
          title: `${params.problemType} Service Request`,
          description: params.problemDescription,
          problemType: params.problemType,
          urgency: params.urgency || 'MEDIUM',
          status: 'NEW',
          createdSource: 'VOICE_AGENT',
          voiceCallId: vapiCallId,
          serviceAddressId: address.id,
        },
      });

      // Update VAPI configuration stats
      await tx.vapiConfiguration.updateMany({
        where: { tenantId },
        data: {
          customersCreated: { increment: 1 },
          serviceRequestsCreated: { increment: 1 },
        },
      });

      return { customer, address, serviceRequest, confirmationNumber };
    });

    console.log('[VapiTools] Created customer and service request:', {
      customerId: result.customer.id,
      serviceRequestId: result.serviceRequest.id,
      confirmationNumber: result.confirmationNumber,
    });

    return {
      success: true,
      customerId: result.customer.id,
      serviceRequestId: result.serviceRequest.id,
      confirmationNumber: result.confirmationNumber,
      message: `I've created your service request. Your confirmation number is ${result.confirmationNumber}. A member of our team will contact you shortly to confirm the details.`,
    };
  } catch (error) {
    console.error('[VapiTools] Error creating customer/service request:', error);
    return {
      success: false,
      message: 'I apologize, but I encountered an issue creating your service request. Please hold while I transfer you to a team member.',
    };
  }
}

/**
 * Check technician availability for scheduling
 */
export async function handleCheckTechnicianAvailability(
  tenantId: string,
  params: CheckTechnicianAvailabilityParams
): Promise<CheckAvailabilityResult> {
  console.log('[VapiTools] Checking technician availability:', {
    tenantId,
    date: params.date,
    problemType: params.problemType,
  });

  try {
    // Get next 7 days if no specific date provided
    const startDate = params.date ? new Date(params.date) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Find dispatchable employees for this tenant
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        isDispatchEnabled: true,
        isArchived: false,
      },
      include: {
        schedules: {
          where: {
            dayOfWeek: {
              in: [0, 1, 2, 3, 4, 5, 6], // All days
            },
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Generate available slots
    // In a real implementation, this would check existing appointments
    const slots: AvailabilitySlot[] = [];
    const now = new Date();

    for (const employee of employees.slice(0, 3)) { // Limit to 3 technicians
      // Generate 2-3 slots per technician for demo
      for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
        const slotDate = new Date(now);
        slotDate.setDate(slotDate.getDate() + dayOffset);
        
        const techName = employee.user
          ? `${employee.user.firstName} ${employee.user.lastName}`
          : `Technician ${employee.employeeNumber || employee.id.slice(0, 4)}`;

        // Morning slot
        slots.push({
          slotId: `${employee.id}-${dayOffset}-am`,
          date: slotDate.toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '12:00',
          technicianName: techName,
          technicianId: employee.id,
        });

        // Afternoon slot
        slots.push({
          slotId: `${employee.id}-${dayOffset}-pm`,
          date: slotDate.toISOString().split('T')[0],
          startTime: '13:00',
          endTime: '17:00',
          technicianName: techName,
          technicianId: employee.id,
        });
      }
    }

    // Sort by date and time
    slots.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    // Take first 5 slots
    const availableSlots = slots.slice(0, 5);

    if (availableSlots.length === 0) {
      return {
        success: true,
        slots: [],
        message: 'I apologize, but we don\'t have any available appointments in the next few days. Someone from our team will call you back to schedule.',
      };
    }

    // Format slots for speech
    const slotDescriptions = availableSlots.slice(0, 3).map((slot, i) => {
      const date = new Date(slot.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const timeRange = slot.startTime === '09:00' ? 'morning between 9 AM and noon' : 'afternoon between 1 and 5 PM';
      return `Option ${i + 1}: ${dayName} ${timeRange}`;
    }).join('. ');

    return {
      success: true,
      slots: availableSlots,
      message: `I found some available appointment slots. ${slotDescriptions}. Which would work best for you?`,
    };
  } catch (error) {
    console.error('[VapiTools] Error checking availability:', error);
    return {
      success: false,
      slots: [],
      message: 'I apologize, but I couldn\'t check our schedule right now. A team member will call you back to schedule an appointment.',
    };
  }
}

/**
 * Book an appointment for the customer
 */
export async function handleBookAppointment(
  tenantId: string,
  vapiCallId: string,
  params: BookAppointmentParams
): Promise<BookAppointmentResult> {
  console.log('[VapiTools] Booking appointment:', {
    tenantId,
    vapiCallId,
    customerId: params.customerId,
    serviceRequestId: params.serviceRequestId,
    slotId: params.slotId,
  });

  try {
    // Parse slot ID to get technician and time info
    const [technicianId, dayOffset, period] = params.slotId.split('-');
    
    // Calculate scheduled date
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + parseInt(dayOffset));
    
    // Set time based on period
    if (period === 'am') {
      scheduledDate.setHours(9, 0, 0, 0);
    } else {
      scheduledDate.setHours(13, 0, 0, 0);
    }

    const scheduledEnd = new Date(scheduledDate);
    scheduledEnd.setHours(scheduledEnd.getHours() + 3);

    // Get service request and customer info
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: params.serviceRequestId },
      include: {
        customer: true,
        serviceAddress: true,
      },
    });

    if (!serviceRequest) {
      throw new Error('Service request not found');
    }

    // Get technician info
    const technician = await prisma.employee.findUnique({
      where: { id: technicianId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const techName = technician?.user
      ? `${technician.user.firstName} ${technician.user.lastName}`
      : 'a technician';

    // Create job from service request
    const jobCount = await prisma.job.count({ where: { tenantId } });
    const jobNumber = `J${String(jobCount + 1).padStart(6, '0')}`;

    const job = await prisma.$transaction(async (tx) => {
      // Create the job
      const newJob = await tx.job.create({
        data: {
          tenantId,
          jobNumber,
          customerId: params.customerId,
          addressId: serviceRequest.serviceAddressId!,
          status: 'SCHEDULED',
          priority: serviceRequest.urgency === 'EMERGENCY' ? 'EMERGENCY' : 
                   serviceRequest.urgency === 'HIGH' ? 'HIGH' : 'NORMAL',
          source: 'PHONE',
          title: serviceRequest.title,
          description: serviceRequest.description,
          scheduledStart: scheduledDate,
          scheduledEnd: scheduledEnd,
          arrivalWindowStart: scheduledDate,
          arrivalWindowEnd: scheduledEnd,
          estimatedDuration: 180, // 3 hours
        },
      });

      // Create job assignment
      await tx.jobAssignment.create({
        data: {
          jobId: newJob.id,
          employeeId: technicianId,
          role: 'PRIMARY',
        },
      });

      // Update service request with job reference
      await tx.serviceRequest.update({
        where: { id: params.serviceRequestId },
        data: {
          status: 'ASSIGNED',
          jobId: newJob.id,
          convertedAt: new Date(),
          assignedToId: technicianId,
          assignedAt: new Date(),
        },
      });

      // Update VAPI stats
      await tx.vapiConfiguration.updateMany({
        where: { tenantId },
        data: {
          appointmentsBooked: { increment: 1 },
        },
      });

      return newJob;
    });

    const dayName = scheduledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeRange = period === 'am' ? 'between 9 AM and noon' : 'between 1 and 5 PM';

    console.log('[VapiTools] Booked appointment:', {
      jobId: job.id,
      jobNumber: job.jobNumber,
      scheduledDate: scheduledDate.toISOString(),
    });

    return {
      success: true,
      appointmentId: job.id,
      confirmationNumber: job.jobNumber,
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      scheduledTime: timeRange,
      technicianName: techName,
      message: `Your appointment has been scheduled for ${dayName} ${timeRange}. ${techName} will be visiting your location. Your job number is ${job.jobNumber}. You'll receive a confirmation via text message.`,
    };
  } catch (error) {
    console.error('[VapiTools] Error booking appointment:', error);
    return {
      success: false,
      message: 'I apologize, but I couldn\'t complete the booking. A team member will call you back to confirm your appointment.',
    };
  }
}

/**
 * Handle transfer to human request
 */
export async function handleTransferToHuman(
  tenantId: string,
  params: TransferToHumanParams
): Promise<{ success: boolean; message: string; transferNumber?: string }> {
  console.log('[VapiTools] Transfer to human requested:', {
    tenantId,
    reason: params.reason,
  });

  try {
    // Get transfer phone number from config
    const config = await prisma.vapiConfiguration.findUnique({
      where: { tenantId },
      select: { transferPhoneNumber: true },
    });

    if (config?.transferPhoneNumber) {
      return {
        success: true,
        message: 'Let me transfer you to a team member. Please hold.',
        transferNumber: config.transferPhoneNumber,
      };
    }

    return {
      success: true,
      message: 'I apologize, but our team is currently unavailable. Someone will call you back shortly at the number you provided.',
    };
  } catch (error) {
    console.error('[VapiTools] Error handling transfer:', error);
    return {
      success: false,
      message: 'I apologize for the inconvenience. Please call back during our business hours.',
    };
  }
}

/**
 * Log voice call completion and send notifications
 */
export async function handleCallCompleted(
  tenantId: string,
  callData: {
    vapiCallId: string;
    callerNumber: string;
    duration: number;
    recordingUrl?: string;
    transcript?: string;
    summary?: string;
    status: 'COMPLETED' | 'FAILED' | 'ABANDONED' | 'TRANSFERRED' | 'NO_ANSWER';
    endedReason?: string;
    customerId?: string;
    serviceRequestId?: string;
    appointmentId?: string;
    problemType?: string;
  }
): Promise<void> {
  console.log('[VapiTools] Logging call completion:', {
    tenantId,
    vapiCallId: callData.vapiCallId,
    duration: callData.duration,
    status: callData.status,
  });

  try {
    // Get VAPI config
    const config = await prisma.vapiConfiguration.findUnique({
      where: { tenantId },
    });

    if (!config) {
      console.error('[VapiTools] VAPI config not found for tenant:', tenantId);
      return;
    }

    // Create call log
    await prisma.voiceCallLog.create({
      data: {
        vapiConfigId: config.id,
        vapiCallId: callData.vapiCallId,
        callerNumber: callData.callerNumber,
        duration: callData.duration,
        recordingUrl: callData.recordingUrl,
        transcript: callData.transcript,
        callSummary: callData.summary,
        status: callData.status,
        endedReason: callData.endedReason,
        customerId: callData.customerId,
        serviceRequestId: callData.serviceRequestId,
        appointmentId: callData.appointmentId,
        problemType: callData.problemType,
      },
    });

    // Update total calls count
    await prisma.vapiConfiguration.update({
      where: { id: config.id },
      data: {
        totalCalls: { increment: 1 },
      },
    });

    // Send notifications if customer/request was created
    if (callData.customerId && callData.serviceRequestId) {
      await sendNewRequestNotification(tenantId, config, callData);
    }

    console.log('[VapiTools] Call logged successfully');
  } catch (error) {
    console.error('[VapiTools] Error logging call:', error);
  }
}

/**
 * Send notification to tenant owner about new request
 */
async function sendNewRequestNotification(
  tenantId: string,
  config: any,
  callData: any
): Promise<void> {
  try {
    // Get customer and service request details
    const customer = callData.customerId
      ? await prisma.customer.findUnique({
          where: { id: callData.customerId },
          include: { addresses: { where: { type: 'PRIMARY' } } },
        })
      : null;

    const serviceRequest = callData.serviceRequestId
      ? await prisma.serviceRequest.findUnique({
          where: { id: callData.serviceRequestId },
        })
      : null;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    // Build notification payload
    const notification = {
      type: 'NEW_VOICE_REQUEST',
      tenant: {
        id: tenantId,
        name: tenant?.name || 'Unknown',
      },
      customer: customer
        ? {
            id: customer.id,
            name: `${customer.firstName} ${customer.lastName}`.trim(),
            phone: customer.mobilePhone,
            email: customer.email,
            address: customer.addresses[0]
              ? `${customer.addresses[0].street}, ${customer.addresses[0].city}, ${customer.addresses[0].state} ${customer.addresses[0].zip}`
              : 'No address',
            verificationStatus: 'UNVERIFIED',
          }
        : null,
      serviceRequest: serviceRequest
        ? {
            id: serviceRequest.id,
            confirmationNumber: serviceRequest.requestNumber,
            problemType: serviceRequest.problemType,
            description: serviceRequest.description,
            urgency: serviceRequest.urgency,
          }
        : null,
      callInfo: {
        duration: callData.duration,
        recordingUrl: callData.recordingUrl,
        transcript: callData.transcript,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('[VapiTools] Sending notification:', notification);

    // TODO: Implement actual notification sending
    // - Email via SendGrid/SES
    // - SMS via Twilio
    // - Push via FCM/APNs
    // - Webhook to tenant's endpoint

    // For now, log the notification
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: null,
        action: 'VOICE_REQUEST_NOTIFICATION',
        entityType: 'ServiceRequest',
        entityId: serviceRequest?.id,
        newValues: notification,
      },
    });
  } catch (error) {
    console.error('[VapiTools] Error sending notification:', error);
  }
}

