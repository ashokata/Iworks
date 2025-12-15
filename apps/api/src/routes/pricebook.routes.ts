/**
 * Pricebook API Routes
 * Handles pricebook catalog management
 */

import { Router, Request, Response } from 'express';
import { handler as listIndustriesHandler } from '../handlers/pricebook/list-industries';
import { handler as getIndustryHandler } from '../handlers/pricebook/get-industry';
import { handler as listCategoriesHandler } from '../handlers/pricebook/list-categories';
import { handler as getCategoryHandler } from '../handlers/pricebook/get-category';
import { handler as createCategoryHandler } from '../handlers/pricebook/create-category';
import { handler as updateCategoryHandler } from '../handlers/pricebook/update-category';
import { handler as deleteCategoryHandler } from '../handlers/pricebook/delete-category';
import { handler as listServicesHandler } from '../handlers/pricebook/list-services';
import { handler as getServiceHandler } from '../handlers/pricebook/get-service';
import { handler as createServiceHandler } from '../handlers/pricebook/create-service';
import { handler as updateServiceHandler } from '../handlers/pricebook/update-service';
import { handler as deleteServiceHandler } from '../handlers/pricebook/delete-service';
import { handler as listMaterialsHandler } from '../handlers/pricebook/list-materials';
import { handler as createMaterialHandler } from '../handlers/pricebook/create-material';
import { handler as updateMaterialHandler } from '../handlers/pricebook/update-material';
import { handler as deleteMaterialHandler } from '../handlers/pricebook/delete-material';
import { handler as importPricebookHandler } from '../handlers/pricebook/import-pricebook';

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

// ============================================================================
// INDUSTRIES
// ============================================================================

router.get('/api/pricebook/industries', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await listIndustriesHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] List industries error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/pricebook/industries/:slug', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await getIndustryHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Get industry error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CATEGORIES
// ============================================================================

router.get('/api/pricebook/categories', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await listCategoriesHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] List categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/pricebook/categories/:id', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await getCategoryHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Get category error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/pricebook/categories', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, true);
    const result = await createCategoryHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Create category error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/pricebook/categories/:id', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, true);
    const result = await updateCategoryHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Update category error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/pricebook/categories/:id', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await deleteCategoryHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Delete category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SERVICES
// ============================================================================

router.get('/api/pricebook/services', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await listServicesHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] List services error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/pricebook/services/:id', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await getServiceHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Get service error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/pricebook/services', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, true);
    const result = await createServiceHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Create service error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/pricebook/services/:id', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, true);
    const result = await updateServiceHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Update service error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/pricebook/services/:id', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await deleteServiceHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Delete service error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// MATERIALS
// ============================================================================

router.get('/api/pricebook/services/:id/materials', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await listMaterialsHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] List materials error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/pricebook/materials', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, true);
    const result = await createMaterialHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Create material error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/pricebook/materials/:id', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, true);
    const result = await updateMaterialHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Update material error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/pricebook/materials/:id', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, false);
    const result = await deleteMaterialHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Delete material error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// IMPORT
// ============================================================================

router.post('/api/pricebook/import', async (req: Request, res: Response) => {
  try {
    const event = toLambdaEvent(req, true);
    const result = await importPricebookHandler(event as any, {} as any, {} as any);
    sendResponse(res, result);
  } catch (error: any) {
    console.error('[Pricebook Routes] Import pricebook error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

