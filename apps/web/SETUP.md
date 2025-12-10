# Setup Guide for FieldSmartPro UX

This guide helps you set up the FieldSmartPro application on your local machine.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Access to the Mendix backend (or ability to run it locally)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ashokata/FieldSmartPro_UX.git
cd FieldSmartPro_UX
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

The default `.env.local` should contain:

```env
NEXT_PUBLIC_API_BASE_URL=/api-proxy
```

**This configuration is usually correct and doesn't need changes.**

### 4. Backend Configuration

The application expects a Mendix backend running on `http://localhost:8090`.

#### Option A: Run Backend Locally (Recommended)

If you have access to the Mendix backend:

1. Start your Mendix application
2. Ensure it's running on port `8090`
3. Verify OData endpoint is accessible at `http://localhost:8090/odata/iworks/v1/`

#### Option B: Connect to Remote Backend

If the backend is running on another machine or server:

1. Open `next.config.js`
2. Update the `rewrites()` section to point to your backend URL:

```javascript
async rewrites() {
  return [
    {
      source: '/api-proxy/odata/:path*',
      destination: 'http://YOUR_BACKEND_SERVER:8090/odata/:path*',
    },
    {
      source: '/api-proxy/rest/:path*',
      destination: 'http://YOUR_BACKEND_SERVER:8090/rest/:path*',
    },
    {
      source: '/api-proxy/:path*',
      destination: 'http://YOUR_BACKEND_SERVER:8090/:path*',
    },
  ]
},
```

Replace `YOUR_BACKEND_SERVER` with:
- Your server's IP address (e.g., `192.168.1.100`)
- Your server's hostname (e.g., `mendix-server.local`)
- Your deployed URL (e.g., `api.yourcompany.com`)

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Verification

To verify everything is working:

1. Navigate to the Customers page: `http://localhost:3000/pet-customers`
2. You should see customer data loaded from the backend
3. If you see "Failed to fetch customers" or no data:
   - Check if backend is running
   - Verify backend URL configuration
   - Check browser console for error messages
   - Verify backend OData endpoint: `http://localhost:8090/odata/iworks/v1/Customers`

## Common Issues

### Issue: "Failed to fetch customers"

**Cause**: Backend is not accessible

**Solutions**:
1. Verify backend is running: `curl http://localhost:8090/odata/iworks/v1/Customers`
2. Check `next.config.js` has correct backend URL
3. Ensure no firewall blocking port 8090
4. Check backend logs for errors

### Issue: "CORS errors" in browser console

**Cause**: Next.js proxy not working correctly

**Solutions**:
1. Ensure you're using `/api-proxy` prefix (not direct backend URL)
2. Restart Next.js dev server after changing `next.config.js`
3. Clear browser cache

### Issue: Application loads but shows no data

**Cause**: Backend is accessible but returning empty data

**Solutions**:
1. Check backend database has customer data
2. Verify OData endpoint permissions
3. Check backend logs for authentication issues

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

For production deployment (Vercel, AWS, etc.), set these environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-production-backend.com
```

Update `next.config.js` rewrites to use production backend URL or remove rewrites if using direct backend URL.

## Backend API Endpoints

The application uses these OData v4 endpoints:

- **Customers**: `/odata/iworks/v1/Customers`
- **Customer Addresses**: `/odata/iworks/v1/CustomerAddresses`
- **Jobs**: `/odata/iworks/v1/Jobs`
- **Invoices**: `/odata/iworks/v1/Invoices`
- **Technicians**: `/odata/iworks/v1/Technicians`

## Support

If you encounter issues:

1. Check this setup guide
2. Review error messages in browser console
3. Check backend logs
4. Contact the development team

## Development Team

For questions or issues, contact:
- Veera Kuppili (veera.k@iworks.net)
