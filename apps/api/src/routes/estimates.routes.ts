import { Router } from 'express';
import { handler as listEstimatesHandler } from '../handlers/estimates/list-postgres';
import { handler as getEstimateHandler } from '../handlers/estimates/get-postgres';
import { handler as createEstimateHandler } from '../handlers/estimates/create-postgres';
import { handler as updateEstimateHandler } from '../handlers/estimates/update-postgres';
import { handler as deleteEstimateHandler } from '../handlers/estimates/delete-postgres';

const router = Router();

// Empty Lambda context object for handlers
const emptyContext = {} as any;

/**
 * GET /api/estimates - List all estimates
 */
router.get('/api/estimates', async (req, res) => {
  try {
    console.log('[API] GET /api/estimates - Query params:', req.query);
    const event = {
      httpMethod: 'GET',
      headers: req.headers,
      body: null,
      pathParameters: null,
      queryStringParameters: req.query,
    };
    const result = await listEstimatesHandler(event as any, emptyContext);
    console.log('[API] GET /api/estimates - Response status:', result.statusCode);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] GET /api/estimates - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/estimates/:id - Get estimate by ID
 */
router.get('/api/estimates/:id', async (req, res) => {
  try {
    console.log('[API] GET /api/estimates/:id - ID:', req.params.id);
    const event = {
      httpMethod: 'GET',
      headers: req.headers,
      body: null,
      pathParameters: { id: req.params.id },
      queryStringParameters: null,
    };
    const result = await getEstimateHandler(event as any, emptyContext);
    console.log('[API] GET /api/estimates/:id - Response status:', result.statusCode);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] GET /api/estimates/:id - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/estimates - Create new estimate
 */
router.post('/api/estimates', async (req, res) => {
  try {
    console.log('[API] POST /api/estimates - Request body:', JSON.stringify(req.body));
    const event = {
      httpMethod: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
      pathParameters: null,
      queryStringParameters: null,
    };
    const result = await createEstimateHandler(event as any, emptyContext);
    console.log('[API] POST /api/estimates - Response status:', result.statusCode);
    console.log('[API] POST /api/estimates - Response body:', result.body);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] POST /api/estimates - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/estimates/:id - Update estimate
 */
router.put('/api/estimates/:id', async (req, res) => {
  try {
    console.log('[API] PUT /api/estimates/:id - ID:', req.params.id);
    console.log('[API] PUT /api/estimates/:id - Request body:', JSON.stringify(req.body));
    const event = {
      httpMethod: 'PUT',
      headers: req.headers,
      body: JSON.stringify(req.body),
      pathParameters: { id: req.params.id },
      queryStringParameters: null,
    };
    const result = await updateEstimateHandler(event as any, emptyContext);
    console.log('[API] PUT /api/estimates/:id - Response status:', result.statusCode);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] PUT /api/estimates/:id - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/estimates/:id - Delete estimate
 */
router.delete('/api/estimates/:id', async (req, res) => {
  try {
    console.log('[API] DELETE /api/estimates/:id - ID:', req.params.id);
    const event = {
      httpMethod: 'DELETE',
      headers: req.headers,
      body: null,
      pathParameters: { id: req.params.id },
      queryStringParameters: null,
    };
    const result = await deleteEstimateHandler(event as any, emptyContext);
    console.log('[API] DELETE /api/estimates/:id - Response status:', result.statusCode);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] DELETE /api/estimates/:id - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/estimates/:id/send - Send estimate to customer
 */
router.post('/api/estimates/:id/send', async (req, res) => {
  try {
    console.log('[API] POST /api/estimates/:id/send - ID:', req.params.id);
    const event = {
      httpMethod: 'PUT',
      headers: req.headers,
      body: JSON.stringify({ status: 'SENT' }),
      pathParameters: { id: req.params.id },
      queryStringParameters: null,
    };
    const result = await updateEstimateHandler(event as any, emptyContext);
    console.log('[API] POST /api/estimates/:id/send - Response status:', result.statusCode);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] POST /api/estimates/:id/send - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/estimates/:id/approve - Approve estimate
 */
router.post('/api/estimates/:id/approve', async (req, res) => {
  try {
    console.log('[API] POST /api/estimates/:id/approve - ID:', req.params.id);
    const event = {
      httpMethod: 'PUT',
      headers: req.headers,
      body: JSON.stringify({ status: 'APPROVED' }),
      pathParameters: { id: req.params.id },
      queryStringParameters: null,
    };
    const result = await updateEstimateHandler(event as any, emptyContext);
    console.log('[API] POST /api/estimates/:id/approve - Response status:', result.statusCode);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] POST /api/estimates/:id/approve - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/estimates/:id/decline - Decline estimate
 */
router.post('/api/estimates/:id/decline', async (req, res) => {
  try {
    console.log('[API] POST /api/estimates/:id/decline - ID:', req.params.id);
    const event = {
      httpMethod: 'PUT',
      headers: req.headers,
      body: JSON.stringify({ status: 'DECLINED' }),
      pathParameters: { id: req.params.id },
      queryStringParameters: null,
    };
    const result = await updateEstimateHandler(event as any, emptyContext);
    console.log('[API] POST /api/estimates/:id/decline - Response status:', result.statusCode);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error: any) {
    console.error('[API] POST /api/estimates/:id/decline - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
