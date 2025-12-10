# InField Works - PWA Frontend

A production-ready Progressive Web App (PWA) for field service management built with Next.js, TypeScript, and Tailwind CSS.

## Recent Updates

### December 1, 2025 - OData Integration & Customer Management Enhancements

**Commit: Add OData $expand for CustomerAddresses and improve error logging**

#### Changes
- ✅ **OData Expansion Support**: Added `$expand=CustomerAddresses` parameter to customer queries
  - Enables retrieval of customer addresses in a single API call
  - Reduces API round trips and improves performance
  - Supports OData v4 navigation property expansion

- ✅ **Enhanced Customer Edit Page**: Fixed address update functionality
  - Now properly updates existing addresses instead of creating duplicates
  - Uses `updateCustomerAddress()` method for existing addresses
  - Falls back to `addCustomerAddress()` for new addresses
  - Correctly identifies primary address for updates

- ✅ **Improved Error Logging**: Comprehensive debugging for API calls
  - Detailed error logging in customer service with request/response data
  - Enhanced React Query logging with execution flow tracking
  - Clear error categorization (response errors, network errors, request setup errors)
  - Fallback to mock data when API is unavailable with detailed logging

- ✅ **Schema Transformations**: Complete OData to frontend format conversion
  - Transforms OData `CustomerAddresses` to frontend address format
  - Handles nested navigation properties correctly
  - Preserves address metadata (type, isPrimary, timestamps)
  - Support for multiple address types (Primary, Billing, Service)

#### Technical Details
- **OData Endpoint**: `/odata/iworks/v1/Customers?$expand=CustomerAddresses`
- **API Proxy**: Next.js rewrites proxy `/api-proxy/odata/*` to `http://localhost:8090/odata/*`
- **Backend**: Mendix OData v4 service
- **Schema Transformation**: `transformCustomerFromApi()` handles OData response mapping
- **Error Handling**: Graceful fallback to mock data when backend is unavailable

#### Files Modified
- `src/services/simplePetCustomerService.ts` - Added OData $expand and enhanced logging
- `src/app/pet-customers/edit/[id]/page.tsx` - Fixed address update logic
- `src/app/pet-customers/page.tsx` - Enhanced React Query debugging
- `src/config/apiSchemas/customer.schema.ts` - OData schema transformations
- `openapi.json` - Added OData API specification

## Features

- 🔐 **Secure Authentication** - Auth0 integration with JWT tokens
- 📱 **Progressive Web App** - Offline support and native app-like experience
- 📊 **Job Dashboard** - Real-time job management and tracking
- 📅 **Scheduling System** - Role-based calendar views for admins and technicians
- 🎤 **Voice Assistant** - Voice command integration (placeholder for AI services)
- 📱 **Mobile-First Design** - Responsive UI optimized for field technicians
- ⚡ **Performance** - React Query for efficient data fetching and caching
- 🔒 **Security** - Input sanitization, HTTPS, and secure token handling
- 🏢 **Multi-tenancy** - Full support for multi-tenant architecture

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI
- **State Management**: TanStack React Query
- **Authentication**: Auth0
- **API Client**: Axios with interceptors
- **Calendar**: React Big Calendar with date-fns
- **PWA**: next-pwa
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Configure your environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=/api-proxy
   ```
   
   **Note**: The application uses `/api-proxy` which is proxied to your Mendix backend (configured in `next.config.js`). If you need to change the backend URL, update the rewrite rules in `next.config.js`.

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── dashboard/       # Job dashboard
│   ├── jobs/           # Job management pages
│   ├── login/          # Authentication
│   ├── scheduler/      # Schedule management
│   │   ├── admin/      # Admin schedule view
│   │   └── technician/ # Technician schedule view
│   └── layout.tsx      # Root layout
├── components/         # Reusable UI components
│   └── ui/            # Base UI components
├── hooks/             # Custom React hooks
│   └── useVoiceAssistant.ts
├── lib/               # Utility functions
├── providers/         # React context providers
├── services/          # API client and services
│   ├── scheduleService.ts # Schedule management service
│   └── technicianService.ts # Technician service
└── types/             # TypeScript type definitions
    └── scheduleTypes.ts # Schedule-related types
```

## API Integration

The app integrates with a Mendix backend through REST APIs:

- `GET /api/jobs` - Fetch jobs list
- `POST /api/jobs` - Create new job

### Sample API Response

```json
[
  {
    "id": "job123",
    "title": "Install AC",
    "status": "Scheduled",
    "assignedTo": "techA",
    "date": "2025-07-21",
    "priority": "High",
    "location": "123 Main St"
  }
]
```

## PWA Features

- **Offline Support**: Service worker caches jobs for offline viewing
- **App-like Experience**: Installable on mobile devices
- **Background Sync**: Syncs data when connection is restored
- **Push Notifications**: Ready for notification integration

## Scheduling System

The application includes a comprehensive scheduling system with role-based access:

- **Admin View**: View and manage schedules for all technicians
  - Filter by technician, date range, or event type
  - Multiple calendar views (day, week, month)
  - Color-coded events by type and status

- **Technician View**: Personal schedule visible only to the assigned technician
  - Daily, weekly, and monthly calendar views
  - Event details including location, description, and job links
  - Status indicators for scheduled, in-progress, and completed events

- **Integration with Jobs**: Seamlessly converts jobs to scheduled events
  - Preserves job details and assignments
  - Updates job status when schedule events are modified

## Voice Assistant Integration

The app includes a placeholder `useVoiceAssistant` hook designed for future integration with:
- Retell AI
- OpenAI Voice APIs
- Other voice processing services

## Security Features

- JWT token authentication
- Secure token storage
- Input validation and sanitization
- CORS protection
- HTTPS enforcement
- Environment variable management

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Set these in your deployment platform:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com
NEXT_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
