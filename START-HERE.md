# 🚀 START HERE - Run FieldSmartPro Locally

## Quick Start (Easiest)

### 1. Install PostgreSQL

**Download:** https://www.postgresql.org/download/windows/

Or use Docker:
```bash
docker run --name fieldsmartpro-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

### 2. Run the Startup Script

```bash
cd C:\Users\ashok\Documents\IW\fieldsmartpro-monorepo
.\start-local.bat
```

This will:
- ✅ Check PostgreSQL is running
- ✅ Create database if needed
- ✅ Install all dependencies
- ✅ Run database migrations
- ✅ Start both API (port 3001) and Web (port 3000)

### 3. Create Test Tenant

Open another terminal:
```bash
cd apps\api
npm run studio
```

In Prisma Studio (browser opens):
1. Click "Tenant"
2. Click "Add record"
3. Fill in:
   - id: `local-tenant`
   - name: `Local Development`
   - subdomain: `local`
   - isActive: ✅
4. Save

### 4. Open the App

Go to: **http://localhost:3000**

## What You Get

| Service | URL |
|---------|-----|
| **Web App** | http://localhost:3000 |
| **API** | http://localhost:3001 |
| **API Health** | http://localhost:3001/health |
| **Prisma Studio** | http://localhost:5555 |

## Test the API

```bash
# Health check
curl http://localhost:3001/health

# Create a customer
curl -X POST http://localhost:3001/customers \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: local-tenant" \
  -d "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"john@example.com\",\"phone\":\"555-1234\"}"

# List customers
curl http://localhost:3001/customers?x-tenant-id=local-tenant
```

## Manual Setup (If Script Fails)

### 1. Install Dependencies
```bash
npm install
cd apps\web && npm install
cd ..\api && npm install
```

### 2. Setup Database
```bash
# Create database
psql -U postgres -c "CREATE DATABASE fieldsmartpro;"

# Generate Prisma client
cd apps\api
npm run generate

# Run migrations
npm run migrate
```

### 3. Start Servers
```bash
# From root
npm run dev
```

## Environment Variables

Already configured! But if you need to change:

### apps/api/.env
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fieldsmartpro?schema=public"
PORT=3001
```

### apps/web/.env.local
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_TENANT_ID=local-tenant
```

## Troubleshooting

### "PostgreSQL not running"
- Start PostgreSQL service in Windows Services
- Or use Docker: `docker start fieldsmartpro-db`

### "Port 3001 already in use"
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### "Can't connect to database"
Check password in `apps/api/.env`:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/fieldsmartpro"
```

### "Prisma client not found"
```bash
cd apps\api
npm run generate
```

## Development Commands

```bash
# Start everything
npm run dev

# Database GUI
cd apps\api && npm run studio

# New migration (after schema changes)
cd apps\api && npm run migrate

# Build for production
npm run build
```

## What's Working

✅ **Backend:**
- PostgreSQL database
- Express API server
- Create/List customers
- Create jobs
- Health check

✅ **Frontend:**
- Next.js web app
- Dashboard
- All pages from FieldSmartPro_UX
- Connected to local API

⚠️ **Not Working Yet:**
- AI Chat (needs AWS credentials)
- DynamoDB (local only uses PostgreSQL)
- Some service methods (need updating)

## Next Steps

1. ✅ Run locally - **START NOW!**
2. Test creating customers in web UI
3. Update service calls to match new API
4. Add missing endpoints
5. Deploy to AWS when ready

---

**Ready to start? Run:** `.\start-local.bat`

**Then open:** http://localhost:3000 🎉
