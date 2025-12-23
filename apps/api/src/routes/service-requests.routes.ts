/**
 * Service Requests API Routes
 */

import { Router, Request, Response } from 'express';
import { handler as listServiceRequestsHandler } from '../handlers/service-requests/list-postgres';
import { handler as createServiceRequestHandler } from '../handlers/service-requests/create-postgres';
import { handler as getServiceRequestHandler } from '../handlers/service-requests/get-by-id-postgres';
import { handler as updateServiceRequestHandler } from '../handlers/service-requests/update-postgres';
import { handler as deleteServiceRequestHandler } from '../handlers/service-requests/delete-postgres';

const router = Router();

// Helper to convert Express request to Lambda event
const toLambdaEvent = (req: Request, includeBody = true) => ({
  httpMethod: req.method,
  headers: req.headers as any,
  pathParameters: req.params || null,
  queryStringParameters: req.query as any || null,
  body: includeBody && req.body ? JSON.stringify(req.body) : null,
});

// Helper to send Lambda response
const sendResponse = (res: Response, lambdaResult: any) => {
  res.status(lambdaResult.statusCode).json(JSON.parse(lambdaResult.body));
};

// GET /api/service-requests - List all service requests
router.get('/api/service-requests', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await listServiceRequestsHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[ServiceRequests Routes] List error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/service-requests - Create a new service request
router.post('/api/service-requests', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, true);
    const result = await createServiceRequestHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[ServiceRequests Routes] Create error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/service-requests/:id - Get a service request by ID
router.get('/api/service-requests/:id', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await getServiceRequestHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[ServiceRequests Routes] Get error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/service-requests/:id - Update a service request
router.put('/api/service-requests/:id', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, true);
    const result = await updateServiceRequestHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[ServiceRequests Routes] Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/service-requests/:id - Delete a service request
router.delete('/api/service-requests/:id', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await deleteServiceRequestHandler(event as any, {} as any, {} as any);
    res.status(result.statusCode).send();
  } catch (error: any) {
    console.error('[ServiceRequests Routes] Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

