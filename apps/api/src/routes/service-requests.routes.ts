/**
 * Service Requests API Routes
 */

import { Router, Request, Response } from 'express';
import { handler as listServiceRequestsHandler } from '../handlers/service-requests/list-postgres';

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

export default router;

