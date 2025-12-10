# 🔧 Fix "Failed" Error - Quick Steps

## Problem
Customer service is updated but needs tenant setup.

## Solution (3 Steps)

### Step 1: Create Tenant in Prisma Studio

Prisma Studio should be open at: **http://localhost:5555**

If not, open it:
```bash
cd C:\Users\ashok\Documents\IW\fieldsmartpro-monorepo\apps\api
npm run studio
```

Then in the browser:
1. Click **"Tenant"** (left sidebar)
2. Click **"Add record"** button
3. Fill in exactly:
   ```
   id: local-tenant
   name: Local Development
   subdomain: local
   isActive: ✓ (checked)
   ```
4. Click **"Save 1 change"**

### Step 2: Test API Directly

```bash
# Create a customer via API
curl -X POST http://localhost:3001/customers -H "Content-Type: application/json" -H "x-tenant-id: local-tenant" -d "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"john@test.com\",\"phone\":\"555-1234\"}"

# Should return the created customer
```

### Step 3: Start Web App

In a NEW terminal:
```bash
cd C:\Users\ashok\Documents\IW\fieldsmartpro-monorepo\apps\web
npm run dev
```

Then go to: **http://localhost:3000/customers**

## What's Running:

| Service | URL | Status |
|---------|-----|--------|
| API | http://localhost:3001 | ✅ Running |
| Prisma Studio | http://localhost:5555 | ✅ Running |
| Web App | http://localhost:3000 | 🔜 Start it |

## Quick Test:

```bash
# Health check
curl http://localhost:3001/health

# List customers (will be empty at first)
curl http://localhost:3001/customers -H "x-tenant-id: local-tenant"
```

## Common Issues:

### "Missing tenant ID" error
- Make sure you created the tenant with id `local-tenant` in Prisma Studio
- Check it exists: Go to http://localhost:5555 → Tenant model

### "Failed to fetch" in web app
- Make sure API is running on port 3001
- Check `apps/web/.env.local` has:
  ```
  NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
  NEXT_PUBLIC_TENANT_ID=local-tenant
  ```

### Port 3001 not responding
- Restart API:
  ```bash
  cd apps/api
  npm run dev
  ```

## Full Reset (if needed):

```bash
# Stop everything
# Press Ctrl+C in all terminal windows

# Restart fresh
cd C:\Users\ashok\Documents\IW\fieldsmartpro-monorepo

# Terminal 1 - API
cd apps\api
npm run dev

# Terminal 2 - Web  
cd apps\web
npm run dev

# Terminal 3 - Prisma Studio (optional)
cd apps\api
npm run studio
```

---

**After creating the tenant, try creating a customer in the web UI!**
