# WindSurf Project - Multi-tenant Application

## Overview
This application is built as a multi-tenant system where multiple organizations (tenants) can use the same application instance while keeping their data isolated. The application uses a shared database architecture where all tenants share the same database, but data is filtered by tenant ID to ensure proper isolation.

## Multi-tenant Architecture

### Key Components

1. **TenantContext**
   - Located in `src/contexts/TenantContext.tsx`
   - Manages tenant-specific information across the application
   - Provides tenant data to components that need it

2. **AuthContext with Tenant Support**
   - Located in `src/contexts/AuthContext.tsx`
   - Extended to support tenant-specific authentication
   - Users authenticate against a specific tenant
   - User data includes tenant ID for data filtering

3. **API Client with Tenant Filtering**
   - Located in `src/services/apiClient.ts`
   - Automatically includes tenant ID in all API requests
   - Filters data by tenant ID
   - Uses request interceptors to add tenant headers

4. **Tenant Registration**
   - Located in `src/app/register/page.tsx`
   - Allows new companies to self-register
   - Creates new tenant records
   - Sets up initial admin account

## Data Isolation

All data in the application is associated with a tenant ID, ensuring that users can only access data belonging to their tenant. This is enforced at multiple levels:

1. **API Layer**: All requests include the tenant ID
2. **Component Layer**: Components only receive data for the current tenant
3. **Authentication Layer**: User authentication is tied to a specific tenant

## User Flow

1. **Registration**
   - New companies register via `/register` page
   - Company details and admin account are created
   - Tenant record is created with unique ID

2. **Login**
   - Users select their company/tenant during login
   - Authentication is validated against the selected tenant
   - Upon successful login, tenant context is established

3. **Application Use**
   - All data access is automatically filtered by tenant ID
   - Users only see data belonging to their tenant

## Development Guidelines

When developing new features:

1. **Data Models**: Always include `tenantId` in data models
2. **API Endpoints**: Ensure all endpoints filter by tenant ID
3. **Components**: Use the `useTenant()` hook to access tenant information
4. **Authentication**: Use `useAuth()` hook to access authenticated user data including tenant ID

## Testing Multi-tenant Functionality

To test the multi-tenant functionality:

1. Register multiple tenant accounts
2. Login with different tenant credentials
3. Verify that data is properly isolated between tenants
4. Test tenant-specific customizations (themes, settings, etc.)
