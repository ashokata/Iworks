/**
 * VAPI Tenant Provisioning Service
 * Handles setup and teardown of VAPI resources for tenants
 */

import { PrismaClient } from '@prisma/client';
import { VapiClient } from './vapi.client';
import {
  ProvisionTenantRequest,
  ProvisionTenantResult,
  DeprovisionTenantResult,
  VapiTenantConfig,
} from '../../types/vapi.types';

const prisma = new PrismaClient();

const API_BASE_URL = process.env.API_BASE_URL || 'https://gpajab36b7.execute-api.us-east-1.amazonaws.com/prod';
const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET || 'default-secret-change-in-prod';

export class VapiProvisioningService {
  private vapiClient: VapiClient;

  constructor(vapiApiKey?: string) {
    this.vapiClient = new VapiClient(vapiApiKey);
  }

  /**
   * Provision VAPI resources for a tenant
   * Creates: Assistant, Phone Number, Database Config
   */
  async provisionTenant(request: ProvisionTenantRequest): Promise<ProvisionTenantResult> {
    console.log('[VapiProvisioning] Starting provisioning for tenant:', request.tenantId);

    try {
      // Check if tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.tenantId },
        include: { industry: true },
      });

      if (!tenant) {
        return {
          success: false,
          error: 'Tenant not found',
        };
      }

      // Check if already provisioned
      const existingConfig = await prisma.vapiConfiguration.findUnique({
        where: { tenantId: request.tenantId },
      });

      if (existingConfig?.vapiAssistantId) {
        console.log('[VapiProvisioning] Tenant already provisioned:', request.tenantId);
        return {
          success: true,
          phoneNumber: existingConfig.phoneNumber || undefined,
          assistantId: existingConfig.vapiAssistantId,
          webhookUrl: `${API_BASE_URL}/webhooks/vapi/${request.tenantId}`,
        };
      }

      // 1. Create VAPI Assistant
      const systemPrompt = VapiClient.generateSystemPrompt({
        companyName: request.companyName,
        industry: request.industry || tenant.industry?.name,
        appointmentBookingEnabled: request.features?.appointmentBooking || false,
      });

      const tools = VapiClient.createFieldSmartProTools({
        appointmentBookingEnabled: request.features?.appointmentBooking || false,
      });

      // VAPI name limit is 40 chars
      const assistantName = `${request.companyName} Voice`.substring(0, 40);
      
      const assistant = await this.vapiClient.createAssistant({
        name: assistantName,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          systemPrompt,
          tools,
        },
      voice: {
        provider: 'vapi',
        voiceId: 'Paige', // VAPI's built-in professional female voice
      },
        firstMessage: `Thank you for calling ${request.companyName}. This is your AI assistant. How may I help you today?`,
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en',
        },
        serverUrl: `${API_BASE_URL}/webhooks/vapi/${request.tenantId}`,
        serverUrlSecret: VAPI_WEBHOOK_SECRET,
        endCallFunctionEnabled: true,
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 600, // 10 minutes max call
        backgroundSound: 'office',
        metadata: {
          tenantId: request.tenantId,
          companyName: request.companyName,
        },
      });

      console.log('[VapiProvisioning] Created assistant:', assistant.id);

      // 2. Purchase Phone Number
      let phoneNumber: string | undefined;
      let phoneNumberId: string | undefined;

      try {
        const phone = await this.vapiClient.buyPhoneNumber({
          areaCode: request.areaCode,
          assistantId: assistant.id,
          name: `${request.companyName} Line`,
        });
        phoneNumber = phone.number;
        phoneNumberId = phone.id;
        console.log('[VapiProvisioning] Purchased phone number:', phoneNumber);
      } catch (phoneError) {
        console.error('[VapiProvisioning] Failed to purchase phone number:', phoneError);
        // Continue without phone number - can be added later
      }

      // 3. Create/Update database configuration
      const notificationRecipients = [];
      if (request.notifications?.email) {
        for (const email of request.notifications.email) {
          notificationRecipients.push({ email });
        }
      }
      if (request.notifications?.sms) {
        for (const phone of request.notifications.sms) {
          notificationRecipients.push({ phone });
        }
      }
      if (request.notifications?.userIds) {
        for (const userId of request.notifications.userIds) {
          notificationRecipients.push({ userId });
        }
      }

      const config = await prisma.vapiConfiguration.upsert({
        where: { tenantId: request.tenantId },
        update: {
          vapiAssistantId: assistant.id,
          vapiPhoneNumberId: phoneNumberId,
          phoneNumber,
          isEnabled: true,
          appointmentBookingEnabled: request.features?.appointmentBooking || false,
          notificationRecipients: notificationRecipients.length > 0 ? notificationRecipients as any : undefined,
          updatedAt: new Date(),
        },
        create: {
          tenantId: request.tenantId,
          vapiAssistantId: assistant.id,
          vapiPhoneNumberId: phoneNumberId,
          phoneNumber,
          isEnabled: true,
          appointmentBookingEnabled: request.features?.appointmentBooking || false,
          companyGreeting: `Thank you for calling ${request.companyName}`,
          voiceId: 'rachel',
          businessHours: {
            monday: { isOpen: true, start: '09:00', end: '17:00' },
            tuesday: { isOpen: true, start: '09:00', end: '17:00' },
            wednesday: { isOpen: true, start: '09:00', end: '17:00' },
            thursday: { isOpen: true, start: '09:00', end: '17:00' },
            friday: { isOpen: true, start: '09:00', end: '17:00' },
            saturday: { isOpen: false },
            sunday: { isOpen: false },
          },
          afterHoursMessage: `Thank you for calling ${request.companyName}. We are currently closed. Please leave a message and we will return your call during business hours.`,
          notifyEmail: true,
          notifyPush: true,
          notificationRecipients: notificationRecipients.length > 0 ? notificationRecipients as any : undefined,
        },
      });

      console.log('[VapiProvisioning] Provisioning complete for tenant:', request.tenantId);

      return {
        success: true,
        phoneNumber,
        assistantId: assistant.id,
        webhookUrl: `${API_BASE_URL}/webhooks/vapi/${request.tenantId}`,
      };
    } catch (error: any) {
      console.error('[VapiProvisioning] Provisioning failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error during provisioning',
      };
    }
  }

  /**
   * Deprovision VAPI resources for a tenant
   * Removes: Phone Number, Assistant, Database Config
   */
  async deprovisionTenant(tenantId: string): Promise<DeprovisionTenantResult> {
    console.log('[VapiProvisioning] Starting deprovisioning for tenant:', tenantId);

    try {
      const config = await prisma.vapiConfiguration.findUnique({
        where: { tenantId },
      });

      if (!config) {
        console.log('[VapiProvisioning] No VAPI config found for tenant:', tenantId);
        return { success: true };
      }

      // 1. Release phone number
      if (config.vapiPhoneNumberId) {
        try {
          await this.vapiClient.deletePhoneNumber(config.vapiPhoneNumberId);
          console.log('[VapiProvisioning] Released phone number:', config.phoneNumber);
        } catch (error) {
          console.error('[VapiProvisioning] Failed to release phone number:', error);
        }
      }

      // 2. Delete assistant
      if (config.vapiAssistantId) {
        try {
          await this.vapiClient.deleteAssistant(config.vapiAssistantId);
          console.log('[VapiProvisioning] Deleted assistant:', config.vapiAssistantId);
        } catch (error) {
          console.error('[VapiProvisioning] Failed to delete assistant:', error);
        }
      }

      // 3. Update database config (soft delete - keep for records)
      await prisma.vapiConfiguration.update({
        where: { tenantId },
        data: {
          isEnabled: false,
          vapiAssistantId: null,
          vapiPhoneNumberId: null,
          phoneNumber: null,
          updatedAt: new Date(),
        },
      });

      console.log('[VapiProvisioning] Deprovisioning complete for tenant:', tenantId);

      return { success: true };
    } catch (error: any) {
      console.error('[VapiProvisioning] Deprovisioning failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error during deprovisioning',
      };
    }
  }

  /**
   * Update tenant's VAPI configuration
   */
  async updateTenantConfig(
    tenantId: string,
    updates: Partial<VapiTenantConfig>
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[VapiProvisioning] Updating config for tenant:', tenantId);

    try {
      const config = await prisma.vapiConfiguration.findUnique({
        where: { tenantId },
      });

      if (!config) {
        return { success: false, error: 'VAPI configuration not found' };
      }

      // Update database config
      await prisma.vapiConfiguration.update({
        where: { tenantId },
        data: {
          isEnabled: updates.isEnabled ?? config.isEnabled,
          appointmentBookingEnabled: updates.appointmentBookingEnabled ?? config.appointmentBookingEnabled,
          companyGreeting: updates.companyGreeting ?? config.companyGreeting,
          voiceId: updates.voiceId ?? config.voiceId,
          businessHours: updates.businessHours ?? config.businessHours ?? undefined,
          afterHoursMessage: updates.afterHoursMessage ?? config.afterHoursMessage,
          notifyEmail: updates.notifyEmail ?? config.notifyEmail,
          notifySms: updates.notifySms ?? config.notifySms,
          notifyPush: updates.notifyPush ?? config.notifyPush,
          notificationRecipients: (updates.notificationRecipients ?? config.notificationRecipients) ? (updates.notificationRecipients ?? config.notificationRecipients) as any : undefined,
          phoneNumber: updates.phoneNumber ?? config.phoneNumber,
          vapiPhoneNumberId: updates.vapiPhoneNumberId ?? config.vapiPhoneNumberId,
          updatedAt: new Date(),
        },
      });

      // If assistant exists, update it too
      if (config.vapiAssistantId && (updates.companyName || updates.appointmentBookingEnabled !== undefined)) {
        const systemPrompt = VapiClient.generateSystemPrompt({
          companyName: updates.companyName || 'Your Company',
          industry: updates.industry,
          appointmentBookingEnabled: updates.appointmentBookingEnabled ?? config.appointmentBookingEnabled,
        });

        const tools = VapiClient.createFieldSmartProTools({
          appointmentBookingEnabled: updates.appointmentBookingEnabled ?? config.appointmentBookingEnabled,
        });

        await this.vapiClient.updateAssistant(config.vapiAssistantId, {
          model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            temperature: 0.7,
            systemPrompt,
            tools,
          },
          firstMessage: updates.companyGreeting || config.companyGreeting || undefined,
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('[VapiProvisioning] Update failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error during update',
      };
    }
  }

  /**
   * Get tenant's VAPI configuration
   */
  async getTenantConfig(tenantId: string): Promise<VapiTenantConfig | null> {
    const config = await prisma.vapiConfiguration.findUnique({
      where: { tenantId },
      include: {
        tenant: {
          select: { name: true },
        },
      },
    });

    if (!config) return null;

    return {
      tenantId: config.tenantId,
      companyName: config.tenant.name,
      vapiAssistantId: config.vapiAssistantId || undefined,
      vapiPhoneNumberId: config.vapiPhoneNumberId || undefined,
      phoneNumber: config.phoneNumber || undefined,
      isEnabled: config.isEnabled,
      appointmentBookingEnabled: config.appointmentBookingEnabled,
      companyGreeting: config.companyGreeting || undefined,
      voiceId: config.voiceId || undefined,
      businessHours: config.businessHours as any,
      afterHoursMessage: config.afterHoursMessage || undefined,
      notifyEmail: config.notifyEmail,
      notifySms: config.notifySms,
      notifyPush: config.notifyPush,
      notificationRecipients: config.notificationRecipients as any,
    };
  }

  /**
   * Get call analytics for a tenant
   */
  async getCallAnalytics(
    tenantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    totalCalls: number;
    totalDuration: number;
    averageDuration: number;
    customersCreated: number;
    appointmentsBooked: number;
    callsByStatus: Record<string, number>;
    callsByDay: Array<{ date: string; count: number }>;
  }> {
    const config = await prisma.vapiConfiguration.findUnique({
      where: { tenantId },
    });

    if (!config) {
      return {
        totalCalls: 0,
        totalDuration: 0,
        averageDuration: 0,
        customersCreated: 0,
        appointmentsBooked: 0,
        callsByStatus: {},
        callsByDay: [],
      };
    }

    const whereClause: any = { vapiConfigId: config.id };
    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    // Get call logs
    const calls = await prisma.voiceCallLog.findMany({
      where: whereClause,
      select: {
        duration: true,
        status: true,
        customerId: true,
        appointmentId: true,
        createdAt: true,
      },
    });

    // Calculate stats
    const totalCalls = calls.length;
    const totalDuration = calls.reduce((sum, call) => sum + call.duration, 0);
    const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
    const customersCreated = calls.filter(c => c.customerId).length;
    const appointmentsBooked = calls.filter(c => c.appointmentId).length;

    // Group by status
    const callsByStatus: Record<string, number> = {};
    for (const call of calls) {
      callsByStatus[call.status] = (callsByStatus[call.status] || 0) + 1;
    }

    // Group by day
    const callsByDayMap: Record<string, number> = {};
    for (const call of calls) {
      const date = call.createdAt.toISOString().split('T')[0];
      callsByDayMap[date] = (callsByDayMap[date] || 0) + 1;
    }
    const callsByDay = Object.entries(callsByDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalCalls,
      totalDuration,
      averageDuration,
      customersCreated,
      appointmentsBooked,
      callsByStatus,
      callsByDay,
    };
  }
}

// Export singleton instance
export const vapiProvisioningService = new VapiProvisioningService();

