/**
 * VAPI API Routes
 * Handles VAPI webhooks and admin endpoints
 */

import { Router, Request, Response } from 'express';
import { handleVapiWebhook, verifyWebhookSignature } from '../services/vapi/vapi.webhooks';
import { vapiProvisioningService } from '../services/vapi/vapi.provisioning';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET || '';

// ============================================================================
// WEBHOOK ENDPOINTS (Called by VAPI)
// ============================================================================

/**
 * Main VAPI webhook endpoint
 * POST /webhooks/vapi/:tenantId
 */
router.post('/webhooks/vapi/:tenantId', async (req: Request, res: Response) => {
  const { tenantId } = req.params;

  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    console.error('[VAPI Routes] Tenant not found:', tenantId);
    return res.status(404).json({ error: 'Tenant not found' });
  }

  // Verify webhook signature (if secret is configured)
  if (VAPI_WEBHOOK_SECRET) {
    const signature = req.headers['x-vapi-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(payload, signature, VAPI_WEBHOOK_SECRET)) {
      console.error('[VAPI Routes] Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  // Handle the webhook
  await handleVapiWebhook(req, res, tenantId);
});

// ============================================================================
// ADMIN ENDPOINTS (Called by Web/Mobile Apps)
// ============================================================================

/**
 * Get VAPI configuration for tenant
 * GET /api/tenants/:tenantId/vapi/config
 */
router.get('/api/tenants/:tenantId/vapi/config', async (req: Request, res: Response) => {
  const { tenantId } = req.params;

  try {
    const config = await vapiProvisioningService.getTenantConfig(tenantId);
    
    if (!config) {
      return res.status(404).json({ error: 'VAPI not configured for this tenant' });
    }

    res.json(config);
  } catch (error: any) {
    console.error('[VAPI Routes] Error getting config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update VAPI configuration for tenant
 * PUT /api/tenants/:tenantId/vapi/config
 */
router.put('/api/tenants/:tenantId/vapi/config', async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const updates = req.body;

  try {
    const result = await vapiProvisioningService.updateTenantConfig(tenantId, updates);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: 'Configuration updated successfully' });
  } catch (error: any) {
    console.error('[VAPI Routes] Error updating config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Provision VAPI resources for tenant
 * POST /api/tenants/:tenantId/vapi/provision
 */
router.post('/api/tenants/:tenantId/vapi/provision', async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const { companyName, industry, features, notifications, areaCode } = req.body;

  try {
    // Get tenant name if not provided
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const result = await vapiProvisioningService.provisionTenant({
      tenantId,
      companyName: companyName || tenant.name,
      industry,
      features,
      notifications,
      areaCode,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: 'VAPI provisioned successfully',
      phoneNumber: result.phoneNumber,
      assistantId: result.assistantId,
      webhookUrl: result.webhookUrl,
    });
  } catch (error: any) {
    console.error('[VAPI Routes] Error provisioning:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Deprovision VAPI resources for tenant
 * DELETE /api/tenants/:tenantId/vapi/deprovision
 */
router.delete('/api/tenants/:tenantId/vapi/deprovision', async (req: Request, res: Response) => {
  const { tenantId } = req.params;

  try {
    const result = await vapiProvisioningService.deprovisionTenant(tenantId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: 'VAPI deprovisioned successfully' });
  } catch (error: any) {
    console.error('[VAPI Routes] Error deprovisioning:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get call history for tenant
 * GET /api/tenants/:tenantId/vapi/calls
 */
router.get('/api/tenants/:tenantId/vapi/calls', async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const { page = '1', limit = '20', status } = req.query;

  try {
    const config = await prisma.vapiConfiguration.findUnique({
      where: { tenantId },
    });

    if (!config) {
      return res.status(404).json({ error: 'VAPI not configured' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = { vapiConfigId: config.id };
    if (status) {
      whereClause.status = status;
    }

    const [calls, total] = await Promise.all([
      prisma.voiceCallLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.voiceCallLog.count({ where: whereClause }),
    ]);

    res.json({
      calls,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('[VAPI Routes] Error getting calls:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get single call details
 * GET /api/tenants/:tenantId/vapi/calls/:callId
 */
router.get('/api/tenants/:tenantId/vapi/calls/:callId', async (req: Request, res: Response) => {
  const { tenantId, callId } = req.params;

  try {
    const config = await prisma.vapiConfiguration.findUnique({
      where: { tenantId },
    });

    if (!config) {
      return res.status(404).json({ error: 'VAPI not configured' });
    }

    const call = await prisma.voiceCallLog.findFirst({
      where: {
        id: callId,
        vapiConfigId: config.id,
      },
    });

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json(call);
  } catch (error: any) {
    console.error('[VAPI Routes] Error getting call:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get VAPI analytics for tenant
 * GET /api/tenants/:tenantId/vapi/analytics
 */
router.get('/api/tenants/:tenantId/vapi/analytics', async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    let dateRange: { start: Date; end: Date } | undefined;
    
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };
    }

    const analytics = await vapiProvisioningService.getCallAnalytics(tenantId, dateRange);
    res.json(analytics);
  } catch (error: any) {
    console.error('[VAPI Routes] Error getting analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Test webhook endpoint (for debugging)
 * POST /api/tenants/:tenantId/vapi/test-webhook
 */
router.post('/api/tenants/:tenantId/vapi/test-webhook', async (req: Request, res: Response) => {
  const { tenantId } = req.params;

  console.log('[VAPI Routes] Test webhook received:', {
    tenantId,
    body: req.body,
  });

  res.json({
    success: true,
    message: 'Webhook received',
    tenantId,
    timestamp: new Date().toISOString(),
  });
});

export default router;

