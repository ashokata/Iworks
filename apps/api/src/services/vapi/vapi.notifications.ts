/**
 * VAPI Notification Service
 * Sends alerts to tenant owners when new customers/requests are created via voice
 */

import { PrismaClient } from '@prisma/client';
import { NewRequestNotification, NotificationRecipient } from '../../types/vapi.types';

const prisma = new PrismaClient();

// Notification channel interfaces
interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SmsNotification {
  to: string;
  body: string;
}

interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data: Record<string, any>;
}

/**
 * VAPI Notification Service
 */
export class VapiNotificationService {
  /**
   * Send notification for new voice-created request
   */
  async sendNewRequestNotification(notification: NewRequestNotification): Promise<void> {
    console.log('[VapiNotifications] Sending new request notification:', {
      tenantId: notification.tenant.id,
      customerId: notification.customer?.id,
      serviceRequestId: notification.serviceRequest?.id,
    });

    try {
      // Get notification recipients from VAPI config
      const config = await prisma.vapiConfiguration.findUnique({
        where: { tenantId: notification.tenant.id },
        select: {
          notifyEmail: true,
          notifySms: true,
          notifyPush: true,
          notificationRecipients: true,
        },
      });

      if (!config) {
        console.warn('[VapiNotifications] No VAPI config found for tenant');
        return;
      }

      const recipients = (config.notificationRecipients || []) as NotificationRecipient[];

      // Send email notifications
      if (config.notifyEmail) {
        const emailRecipients = recipients
          .filter(r => r.email)
          .map(r => r.email!);

        if (emailRecipients.length > 0) {
          await this.sendEmailNotifications(emailRecipients, notification);
        }
      }

      // Send SMS notifications
      if (config.notifySms) {
        const smsRecipients = recipients
          .filter(r => r.phone)
          .map(r => r.phone!);

        if (smsRecipients.length > 0) {
          await this.sendSmsNotifications(smsRecipients, notification);
        }
      }

      // Send push notifications
      if (config.notifyPush) {
        const pushRecipients = recipients
          .filter(r => r.userId)
          .map(r => r.userId!);

        if (pushRecipients.length > 0) {
          await this.sendPushNotifications(pushRecipients, notification);
        }
      }

      console.log('[VapiNotifications] Notifications sent successfully');
    } catch (error) {
      console.error('[VapiNotifications] Error sending notifications:', error);
    }
  }

  /**
   * Send email notifications
   */
  private async sendEmailNotifications(
    emails: string[],
    notification: NewRequestNotification
  ): Promise<void> {
    const subject = `New Service Request from ${notification.customer?.name || 'Voice Call'}`;
    
    const html = this.generateEmailHtml(notification);
    const text = this.generateEmailText(notification);

    for (const email of emails) {
      const emailPayload: EmailNotification = {
        to: email,
        subject,
        html,
        text,
      };

      // TODO: Integrate with actual email service (SendGrid, SES, etc.)
      console.log('[VapiNotifications] Would send email:', {
        to: email,
        subject,
      });

      // Log for audit
      await this.logNotification('EMAIL', email, notification);
    }
  }

  /**
   * Send SMS notifications
   */
  private async sendSmsNotifications(
    phones: string[],
    notification: NewRequestNotification
  ): Promise<void> {
    const body = this.generateSmsText(notification);

    for (const phone of phones) {
      const smsPayload: SmsNotification = {
        to: phone,
        body,
      };

      // TODO: Integrate with actual SMS service (Twilio, etc.)
      console.log('[VapiNotifications] Would send SMS:', {
        to: phone,
        body: body.substring(0, 50) + '...',
      });

      // Log for audit
      await this.logNotification('SMS', phone, notification);
    }
  }

  /**
   * Send push notifications
   */
  private async sendPushNotifications(
    userIds: string[],
    notification: NewRequestNotification
  ): Promise<void> {
    const title = 'New Service Request';
    const body = `${notification.customer?.name || 'A customer'} needs ${notification.serviceRequest?.problemType || 'service'}`;

    for (const userId of userIds) {
      const pushPayload: PushNotification = {
        userId,
        title,
        body,
        data: {
          type: 'NEW_VOICE_REQUEST',
          customerId: notification.customer?.id,
          serviceRequestId: notification.serviceRequest?.id,
        },
      };

      // TODO: Integrate with actual push service (FCM, APNs, etc.)
      console.log('[VapiNotifications] Would send push:', {
        userId,
        title,
        body,
      });

      // Log for audit
      await this.logNotification('PUSH', userId, notification);
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHtml(notification: NewRequestNotification): string {
    const customer = notification.customer;
    const request = notification.serviceRequest;
    const appointment = notification.appointment;
    const callInfo = notification.callInfo;

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1E40AF; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .section { margin-bottom: 20px; }
    .label { font-weight: bold; color: #666; }
    .value { margin-top: 5px; }
    .urgency-high { color: #DC2626; font-weight: bold; }
    .urgency-medium { color: #F59E0B; }
    .urgency-low { color: #10B981; }
    .cta { text-align: center; margin-top: 20px; }
    .button { background: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Service Request</h1>
      <p>Created via Voice Call</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="label">Customer Information</div>
        <div class="value">
          <strong>${customer?.name || 'Unknown'}</strong><br>
          📱 ${customer?.phone || 'No phone'}<br>
          ${customer?.email ? `✉️ ${customer.email}<br>` : ''}
          📍 ${customer?.address || 'No address'}
        </div>
        <div class="value" style="margin-top: 10px; padding: 8px; background: #FEF3C7; border-radius: 4px;">
          ⚠️ <strong>Status: UNVERIFIED</strong> - Please verify customer details
        </div>
      </div>

      <div class="section">
        <div class="label">Service Request</div>
        <div class="value">
          <strong>${request?.problemType || 'General'} Issue</strong><br>
          Confirmation: ${request?.confirmationNumber || 'N/A'}<br>
          <span class="urgency-${request?.urgency?.toLowerCase() || 'medium'}">
            Urgency: ${request?.urgency || 'MEDIUM'}
          </span>
        </div>
        <div class="value" style="margin-top: 10px;">
          <em>"${request?.description || 'No description provided'}"</em>
        </div>
      </div>

      ${appointment ? `
      <div class="section">
        <div class="label">Scheduled Appointment</div>
        <div class="value">
          📅 ${appointment.date}<br>
          🕐 ${appointment.timeSlot}<br>
          👷 ${appointment.technicianName}
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="label">Call Information</div>
        <div class="value">
          Duration: ${Math.floor((callInfo?.duration || 0) / 60)}:${String((callInfo?.duration || 0) % 60).padStart(2, '0')}<br>
          ${callInfo?.recordingUrl ? `<a href="${callInfo.recordingUrl}">🎧 Listen to Recording</a>` : ''}
        </div>
      </div>

      <div class="cta">
        <a href="https://app.fieldsmartpro.com/customers/${customer?.id}" class="button">
          View Customer
        </a>
      </div>
    </div>

    <div class="footer">
      <p>This notification was sent by FieldSmartPro Voice Agent</p>
      <p>${notification.tenant.name} | ${notification.timestamp}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email content
   */
  private generateEmailText(notification: NewRequestNotification): string {
    const customer = notification.customer;
    const request = notification.serviceRequest;

    return `
NEW SERVICE REQUEST - Created via Voice Call

CUSTOMER:
Name: ${customer?.name || 'Unknown'}
Phone: ${customer?.phone || 'No phone'}
Email: ${customer?.email || 'No email'}
Address: ${customer?.address || 'No address'}
Status: UNVERIFIED - Please verify customer details

SERVICE REQUEST:
Type: ${request?.problemType || 'General'}
Confirmation: ${request?.confirmationNumber || 'N/A'}
Urgency: ${request?.urgency || 'MEDIUM'}
Description: ${request?.description || 'No description'}

View in app: https://app.fieldsmartpro.com/customers/${customer?.id}

---
${notification.tenant.name}
Sent: ${notification.timestamp}
    `.trim();
  }

  /**
   * Generate SMS text content (160 char limit)
   */
  private generateSmsText(notification: NewRequestNotification): string {
    const customer = notification.customer;
    const request = notification.serviceRequest;

    return `📞 New ${request?.problemType || 'Service'} request from ${customer?.name || 'voice call'}. Ref: ${request?.confirmationNumber || 'N/A'}. Urgency: ${request?.urgency || 'MED'}. Check app for details.`;
  }

  /**
   * Log notification for audit purposes
   */
  private async logNotification(
    channel: 'EMAIL' | 'SMS' | 'PUSH',
    recipient: string,
    notification: NewRequestNotification
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: notification.tenant.id,
          userId: null,
          action: `VAPI_NOTIFICATION_${channel}`,
          entityType: 'ServiceRequest',
          entityId: notification.serviceRequest?.id,
          newValues: {
            channel,
            recipient,
            customerId: notification.customer?.id,
            serviceRequestId: notification.serviceRequest?.id,
            timestamp: notification.timestamp,
          },
        },
      });
    } catch (error) {
      console.error('[VapiNotifications] Error logging notification:', error);
    }
  }
}

// Export singleton instance
export const vapiNotificationService = new VapiNotificationService();

