# ✅ Backend Now Running on Port 4000

## Changed Ports:

**Old:** 
- Port 3001 (conflicted)

**New:**
- ✅ **Port 4000** - API Server

## Updated Configuration:

### apps/api/.env
```env
PORT=4000
```

### apps/web/.env.local
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## 🧪 Test New Port:

```bash
# Health check
curl http://localhost:4000/health

# List customers
curl http://localhost:4000/customers -H "x-tenant-id: local-tenant"

# Create customer
curl -X POST http://localhost:4000/customers \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: local-tenant" \
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test@example.com\",\"phone\":\"555-9999\"}"
```

## 🚀 Current Services:

| Service | Port | URL |
|---------|------|-----|
| **API Server** | 4000 | http://localhost:4000 |
| **Web App** | 3000 | http://localhost:3000 (when started) |
| **Prisma Studio** | 5555 | http://localhost:5555 (when started) |
| **PostgreSQL** | 5432 | localhost:5432 (Docker) |

## Start Web App:

Now you can start the web app in a new terminal:

```bash
cd C:\Users\ashok\Documents\IW\fieldsmartpro-monorepo\apps\web
npm run dev
```

It will automatically connect to the API on port 4000!

Open: **http://localhost:3000**

---

**Backend is now running on port 4000 and ready to use!** ✅
