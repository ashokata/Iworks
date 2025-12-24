import { Router, Request, Response } from 'express';
import * as appointmentHandlers from '../handlers/appointments';

const router = Router();

// Helper to convert Express request to Lambda event
const toLambdaEvent = (req: Request, includeBody = true) => ({
  httpMethod: req.method,
  headers: req.headers as any,
  pathParameters: req.params || null,
  queryStringParameters: req.query as any || null,
  body: includeBody && req.body ? JSON.stringify(req.body) : null,
});

// POST /appointments - Create appointment
router.post('/appointments', async (req: Request, res: Response) => {
  await appointmentHandlers.createAppointment(req, res);
});

// GET /appointments - Get all appointments
router.get('/appointments', async (req: Request, res: Response) => {
  await appointmentHandlers.getAllAppointments(req, res);
});

// GET /appointments/:id - Get appointment by ID
router.get('/appointments/:id', async (req: Request, res: Response) => {
  await appointmentHandlers.getAppointmentById(req, res);
});

// PUT /appointments/:id - Update appointment
router.put('/appointments/:id', async (req: Request, res: Response) => {
  await appointmentHandlers.updateAppointment(req, res);
});

// DELETE /appointments/:id - Delete appointment
router.delete('/appointments/:id', async (req: Request, res: Response) => {
  await appointmentHandlers.deleteAppointment(req, res);
});

export default router;
