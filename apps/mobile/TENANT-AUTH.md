# Tenant-Based Authentication - Mobile App

## Overview

The mobile app now implements tenant-based authentication that validates users based on their email and automatically identifies their tenant. All API requests are scoped to the user's tenant for data isolation.

## How It Works

### 1. Login Flow

When a user logs in with email and password:

1. **Email Validation**: The API searches for the user by email across all tenants
2. **Tenant Identification**: The system automatically identifies which tenant the user belongs to
3. **Tenant Status Check**: Verifies the tenant is ACTIVE or in TRIAL status
4. **Response**: Returns user info including tenant details

```typescript
// Login request
{
  "email": "mike@fieldsmartpro.local",
  "password": "demo-hash"
}

// Login response
{
  "success": true,
  "token": "token-user123-1234567890",
  "user": {
    "id": "user123",
    "email": "mike@fieldsmartpro.local",
    "firstName": "Mike",
    "lastName": "Johnson",
    "role": "TECHNICIAN",
    "tenantId": "tenant-abc",
    "tenant": {
      "id": "tenant-abc",
      "name": "ABC Plumbing",
      "slug": "abc-plumbing",
      "status": "ACTIVE"
    }
  }
}
```

### 2. Tenant Storage

After successful login, the app stores:
- **Access Token**: For authentication
- **Refresh Token**: For token renewal (optional)
- **Tenant ID**: For scoping all API requests
- **User Data**: Including tenant information

Storage locations:
- `expo-secure-store`: For sensitive data (tokens, tenant ID)
- Zustand state: For active session data (user, tenant)

### 3. API Request Scoping

All API requests (except login/register) automatically include the tenant ID:

```typescript
// Request headers
{
  "Authorization": "Bearer token-user123-1234567890",
  "x-tenant-id": "tenant-abc"
}
```

This ensures:
- Users can only access data from their tenant
- Data isolation between tenants
- Automatic tenant scoping without manual intervention

## Implementation Details

### Files Modified

1. **services/api/client.ts**
   - Added `TENANT_ID_KEY` for secure storage
   - Updated `setTokens()` to accept and store tenant ID
   - Modified request interceptor to add `x-tenant-id` header from stored tenant ID
   - Updated `clearTokens()` to remove tenant ID on logout
   - Added `getTenantId()` method

2. **services/api/authService.ts**
   - Updated `LoginResponse` interface to include tenant details
   - Modified `login()` to extract and store tenant ID
   - Added validation to ensure tenant ID is present

3. **stores/authStore.ts**
   - Added `Tenant` interface
   - Updated `User` interface to include tenant information
   - Modified login action to store full tenant details
   - Enhanced logging for debugging tenant-based auth

4. **app/(tabs)/index.tsx**
   - Added tenant name display in header
   - Shows company name below user name

## Testing

### Test Users

Use these credentials to test different tenants:

```
Tenant: ABC Plumbing
Email: mike@fieldsmartpro.local
Password: demo-hash
Role: TECHNICIAN

Tenant: ABC Plumbing
Email: sarah@fieldsmartpro.local
Password: demo-hash
Role: DISPATCHER

Tenant: ABC Plumbing
Email: admin@fieldsmartpro.local
Password: demo-hash
Role: OWNER
```

### Verification Steps

1. **Login**: Verify login with different tenant users
2. **Token Storage**: Check SecureStore has tenant_id
3. **API Requests**: Monitor network requests include correct `x-tenant-id` header
4. **Data Isolation**: Verify users only see their tenant's data
5. **Tenant Display**: Check tenant name appears in Today screen header
6. **Logout**: Confirm tenant ID is cleared on logout

### Debug Logging

The implementation includes extensive logging:

```
[Auth Service] Login response: { success: true, userId: 'x', tenantId: 'y', tenantName: 'ABC Plumbing' }
[Auth Service] Stored credentials for tenant: tenant-abc
[API Client] Using tenant ID: tenant-abc
[Auth Store] Login successful: { userId: 'x', tenantId: 'y', tenantName: 'ABC Plumbing' }
```

## Security Considerations

### Token Storage
- Uses `expo-secure-store` for secure token and tenant ID storage
- Encrypted on device
- Automatically cleared on logout

### Tenant Validation
- Backend validates tenant status (ACTIVE/TRIAL) on login
- Tenant ID required for all authenticated requests
- No cross-tenant data access possible

### Error Handling
- Clear error messages for invalid credentials
- Separate errors for inactive tenants
- Fallback to default tenant ID if stored value missing (with warning)

## Future Enhancements

1. **Multi-Tenant Support**: Allow users with access to multiple tenants to switch between them
2. **Tenant Selection**: Add tenant picker if user has access to multiple organizations
3. **Offline Tenant Cache**: Store tenant info for offline access
4. **Tenant Branding**: Load tenant-specific colors, logos, and branding

## Troubleshooting

### Issue: "Using default tenant ID" warning
**Cause**: Tenant ID not stored or user not logged in
**Solution**: Ensure login completes successfully and stores tenant ID

### Issue: 401 Unauthorized errors
**Cause**: Invalid or missing tenant ID header
**Solution**: Check SecureStore has valid tenant_id, verify token is valid

### Issue: No data showing after login
**Cause**: Wrong tenant ID or tenant has no data
**Solution**: Verify tenant ID in request headers matches user's tenant

### Issue: Tenant name not showing
**Cause**: Tenant info not included in login response
**Solution**: Check API returns full tenant object in login response
