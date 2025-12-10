import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { createCustomerDynamoDBHandler } from './handlers/customers/create-dynamodb';
import { listCustomersDynamoDBHandler } from './handlers/customers/list-dynamodb';
import { getCustomerDynamoDBHandler } from './handlers/customers/get-dynamodb';
import { createJobHandler } from './handlers/jobs/create';
import { chatHandler } from './handlers/chat/index';
import { healthHandler } from './handlers/health/index';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Add tenant/user headers for local dev
app.use((req, res, next) => {
  req.headers['x-tenant-id'] = req.headers['x-tenant-id'] || 'local-tenant';
  req.headers['x-user-id'] = req.headers['x-user-id'] || 'local-user';
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const event = { httpMethod: 'GET', headers: req.headers };
  const result = await healthHandler(event as any, {} as any, {} as any);
  if (result) {
    res.status(result.statusCode).json(JSON.parse(result.body));
  } else {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Customer routes - using DynamoDB
app.post('/customers', async (req, res) => {
  const event = {
    httpMethod: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body)
  };
  const result = await createCustomerDynamoDBHandler(event as any, {} as any, {} as any);
  if (result) {
    res.status(result.statusCode).json(JSON.parse(result.body));
  } else {
    res.status(500).json({ error: 'Create customer failed' });
  }
});

app.get('/customers', async (req, res) => {
  const event = {
    httpMethod: 'GET',
    headers: req.headers,
    queryStringParameters: req.query
  };
  const result = await listCustomersDynamoDBHandler(event as any, {} as any, {} as any);
  if (result) {
    res.status(result.statusCode).json(JSON.parse(result.body));
  } else {
    res.status(500).json({ error: 'List customers failed' });
  }
});

// Get customer by ID - using DynamoDB
app.get('/customers/:id', async (req, res) => {
  const event = {
    httpMethod: 'GET',
    headers: req.headers,
    pathParameters: { customerId: req.params.id }
  };
  const result = await getCustomerDynamoDBHandler(event as any, {} as any, {} as any);
  if (result) {
    res.status(result.statusCode).json(JSON.parse(result.body));
  } else {
    res.status(500).json({ error: 'Get customer failed' });
  }
});

// Job routes
app.post('/jobs', async (req, res) => {
  const event = {
    httpMethod: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body)
  };
  const result = await createJobHandler(event as any, {} as any, {} as any);
  if (result) {
    res.status(result.statusCode).json(JSON.parse(result.body));
  } else {
    res.status(500).json({ error: 'Create job failed' });
  }
});

// Chat route
app.post('/chat', async (req, res) => {
  const event = {
    httpMethod: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body)
  };
  const result = await chatHandler(event as any, {} as any, {} as any);
  if (result) {
    res.status(result.statusCode).json(JSON.parse(result.body));
  } else {
    res.status(500).json({ error: 'Chat failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Customers: http://localhost:${PORT}/customers`);
  console.log(`🔧 Jobs: http://localhost:${PORT}/jobs`);
  console.log(`💬 Chat: http://localhost:${PORT}/chat`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  process.exit(0);
});
