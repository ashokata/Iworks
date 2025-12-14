/**
 * VAPI Webhook Handlers
 * Handles incoming webhooks from VAPI during voice calls
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import {
  VapiWebhookEvent,
  VapiToolCallEvent,
  VapiEndOfCallReportEvent,
  VapiStatusUpdateEvent,
  CreateCustomerAndServiceRequestParams,
  CheckTechnicianAvailabilityParams,
  BookAppointmentParams,
  TransferToHumanParams,
} from '../../types/vapi.types';
import {
  handleCreateCustomerAndServiceRequest,
  handleCheckTechnicianAvailability,
  handleBookAppointment,
  handleTransferToHuman,
  handleCallCompleted,
} from './vapi.tools';

// Store for tracking call context (customerId, serviceRequestId) across tool calls
// In production, use Redis or similar
const callContextStore = new Map<string, {
  customerId?: string;
  serviceRequestId?: string;
  problemType?: string;
}>();

/**
 * Verify webhook signature from VAPI
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.warn('[VapiWebhooks] Missing signature or secret');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Main webhook handler for tool calls
 */
export async function handleToolCallWebhook(
  req: Request,
  res: Response,
  tenantId: string
): Promise<void> {
  const event = req.body as VapiToolCallEvent;
  
  if (event.message?.type !== 'tool-calls') {
    console.log('[VapiWebhooks] Ignoring non-tool-call event:', event.message?.type);
    res.status(200).json({ success: true });
    return;
  }

  const { call, toolCallList } = event.message;
  const vapiCallId = call.id;

  console.log('[VapiWebhooks] Processing tool calls:', {
    tenantId,
    vapiCallId,
    tools: toolCallList.map(tc => tc.function.name),
  });

  // Process each tool call
  const results: any[] = [];

  for (const toolCall of toolCallList) {
    const functionName = toolCall.function.name;
    // Handle both string and already-parsed object arguments
    const rawArgs = toolCall.function.arguments;
    const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;

    console.log('[VapiWebhooks] Executing tool:', functionName, args);

    let result: any;

    switch (functionName) {
      case 'createCustomerAndServiceRequest': {
        const params = args as CreateCustomerAndServiceRequestParams;
        result = await handleCreateCustomerAndServiceRequest(tenantId, vapiCallId, params);
        
        // Store context for subsequent tool calls
        if (result.success) {
          callContextStore.set(vapiCallId, {
            customerId: result.customerId,
            serviceRequestId: result.serviceRequestId,
            problemType: params.problemType,
          });
        }
        break;
      }

      case 'checkTechnicianAvailability': {
        const params = args as CheckTechnicianAvailabilityParams;
        result = await handleCheckTechnicianAvailability(tenantId, params);
        break;
      }

      case 'bookAppointment': {
        const context = callContextStore.get(vapiCallId);
        const params: BookAppointmentParams = {
          customerId: args.customerId || context?.customerId,
          serviceRequestId: args.serviceRequestId || context?.serviceRequestId,
          slotId: args.slotId,
        };

        if (!params.customerId || !params.serviceRequestId) {
          result = {
            success: false,
            message: 'I apologize, but I need to collect your information first before booking an appointment.',
          };
        } else {
          result = await handleBookAppointment(tenantId, vapiCallId, params);
          
          // Update context with appointment ID
          if (result.success && context) {
            callContextStore.set(vapiCallId, {
              ...context,
              ...result,
            });
          }
        }
        break;
      }

      case 'transferToHuman': {
        const params = args as TransferToHumanParams;
        result = await handleTransferToHuman(tenantId, params);
        break;
      }

      default:
        console.warn('[VapiWebhooks] Unknown tool function:', functionName);
        result = {
          success: false,
          message: 'I apologize, but I cannot process that request right now.',
        };
    }

    results.push({
      toolCallId: toolCall.id,
      result: JSON.stringify(result),
    });
  }

  // Return tool results to VAPI
  res.status(200).json({
    results,
  });
}

/**
 * Handle end of call report webhook
 */
export async function handleEndOfCallWebhook(
  req: Request,
  res: Response,
  tenantId: string
): Promise<void> {
  const event = req.body as VapiEndOfCallReportEvent;

  if (event.message?.type !== 'end-of-call-report') {
    res.status(200).json({ success: true });
    return;
  }

  const { call, recordingUrl, transcript, summary, endedReason } = event.message;
  const vapiCallId = call.id;

  console.log('[VapiWebhooks] Call ended:', {
    tenantId,
    vapiCallId,
    duration: call.endedAt && call.startedAt
      ? Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
      : 0,
    endedReason,
  });

  // Get call context
  const context = callContextStore.get(vapiCallId);

  // Calculate duration
  let duration = 0;
  if (call.endedAt && call.startedAt) {
    duration = Math.round(
      (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
    );
  }

  // Determine call status
  let status: 'COMPLETED' | 'FAILED' | 'ABANDONED' | 'TRANSFERRED' | 'NO_ANSWER' = 'COMPLETED';
  if (endedReason?.includes('customer')) {
    status = 'COMPLETED';
  } else if (endedReason?.includes('transfer')) {
    status = 'TRANSFERRED';
  } else if (endedReason?.includes('error')) {
    status = 'FAILED';
  } else if (endedReason?.includes('no-answer') || endedReason?.includes('timeout')) {
    status = 'NO_ANSWER';
  } else if (duration < 10) {
    status = 'ABANDONED';
  }

  // Log the call
  await handleCallCompleted(tenantId, {
    vapiCallId,
    callerNumber: call.metadata?.customerNumber || 'Unknown',
    duration,
    recordingUrl,
    transcript,
    summary,
    status,
    endedReason,
    customerId: context?.customerId,
    serviceRequestId: context?.serviceRequestId,
    appointmentId: undefined, // Would be set by booking flow
    problemType: context?.problemType,
  });

  // Clean up context
  callContextStore.delete(vapiCallId);

  res.status(200).json({ success: true });
}

/**
 * Handle status update webhook (call in progress, etc.)
 */
export async function handleStatusUpdateWebhook(
  req: Request,
  res: Response,
  tenantId: string
): Promise<void> {
  const event = req.body as VapiStatusUpdateEvent;

  if (event.message?.type !== 'status-update') {
    res.status(200).json({ success: true });
    return;
  }

  const { status, call } = event.message;

  console.log('[VapiWebhooks] Status update:', {
    tenantId,
    vapiCallId: call.id,
    status,
  });

  // Could be used for real-time call monitoring
  // For now, just acknowledge
  res.status(200).json({ success: true });
}

/**
 * Main webhook router - determines event type and routes accordingly
 */
export async function handleVapiWebhook(
  req: Request,
  res: Response,
  tenantId: string
): Promise<void> {
  const eventType = req.body?.message?.type;

  console.log('[VapiWebhooks] Received webhook:', {
    tenantId,
    eventType,
    callId: req.body?.message?.call?.id,
  });

  try {
    switch (eventType) {
      case 'tool-calls':
        await handleToolCallWebhook(req, res, tenantId);
        break;

      case 'end-of-call-report':
        await handleEndOfCallWebhook(req, res, tenantId);
        break;

      case 'status-update':
        await handleStatusUpdateWebhook(req, res, tenantId);
        break;

      case 'assistant-request':
        // Could dynamically configure assistant per caller
        res.status(200).json({ success: true });
        break;

      case 'hang':
      case 'speech-update':
        // Acknowledge but don't process
        res.status(200).json({ success: true });
        break;

      default:
        console.log('[VapiWebhooks] Unhandled event type:', eventType);
        res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('[VapiWebhooks] Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

