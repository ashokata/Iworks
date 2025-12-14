# VAPI Voice Agent Integration Architecture

## Executive Summary

This document outlines the architecture for integrating VAPI (Voice AI Platform) to provide each tenant with an AI-powered virtual front desk. When customers call a tenant's dedicated phone number, the VAPI voice agent will handle the call like a real receptionist - gathering information, creating service requests, and optionally booking appointments.

## 1. Core Features

### 1.1 Tenant Onboarding
- **Auto-provisioning**: When a new tenant signs up, automatically create:
  - VAPI Assistant (voice agent)
  - Dedicated phone number
  - Custom voice script based on company profile
  - Webhook endpoints for tool calls

### 1.2 Voice Agent Capabilities
| Feature | Description | Tier |
|---------|-------------|------|
| Answer Calls | Professional greeting with company name | Standard |
| Capture Customer Info | Name, phone, email, address | Standard |
| Create Draft Customer | Customer with UNVERIFIED status | Standard |
| Create Service Request | Capture problem description | Standard |
| Check Availability | Query technician calendar | Premium |
| Book Appointment | Schedule technician visit | Premium |
| Notify Owner | Real-time alerts via SMS/Email/Push | Standard |

### 1.3 Call Flow Script
```
1. Greeting: "Thank you for calling {Company Name}. This is your AI assistant. How may I help you today?"

2. Problem Capture: Listen and categorize the issue (HVAC, Plumbing, Electrical, etc.)

3. Customer Verification:
   - "May I have your name please?"
   - "And the best phone number to reach you?"
   - "What's the address where the service is needed?"

4. Service Request Creation:
   - Confirm details
   - Create customer (UNVERIFIED) + service request
   - Generate confirmation number

5. [Premium] Appointment Booking:
   - "Would you like to schedule a technician visit?"
   - Check availability
   - Offer slots
   - Confirm booking

6. Closing: "Is there anything else I can help you with today?"
```

## 2. Database Schema Changes

### 2.1 New Tables

```prisma
// Tenant VAPI Configuration
model VapiConfiguration {
  id                    String   @id @default(uuid())
  tenantId              String   @unique
  tenant                Tenant   @relation(fields: [tenantId], references: [id])
  
  // VAPI Resources
  vapiAssistantId       String?  // VAPI Assistant ID
  vapiPhoneNumberId     String?  // VAPI Phone Number ID
  phoneNumber           String?  // E.164 format phone number
  
  // Feature Flags
  isEnabled             Boolean  @default(false)
  appointmentBookingEnabled Boolean @default(false)  // Premium feature
  
  // Customization
  companyGreeting       String?  // Custom greeting override
  voiceId               String?  // VAPI voice selection
  businessHours         Json?    // { mon: { start: "09:00", end: "17:00" }, ... }
  afterHoursMessage     String?  // Message for after-hours calls
  
  // Notifications
  notifyEmail           Boolean  @default(true)
  notifySms             Boolean  @default(false)
  notifyPush            Boolean  @default(true)
  notificationRecipients Json?   // Array of { email, phone, userId }
  
  // Analytics
  totalCalls            Int      @default(0)
  customersCreated      Int      @default(0)
  appointmentsBooked    Int      @default(0)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  callLogs              VoiceCallLog[]
}

// Call History
model VoiceCallLog {
  id                    String   @id @default(uuid())
  vapiConfigId          String
  vapiConfig            VapiConfiguration @relation(fields: [vapiConfigId], references: [id])
  
  // VAPI Call Data
  vapiCallId            String   @unique
  callerNumber          String
  duration              Int      // seconds
  recordingUrl          String?
  transcriptUrl         String?
  
  // Outcomes
  customerId            String?  // Created customer
  serviceRequestId      String?  // Created service request
  appointmentId         String?  // Booked appointment
  
  // Status
  status                String   // COMPLETED, FAILED, ABANDONED, TRANSFERRED
  callSummary           String?  // AI-generated summary
  sentiment             String?  // POSITIVE, NEUTRAL, NEGATIVE
  
  createdAt             DateTime @default(now())
  
  @@index([vapiConfigId, createdAt])
}
```

### 2.2 Customer Model Updates

```prisma
model Customer {
  // ... existing fields ...
  
  // New field for verification status
  verificationStatus    String   @default("VERIFIED")  // UNVERIFIED, VERIFIED, REJECTED
  
  // Source tracking
  createdSource         String   @default("WEB")  // WEB, MOBILE, VOICE_AGENT, API
  voiceCallId           String?  // Reference to VoiceCallLog if created via VAPI
}
```

### 2.3 Service Request Updates

```prisma
model ServiceRequest {
  id                    String   @id @default(uuid())
  tenantId              String
  customerId            String
  
  // Request Details
  title                 String
  description           String
  problemType           String   // HVAC, PLUMBING, ELECTRICAL, etc.
  urgency               String   // LOW, MEDIUM, HIGH, EMERGENCY
  
  // Status
  status                String   @default("NEW")  // NEW, ASSIGNED, IN_PROGRESS, COMPLETED
  
  // Source tracking
  createdSource         String   @default("WEB")
  voiceCallId           String?
  
  // Relationships
  appointmentId         String?  // If appointment was booked
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

## 3. VAPI Integration Service

### 3.1 Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VAPI Integration Service                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Tenant Onboarding│  │ Assistant Manager│  │ Phone Manager  │ │
│  │ Service          │  │                  │  │                │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘ │
│           │                     │                     │          │
│           └─────────────────────┼─────────────────────┘          │
│                                 │                                │
│                    ┌────────────▼───────────┐                   │
│                    │    VAPI API Client     │                   │
│                    │    (REST + Webhooks)   │                   │
│                    └────────────────────────┘                   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                       Tool Functions                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ createCust │ │ createSR   │ │ checkAvail │ │ bookAppt     │  │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────┘  │
│  ┌────────────┐ ┌────────────┐                                  │
│  │ notifyOwner│ │ endCall    │                                  │
│  └────────────┘ └────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 VAPI Assistant Configuration

```json
{
  "name": "FieldSmartPro - {TenantName} Front Desk",
  "model": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "systemPrompt": "You are a professional front desk assistant for {companyName}, a {industryType} service company. Your role is to:\n\n1. Greet callers warmly and professionally\n2. Understand their service needs\n3. Collect necessary information (name, phone, address)\n4. Create a service request\n5. Optionally help schedule an appointment\n\nAlways be helpful, empathetic, and efficient. If you cannot help with something, politely explain and offer alternatives."
  },
  "voice": {
    "provider": "11labs",
    "voiceId": "rachel"
  },
  "firstMessage": "Thank you for calling {companyName}. My name is Aria, your virtual assistant. How may I help you today?",
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-2",
    "language": "en"
  },
  "serverUrl": "https://api.fieldsmartpro.com/webhooks/vapi/{tenantId}",
  "endCallFunctionEnabled": true,
  "silenceTimeoutSeconds": 30,
  "maxDurationSeconds": 600
}
```

### 3.3 Tool Function Definitions

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "createCustomerAndServiceRequest",
        "description": "Create a new customer and service request in the system. Call this after collecting customer information and understanding their service need.",
        "parameters": {
          "type": "object",
          "properties": {
            "customerName": {
              "type": "string",
              "description": "Full name of the customer"
            },
            "phoneNumber": {
              "type": "string",
              "description": "Customer phone number"
            },
            "email": {
              "type": "string",
              "description": "Customer email (optional)"
            },
            "address": {
              "type": "object",
              "properties": {
                "street": { "type": "string" },
                "city": { "type": "string" },
                "state": { "type": "string" },
                "zipCode": { "type": "string" }
              },
              "required": ["street", "city", "state", "zipCode"]
            },
            "problemType": {
              "type": "string",
              "enum": ["HVAC", "PLUMBING", "ELECTRICAL", "APPLIANCE", "OTHER"],
              "description": "Category of the service issue"
            },
            "problemDescription": {
              "type": "string",
              "description": "Detailed description of the problem"
            },
            "urgency": {
              "type": "string",
              "enum": ["LOW", "MEDIUM", "HIGH", "EMERGENCY"],
              "description": "How urgent is the issue"
            }
          },
          "required": ["customerName", "phoneNumber", "address", "problemType", "problemDescription"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "checkTechnicianAvailability",
        "description": "Check available time slots for technician visits. Only call if appointment booking is enabled.",
        "parameters": {
          "type": "object",
          "properties": {
            "date": {
              "type": "string",
              "description": "Date to check availability (YYYY-MM-DD format)"
            },
            "problemType": {
              "type": "string",
              "description": "Type of service needed to match with qualified technicians"
            }
          },
          "required": ["problemType"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "bookAppointment",
        "description": "Book a technician appointment for the customer",
        "parameters": {
          "type": "object",
          "properties": {
            "customerId": {
              "type": "string",
              "description": "Customer ID from createCustomerAndServiceRequest"
            },
            "serviceRequestId": {
              "type": "string",
              "description": "Service request ID"
            },
            "slotId": {
              "type": "string",
              "description": "Selected time slot ID from checkTechnicianAvailability"
            }
          },
          "required": ["customerId", "serviceRequestId", "slotId"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "transferToHuman",
        "description": "Transfer the call to a human representative when the caller explicitly requests it or the issue requires human intervention",
        "parameters": {
          "type": "object",
          "properties": {
            "reason": {
              "type": "string",
              "description": "Reason for transfer"
            }
          }
        }
      }
    }
  ]
}
```

## 4. API Endpoints

### 4.1 VAPI Webhook Endpoints

```typescript
// POST /webhooks/vapi/:tenantId/tool-call
// Handles tool function calls from VAPI during conversation

// POST /webhooks/vapi/:tenantId/call-ended
// Receives call completion notification, logs call, sends notifications

// POST /webhooks/vapi/:tenantId/transcription
// Receives real-time transcription updates
```

### 4.2 Admin Endpoints

```typescript
// GET /api/tenants/:tenantId/vapi/config
// Get VAPI configuration for tenant

// PUT /api/tenants/:tenantId/vapi/config
// Update VAPI configuration

// POST /api/tenants/:tenantId/vapi/provision
// Provision VAPI resources (assistant + phone)

// DELETE /api/tenants/:tenantId/vapi/deprovision
// Remove VAPI resources

// GET /api/tenants/:tenantId/vapi/calls
// List call history with pagination

// GET /api/tenants/:tenantId/vapi/analytics
// Get call analytics and metrics
```

## 5. Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema updates (Prisma migrations)
- [ ] VAPI API client service
- [ ] Webhook handler infrastructure
- [ ] Basic tool functions (createCustomer, createServiceRequest)

### Phase 2: Core Integration (Week 3-4)
- [ ] Tenant onboarding flow with VAPI provisioning
- [ ] Assistant configuration with dynamic prompts
- [ ] Phone number provisioning
- [ ] Owner notification system (email/SMS/push)

### Phase 3: Premium Features (Week 5-6)
- [ ] Technician availability integration
- [ ] Appointment booking flow
- [ ] Call analytics dashboard
- [ ] Recording/transcription storage

### Phase 4: Polish & Testing (Week 7-8)
- [ ] End-to-end testing with real calls
- [ ] Voice/prompt optimization
- [ ] Error handling and edge cases
- [ ] Admin UI for configuration

## 6. Cost Considerations

### VAPI Pricing Model
| Resource | Cost | Notes |
|----------|------|-------|
| Phone Number | $2/month | Per tenant |
| Inbound Minutes | $0.05/min | Voice + AI processing |
| Outbound Minutes | $0.10/min | If implementing callbacks |
| Transcription | Included | With call minutes |

### Tenant Billing Options
1. **Included in Base Plan**: Cover first N minutes/month
2. **Usage-Based**: Pass through VAPI costs + margin
3. **Premium Add-on**: Fixed monthly fee for voice agent feature

## 7. Security Considerations

### 7.1 Data Protection
- Phone numbers and recordings are PII - encrypt at rest
- VAPI webhook authentication with signed payloads
- Rate limiting on webhook endpoints
- Call recordings retention policy (30 days default)

### 7.2 Access Control
- Only tenant admins can configure VAPI settings
- Webhook endpoints validate tenant ownership
- API key rotation for VAPI credentials

## 8. Notification System

### 8.1 New Customer/Request Notification
```typescript
interface NewRequestNotification {
  type: 'NEW_VOICE_REQUEST';
  tenant: {
    id: string;
    name: string;
  };
  customer: {
    name: string;
    phone: string;
    address: string;
    verificationStatus: 'UNVERIFIED';
  };
  serviceRequest: {
    id: string;
    problemType: string;
    description: string;
    urgency: string;
  };
  appointment?: {
    date: string;
    timeSlot: string;
    technicianName: string;
  };
  callDuration: number;
  recordingUrl?: string;
}
```

### 8.2 Notification Channels
- **Email**: Detailed summary with call transcript
- **SMS**: Brief alert with link to dashboard
- **Push**: Real-time notification in web/mobile app
- **Webhook**: For custom integrations

## 9. File Structure

```
apps/api/src/
├── services/
│   └── vapi/
│       ├── vapi.client.ts           # VAPI API client
│       ├── vapi.service.ts          # Main service
│       ├── vapi.provisioning.ts     # Tenant setup
│       ├── vapi.tools.ts            # Tool function handlers
│       └── vapi.webhooks.ts         # Webhook handlers
├── routes/
│   └── vapi.routes.ts               # API routes
└── types/
    └── vapi.types.ts                # TypeScript interfaces

apps/web/src/app/
└── settings/
    └── voice-agent/
        ├── page.tsx                 # Configuration UI
        ├── calls/page.tsx           # Call history
        └── analytics/page.tsx       # Analytics dashboard
```

## 10. Example Usage Flow

### Tenant Onboarding
```typescript
// When tenant signs up or enables voice agent
await vapiService.provisionTenant({
  tenantId: 'tenant-123',
  companyName: 'ABC HVAC Services',
  industry: 'HVAC',
  features: {
    appointmentBooking: true,  // Premium
    afterHoursVoicemail: true
  },
  notifications: {
    email: ['owner@abchvac.com'],
    sms: ['+1234567890']
  }
});

// Returns:
{
  phoneNumber: '+1-555-123-4567',
  assistantId: 'asst_abc123',
  webhookUrl: 'https://api.fieldsmartpro.com/webhooks/vapi/tenant-123'
}
```

### Incoming Call Flow
```
1. Customer dials +1-555-123-4567
2. VAPI answers with configured greeting
3. Customer: "My AC isn't working"
4. VAPI: "I'm sorry to hear that. I can help you schedule a service visit..."
5. [Collects info via conversation]
6. VAPI calls createCustomerAndServiceRequest tool
7. Backend creates Customer (UNVERIFIED) + ServiceRequest
8. VAPI: "I've created a service request #SR-1234 for you..."
9. [If premium] VAPI offers appointment slots
10. Call ends → notification sent to owner
```

---

## Next Steps

1. **Review and approve architecture**
2. **Set up VAPI account and API keys**
3. **Begin Phase 1 implementation**

Questions to resolve:
- What phone number area codes should we support?
- Should recordings be stored long-term or just 30 days?
- Do we need multi-language support initially?

