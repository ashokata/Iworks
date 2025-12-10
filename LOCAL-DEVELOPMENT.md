# 🚀 Run Frontend + Backend Locally

## Prerequisites

You need **PostgreSQL** installed locally.

### Install PostgreSQL (Windows)

1. Download: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember your password!
4. Default port: 5432

Or use Docker:
```bash
docker run --name fieldsmartpro-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

## Setup (One-time)

### 1. Install All Dependencies

```bash
cd C:\Users\ashok\Documents\IW\fieldsmartpro-monorepo
npm install
```

### 2. Create Database

```bash
# Using psql
psql -U postgres
CREATE DATABASE fieldsmartpro;
\q
```

Or with Docker:
```bash
docker exec -it fieldsmartpro-db psql -U postgres -c "CREATE DATABASE fieldsmartpro;"
```

### 3. Setup API

```bash
cd apps\api

# Install dependencies
npm install

# Generate Prisma client
npm run generate

# Run migrations (creates tables)
npm run migrate
```

### 4. Create Test Tenant

```bash
cd apps\api
npm run studio
```

In Prisma Studio (opens in browser):
1. Click "Tenant" model
2. Click "Add record"
3. Fill in:
   - id: `local-tenant`
   - name: `Local Development`
   - subdomain: `local`
   - isActive: `true`
4. Click "Save 1 change"

## Run Everything

### Option 1: Both Together (Turborepo - Recommended)

```bash
cd C:\Users\ashok\Documents\IW\fieldsmartpro-monorepo
npm run dev
```

This starts:
- ✅ API on http://localhost:3001
- ✅ Web on http://localhost:3000

### Option 2: Separately

**Terminal 1 - API:**
```bash
cd C:\Users\ashok\Documents\IW\fieldsmartpro-monorepo\apps\api
npm run dev
```

**Terminal 2 - Web:**
```bash
cd C:\Users\ashok\Documents\IW\fieldsmartpro-monorepo\apps\web
npm run dev
```

## Test It

### 1. Check API Health

```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-10T15:32:00.000Z",
  "service": "fieldsmartpro-api"
}
```

### 2. Create a Customer

```bash
curl -X POST http://localhost:3001/customers \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: local-tenant" \
  -d "{
    \"firstName\": \"John\",
    \"lastName\": \"Doe\",
    \"email\": \"john@example.com\",
    \"phone\": \"555-1234\"
  }"
```

### 3. Open Web App

Go to http://localhost:3000

- Dashboard should load
- Try creating a customer
- Try viewing customers

## Troubleshooting

### Database Connection Error

**Error:** `Can't reach database server`

**Fix:**
1. Make sure PostgreSQL is running
2. Check connection string in `apps/api/.env`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fieldsmartpro?schema=public"
   ```
3. Test connection:
   ```bash
   psql -U postgres -d fieldsmartpro
   ```

### Port Already in Use

**Error:** `Port 3001 already in use`

**Fix:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill it
taskkill /PID <PID> /F

# Or use different port
# Edit apps/api/.env:
PORT=3002
```

### Web App Can't Connect to API

**Error:** `Failed to fetch` or `Network error`

**Fix:**
1. Make sure API is running on port 3001
2. Check `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```
3. Check browser console for CORS errors

### Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Fix:**
```bash
cd apps\api
npm run generate
```

### Missing uuid Module

**Error:** `Cannot find module 'uuid'`

**Fix:**
```bash
cd apps\api
npm install uuid
```

## Development Workflow

```bash
# Start development
npm run dev

# Run Prisma Studio (view/edit database)
cd apps\api && npm run studio

# Create new migration (after schema changes)
cd apps\api && npm run migrate

# Regenerate Prisma client
cd apps\api && npm run generate

# Build for production
npm run build

# Lint all code
npm run lint
```

## What's Running?

| Service | URL | Port |
|---------|-----|------|
| Web App | http://localhost:3000 | 3000 |
| API Server | http://localhost:3001 | 3001 |
| PostgreSQL | localhost | 5432 |
| Prisma Studio | http://localhost:5555 | 5555 |

## Environment Files

### apps/api/.env
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fieldsmartpro?schema=public"
AWS_REGION="us-east-1"
NODE_ENV="development"
PORT=3001
```

### apps/web/.env.local
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_TENANT_ID=local-tenant
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-token
```

## Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/customers` | Create customer |
| GET | `/customers` | List customers |
| GET | `/customers?search=john` | Search customers |
| POST | `/jobs` | Create job |
| POST | `/chat` | AI chat (needs AWS credentials) |

## Notes

- **AI Chat** won't work locally without AWS credentials configured
- **DynamoDB** endpoints will fail (chat/cache) - they need real AWS
- Use **Prisma Studio** to view/edit database directly
- **Mapbox** token is optional - maps won't work without it

## Next Steps

1. ✅ Run locally - TEST IT
2. Add more API endpoints (update, delete)
3. Update web service calls to match new API
4. Deploy to AWS when ready

---

**You're now running the full stack locally!** 🎉

Backend (PostgreSQL + Express): http://localhost:3001
Frontend (Next.js): http://localhost:3000
