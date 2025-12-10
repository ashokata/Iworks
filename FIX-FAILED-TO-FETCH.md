# 🔧 Fix "Failed to fetch" Error

## Problem
Web app is still trying to connect to old port (3001) or needs restart to pick up new .env.local

## Solution

### 1. Stop the Web App
Press **Ctrl+C** in the terminal running the web app

### 2. Verify .env.local is Correct
Check `apps/web/.env.local` has:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_TENANT_ID=local-tenant
```

### 3. Restart Web App
```bash
cd C:\Users\ashok\Documents\IW\fieldsmartpro-monorepo\apps\web
npm run dev
```

### 4. Hard Refresh Browser
Once it starts, go to http://localhost:3000 and:
- Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
- Or clear cache and hard reload

## Verify API is Running

Before starting web app, make sure API is running:

```bash
# Should return healthy status
curl http://localhost:4000/health

# Should return 5 customers
curl http://localhost:4000/customers -H "x-tenant-id: local-tenant"
```

## Current Status:

✅ **API Running**: http://localhost:4000  
✅ **Demo Data Loaded**: 5 customers in database  
🔄 **Web App**: Needs restart to connect to port 4000

## Start Both Services:

### Terminal 1 - API (already running)
```bash
cd apps/api
npm run dev
```
Output should show:
```
🚀 API Server running on http://localhost:4000
```

### Terminal 2 - Web App (restart this)
```bash
cd apps/web
npm run dev
```

Then open: http://localhost:3000/customers

## If Still Getting Error:

### Check Browser Console (F12):
Look for actual error message. It might show:
- CORS error
- Network error
- 404 not found
- Connection refused

### Test API Directly in Browser:
Open: http://localhost:4000/health

Should show:
```json
{"status":"healthy","timestamp":"...","service":"fieldsmartpro-api"}
```

### Verify Web App is Using Correct URL:
Open browser console (F12) and type:
```javascript
console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
```

Should show: `http://localhost:4000`

If it shows the old URL or undefined, the web app needs a full rebuild:
```bash
cd apps/web
rm -rf .next
npm run dev
```

---

**After restarting the web app, it should connect to the API on port 4000!** ✅
