# FieldSmartPro - Local Development Setup Guide

This guide will help new developers set up and run the FieldSmartPro application locally with PostgreSQL.

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 18.x or higher | https://nodejs.org/ |
| **npm** | 9.x or higher | Comes with Node.js |
| **Docker Desktop** | Latest | https://www.docker.com/products/docker-desktop/ |
| **Git** | Latest | https://git-scm.com/ |
| **AWS CLI** (optional) | v2 | https://aws.amazon.com/cli/ |

---

## Quick Start (5 Minutes)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fieldsmartpro-monorepo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start PostgreSQL with Docker

```bash
docker run --name fieldsmartpro-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fieldsmartpro \
  -p 5432:5432 \
  -d postgres:15
```

Verify PostgreSQL is running:
```bash
docker ps
```

### 4. Configure Environment Variables

**Backend API (`apps/api/.env`):**

```env
# Database (Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fieldsmartpro?schema=public"

# AWS (for LLM features - optional for basic development)
AWS_REGION="us-east-1"

# Bedrock LLM (optional - for AI features)
BEDROCK_MODEL_ID="us.anthropic.claude-3-5-sonnet-20241022-v2:0"
BEDROCK_FALLBACK_MODEL="us.anthropic.claude-3-haiku-20240307-v1:0"
BEDROCK_MAX_TOKENS="4096"
BEDROCK_TEMPERATURE="0.7"

# API Configuration
JWT_SECRET="local-dev-secret-key"
API_KEY="local-dev-api-key"
NODE_ENV="development"
LOG_LEVEL="info"
PORT=4000

# VAPI Voice Agent (optional - for voice call features)
VAPI_API_KEY="your-vapi-api-key-here"
API_BASE_URL="http://localhost:4000"  # For webhooks (use ngrok for public URL)
```

**Frontend (`apps/web/.env.local`):**

```env
# API Configuration - Points to local backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_TENANT_ID=local-tenant

# Optional: For deployed AWS API testing
# NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
# NEXT_PUBLIC_TENANT_ID=tenant1
```

### 5. Set Up the Database

Run Prisma migrations and seed the database:

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init

# Seed the database with demo data
npx prisma db seed
```

### 6. Start the Application

**Terminal 1 - Backend API:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

**Terminal 3 - ngrok (for VAPI webhooks - optional):**
```bash
# Install ngrok if not already installed
npm install -g ngrok

# Configure your authtoken (get from https://dashboard.ngrok.com/get-started/your-authtoken)
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN

# Start ngrok tunnel to expose local API
ngrok http 4000
```

This will give you a public URL like `https://abc123.ngrok-free.dev` that you can use for VAPI webhook configuration.

### 7. Access the Application

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:4000 |
| **API Health Check** | http://localhost:4000/health |
| **Prisma Studio** | Run `npx prisma studio` in `apps/api` |

---

## Database Management

### View Database with Prisma Studio

```bash
cd apps/api
npx prisma studio
```

Opens a web UI at http://localhost:5555 to browse and edit data.

### Reset Database

To completely reset the database:

```bash
cd apps/api

# Drop all tables and recreate
npx prisma migrate reset

# This will:
# 1. Drop all tables
# 2. Run all migrations
# 3. Run the seed script
```

### Apply New Migrations

When schema changes are made:

```bash
cd apps/api

# Create a new migration
npx prisma migrate dev --name describe_your_change

# Example:
npx prisma migrate dev --name add_customer_tags
```

### Regenerate Prisma Client

After any schema changes:

```bash
cd apps/api
npx prisma generate
```

---

## Project Structure

```
fieldsmartpro-monorepo/
├── apps/
│   ├── api/                    # Backend API (Express + Prisma)
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   ├── seed.ts         # Seed data script
│   │   │   └── migrations/     # Database migrations
│   │   ├── src/
│   │   │   ├── handlers/       # API route handlers
│   │   │   ├── services/       # Business logic services
│   │   │   └── index.ts        # Express server entry point
│   │   └── .env                # Backend environment variables
│   │
│   └── web/                    # Frontend (Next.js 15)
│       ├── src/
│       │   ├── app/            # Next.js App Router pages
│       │   ├── components/     # React components
│       │   ├── services/       # API client services
│       │   └── types/          # TypeScript types
│       └── .env.local          # Frontend environment variables
│
├── infrastructure/             # AWS CDK infrastructure
├── docs/                       # Documentation
└── package.json                # Root package.json
```

---

## API Endpoints

### Health Check
```
GET /health
GET /health/db
```

### Customers
```
POST   /customers              - Create customer
GET    /customers              - List customers
GET    /customers/:id          - Get customer
PUT    /customers/:id          - Update customer
DELETE /customers/:id          - Archive customer
POST   /customers/:id/addresses - Add address
PUT    /customers/:id/addresses/:addressId - Update address
DELETE /customers/:id/addresses/:addressId - Delete address
```

### Employees/Technicians
```
POST   /employees              - Create employee
GET    /employees              - List employees
GET    /employees/:id          - Get employee
PUT    /employees/:id          - Update employee
DELETE /employees/:id          - Archive employee
GET    /employees/:id/schedule - Get schedule
PUT    /employees/:id/schedule - Update schedule
```

### Jobs
```
POST /jobs                     - Create job
```

### LLM Chat (requires AWS credentials)
```
POST /llm-chat                 - AI chat with function calling
```

### VAPI Voice Agent
```
POST /webhooks/vapi/:tenantId  - VAPI webhook handler
GET  /api/tenants/:tenantId/vapi/config - Get VAPI config
PUT  /api/tenants/:tenantId/vapi/config - Update VAPI config
POST /api/tenants/:tenantId/vapi/provision - Provision VAPI assistant
GET  /api/tenants/:tenantId/vapi/calls - Call history
GET  /api/tenants/:tenantId/vapi/analytics - Analytics
```

---

## VAPI Voice Agent Setup (Optional)

VAPI integration allows voice calls to create customers and service requests automatically.

### 1. Get VAPI API Key

1. Sign up at https://dashboard.vapi.ai
2. Get your API key from the dashboard
3. Add it to `apps/api/.env`:
   ```env
   VAPI_API_KEY="your-vapi-api-key-here"
   ```

### 2. Set Up ngrok for Webhooks

VAPI needs a public URL to send webhooks to your local API:

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Get your authtoken:**
   - Go to https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken

3. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

4. **Start ngrok tunnel:**
   ```bash
   ngrok http 4000
   ```

5. **Copy the public URL** (e.g., `https://abc123.ngrok-free.dev`)

### 3. Provision VAPI for a Tenant

Run the provisioning script:

```bash
cd apps/api
npx tsx scripts/create-demo-tenant.ts
```

Or use the API:

```bash
# Provision VAPI assistant and phone number
curl -X POST http://localhost:4000/api/tenants/demo-hvac-tenant/vapi/provision \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: demo-hvac-tenant"
```

### 4. Update VAPI Assistant Webhook URL

After starting ngrok, update the assistant's webhook URL:

```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_VAPI_API_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    serverUrl = "https://YOUR_NGROK_URL.ngrok-free.dev/webhooks/vapi/demo-hvac-tenant"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.vapi.ai/assistant/ASSISTANT_ID" -Method PATCH -Headers $headers -Body $body
```

### 5. Test Voice Calls

Call the phone number assigned to your tenant's assistant. The call will:
- Create an unverified customer
- Create a service request
- Optionally book an appointment (if enabled)

View the results in the web app under **Customers > Unverified** tab.

### VAPI Scripts

**Create demo tenant:**
```bash
cd apps/api
npx tsx scripts/create-demo-tenant.ts
```

**Test VAPI connection:**
```bash
cd apps/api
VAPI_API_KEY="your-key" npx tsx scripts/test-vapi-connection.ts
```

**Validate VAPI call data:**
```bash
cd apps/api
npx tsx scripts/validate-vapi-call.ts
```

---

## AWS Credentials (Optional)

For LLM/AI features to work locally, you need AWS credentials with Bedrock access.

### Option 1: AWS CLI Configuration

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`

### Option 2: Environment Variables

Add to your shell profile or `apps/api/.env`:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

### Option 3: AWS Credentials File

Create `~/.aws/credentials`:

```ini
[default]
aws_access_key_id = your_access_key
aws_secret_access_key = your_secret_key
```

And `~/.aws/config`:

```ini
[default]
region = us-east-1
```

---

## Troubleshooting

### PostgreSQL Connection Issues

**Error:** `Error: P1001: Can't reach database server`

**Solution:**
1. Ensure Docker is running
2. Check if PostgreSQL container is running: `docker ps`
3. Restart the container: `docker restart fieldsmartpro-postgres`

### Prisma Client Issues

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
cd apps/api
npx prisma generate
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :4000
kill -9 <PID>
```

### Database Reset

If you encounter data issues:

```bash
cd apps/api
npx prisma migrate reset
```

### Next.js Cache Issues

If frontend changes aren't appearing:

```bash
cd apps/web
rm -rf .next
npm run dev
```

---

## Seed Data

After running `npx prisma db seed`, you'll have:

| Entity | Count | Examples |
|--------|-------|----------|
| Tenant | 1 | `local-tenant` |
| Users | 3 | Admin, 2 Technicians |
| Customers | 10 | John Smith, Emily Davis, etc. |
| Employees | 2 | Mike Johnson, Sarah Williams |
| Job Types | 5 | Repair, Installation, Maintenance, etc. |
| Services | 5 | Standard Service Call, Emergency Service, etc. |
| Materials | 5 | Copper Pipe, PVC Pipe, etc. |

---

## Development Workflow

### Making Database Changes

1. Edit `apps/api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_change_name`
3. Update seed data if needed in `apps/api/prisma/seed.ts`
4. Update TypeScript types in `apps/web/src/types/database.types.ts`

### Adding New API Endpoints

1. Create service in `apps/api/src/services/`
2. Add route in `apps/api/src/index.ts`
3. Create frontend service in `apps/web/src/services/`
4. Update types if needed

### Testing API Endpoints

Use PowerShell:
```powershell
# List customers
Invoke-RestMethod -Uri "http://localhost:4000/customers" -Headers @{"x-tenant-id"="local-tenant"}

# Create customer
$body = @{firstName="Test"; lastName="User"; email="test@example.com"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4000/customers" -Method POST -Headers @{"x-tenant-id"="local-tenant"; "Content-Type"="application/json"} -Body $body
```

Or use curl:
```bash
# List customers
curl -H "x-tenant-id: local-tenant" http://localhost:4000/customers

# Create customer
curl -X POST -H "Content-Type: application/json" -H "x-tenant-id: local-tenant" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com"}' \
  http://localhost:4000/customers
```

---

## Multi-Tenancy

The application supports multiple tenants. All API requests must include the `x-tenant-id` header:

```
x-tenant-id: local-tenant
```

For local development, use `local-tenant`. The seed data is created for this tenant.

---

## Need Help?

- Check the [Architecture Document](./ARCHITECTURE.md) for system overview
- Check the [DB Field Mapping](./DB_FIELD_MAPPING.csv) for database schema details
- Check the [Migration Plan](./DB_MIGRATION_PLAN.md) for migration strategy

---

## Quick Reference Commands

```bash
# Start PostgreSQL
docker start fieldsmartpro-postgres

# Stop PostgreSQL
docker stop fieldsmartpro-postgres

# Start Backend
cd apps/api && npm run dev

# Start Frontend
cd apps/web && npm run dev

# Open Prisma Studio
cd apps/api && npx prisma studio

# Reset Database
cd apps/api && npx prisma migrate reset

# Generate Prisma Client
cd apps/api && npx prisma generate

# Start ngrok for VAPI webhooks
ngrok http 4000

# Create demo tenant with VAPI
cd apps/api && npx tsx scripts/create-demo-tenant.ts

# Test VAPI connection
cd apps/api && VAPI_API_KEY="your-key" npx tsx scripts/test-vapi-connection.ts

# Validate VAPI call data
cd apps/api && npx tsx scripts/validate-vapi-call.ts
```

