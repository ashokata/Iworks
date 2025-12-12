# FieldSmartPro - High Level Architecture

## System Overview

FieldSmartPro is a field service management platform with AI-powered assistance, built on a modern serverless architecture.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                      USERS                                               │
│                    (Field Technicians, Dispatchers, Admins)                             │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND                                               │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         Next.js 15 Web Application                                 │  │
│  │                         (http://localhost:3000)                                    │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │  │
│  │  │   Dashboard     │  │   Customers     │  │     Jobs        │  │   Invoices   │  │  │
│  │  │   /dashboard    │  │   /customers    │  │     /jobs       │  │   /invoices  │  │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────────┘  │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │  │
│  │  │   Scheduler     │  │   Employees     │  │    Settings     │  │   Reports    │  │  │
│  │  │   /scheduler    │  │   /employees    │  │    /settings    │  │   /reports   │  │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────────┘  │  │
│  │                                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        AIRA - AI Chat Assistant                              │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │  │  │
│  │  │  │  Text Input │  │ Voice Input │  │  Streaming  │  │  Function Calling   │ │  │  │
│  │  │  │  (ChatBot)  │  │ (Web Speech)│  │  Response   │  │  (Create Customer)  │ │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Frontend Services                                     │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │  │
│  │  │ customerService │  │   jobService    │  │ invoiceService  │  │  apiClient   │  │  │
│  │  │  (CRUD ops)     │  │   (CRUD ops)    │  │   (CRUD ops)    │  │  (Axios)     │  │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTP/REST
                                          │ x-tenant-id header
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER (Express.js)                                      │
│                              (http://localhost:4000)                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              REST API Endpoints                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  POST /customers    GET /customers    GET /customers/:id   PUT /customers/:id│  │  │
│  │  │  POST /jobs         GET /jobs         GET /jobs/:id        PUT /jobs/:id     │  │  │
│  │  │  POST /invoices     GET /invoices     GET /invoices/:id    PUT /invoices/:id │  │  │
│  │  │  GET  /health       GET /health/db                                           │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                         POST /llm-chat                                       │  │  │
│  │  │                    (AI Chat with Function Calling)                           │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Lambda Handlers                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │  │
│  │  │ create-postgres │  │  list-postgres  │  │  get-postgres   │  │update-postgres│ │  │
│  │  │   (Customer)    │  │   (Customer)    │  │   (Customer)    │  │  (Customer)  │  │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                          llm-chat/index.ts                                   │  │  │
│  │  │                    (Orchestrates AI + Function Execution)                    │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Service Layer                                         │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────────────┐  │  │
│  │  │customer.postgres.svc │  │  job.postgres.svc    │  │  invoice.postgres.svc   │  │  │
│  │  │  - createCustomer    │  │  - createJob         │  │  - createInvoice        │  │  │
│  │  │  - getCustomer       │  │  - getJob            │  │  - getInvoice           │  │  │
│  │  │  - listCustomers     │  │  - listJobs          │  │  - listInvoices         │  │  │
│  │  │  - updateCustomer    │  │  - updateJob         │  │  - updateInvoice        │  │  │
│  │  │  - deleteCustomer    │  │  - deleteJob         │  │  - deleteInvoice        │  │  │
│  │  │  - searchCustomers   │  │                      │  │                         │  │  │
│  │  └──────────────────────┘  └──────────────────────┘  └─────────────────────────┘  │  │
│  │                                                                                    │  │
│  │  ┌──────────────────────┐  ┌──────────────────────────────────────────────────┐   │  │
│  │  │   bedrock-llm.svc    │  │           llm-function-executor.ts               │   │  │
│  │  │  - invoke (Claude)   │  │  - createCustomer()  - searchCustomer()          │   │  │
│  │  │  - invokeWithTools   │  │  - updateCustomer()  - createJob()               │   │  │
│  │  │  - streaming         │  │  - getJobStatus()    - updateInvoice()           │   │  │
│  │  └──────────────────────┘  │  - sendNotification()                            │   │  │
│  │                            └──────────────────────────────────────────────────┘   │  │
│  │                                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                          prisma.service.ts                                    │ │  │
│  │  │                    (Prisma ORM - Database Connection)                         │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                    │                                               │
                    │ SQL Queries                                   │ AWS SDK
                    │ (Prisma ORM)                                  │ (Bedrock Runtime)
                    ▼                                               ▼
┌───────────────────────────────────────────┐   ┌─────────────────────────────────────────┐
│              POSTGRESQL                    │   │              AWS BEDROCK                 │
│         (localhost:5432)                   │   │            (us-east-1)                   │
│  ┌──────────────────────────────────────┐ │   │  ┌────────────────────────────────────┐  │
│  │        fieldsmartpro DB              │ │   │  │     Claude 3.5 Sonnet v2           │  │
│  │  ┌────────────┐  ┌────────────────┐  │ │   │  │  us.anthropic.claude-3-5-sonnet-   │  │
│  │  │  Tenant    │  │    User        │  │ │   │  │       20241022-v2:0                │  │
│  │  │  - id      │  │    - id        │  │ │   │  │                                    │  │
│  │  │  - name    │  │    - email     │  │ │   │  │  Features:                         │  │
│  │  │  - slug    │  │    - role      │  │ │   │  │  - Natural Language Understanding  │  │
│  │  └────────────┘  └────────────────┘  │ │   │  │  - Function/Tool Calling           │  │
│  │  ┌────────────┐  ┌────────────────┐  │ │   │  │  - Context-Aware Responses         │  │
│  │  │  Customer  │  │    Address     │  │ │   │  │  - Multi-turn Conversations        │  │
│  │  │  - id      │  │    - id        │  │ │   │  └────────────────────────────────────┘  │
│  │  │  - name    │  │    - street    │  │ │   │                                          │
│  │  │  - email   │  │    - city      │  │ │   │  ┌────────────────────────────────────┐  │
│  │  │  - phone   │  │    - state     │  │ │   │  │         Tool Definitions           │  │
│  │  │  - type    │  │    - zip       │  │ │   │  │  - createCustomer                  │  │
│  │  └────────────┘  └────────────────┘  │ │   │  │  - searchCustomer                  │  │
│  │  ┌────────────┐  ┌────────────────┐  │ │   │  │  - updateCustomer                  │  │
│  │  │    Job     │  │  JobLineItem   │  │ │   │  │  - createJob                       │  │
│  │  │  - id      │  │    - id        │  │ │   │  │  - getJobStatus                    │  │
│  │  │  - status  │  │    - service   │  │ │   │  │  - updateInvoice                   │  │
│  │  │  - type    │  │    - price     │  │ │   │  │  - sendNotification                │  │
│  │  └────────────┘  └────────────────┘  │ │   │  └────────────────────────────────────┘  │
│  │  ┌────────────┐  ┌────────────────┐  │ │   └─────────────────────────────────────────┘
│  │  │  Invoice   │  │   Employee     │  │ │
│  │  │  - id      │  │    - id        │  │ │
│  │  │  - amount  │  │    - name      │  │ │
│  │  │  - status  │  │    - skills    │  │ │
│  │  └────────────┘  └────────────────┘  │ │
│  │  ┌────────────┐  ┌────────────────┐  │ │
│  │  │  Service   │  │   Material     │  │ │
│  │  │  - id      │  │    - id        │  │ │
│  │  │  - name    │  │    - name      │  │ │
│  │  │  - price   │  │    - cost      │  │ │
│  │  └────────────┘  └────────────────┘  │ │
│  │  ┌────────────┐  ┌────────────────┐  │ │
│  │  │  Estimate  │  │   Payment      │  │ │
│  │  │  - id      │  │    - id        │  │ │
│  │  │  - total   │  │    - amount    │  │ │
│  │  └────────────┘  └────────────────┘  │ │
│  │       + 30 more tables...            │ │
│  └──────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Manual Customer Creation Flow

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐    ┌────────────┐
│  User    │───▶│  Frontend    │───▶│  API Layer  │───▶│  Postgres  │───▶│  Service   │
│  (Form)  │    │  /customers  │    │  POST       │    │  Service   │    │  Response  │
│          │    │  /new        │    │  /customers │    │            │    │            │
└──────────┘    └──────────────┘    └─────────────┘    └────────────┘    └────────────┘
     │                 │                   │                  │                │
     │  Fill form      │  Submit           │  Validate        │  INSERT        │
     │  Click Save     │  POST request     │  Normalize       │  customer      │
     │                 │  x-tenant-id      │  Call service    │  Return ID     │
     └─────────────────┴───────────────────┴──────────────────┴────────────────┘
```

### 2. LLM Customer Creation Flow (Function Calling)

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐    ┌────────────┐
│  User    │───▶│  AIRA Chat   │───▶│  /llm-chat  │───▶│  Bedrock   │───▶│  Claude AI │
│  (Voice/ │    │  Component   │    │  Handler    │    │  Service   │    │  Sonnet    │
│   Text)  │    │              │    │             │    │            │    │            │
└──────────┘    └──────────────┘    └─────────────┘    └────────────┘    └────────────┘
                                           │                                    │
                                           │◀───────────────────────────────────┘
                                           │         Tool Use Response:
                                           │         { tool: "createCustomer",
                                           │           input: { firstName, ... }}
                                           ▼
                                    ┌─────────────┐    ┌────────────┐    ┌────────────┐
                                    │  Function   │───▶│  Postgres  │───▶│  Customer  │
                                    │  Executor   │    │  Service   │    │  Created   │
                                    │             │    │            │    │            │
                                    └─────────────┘    └────────────┘    └────────────┘
                                           │                                    │
                                           │◀───────────────────────────────────┘
                                           │         Result: { customerId, ... }
                                           ▼
                                    ┌─────────────┐    ┌────────────┐
                                    │  Bedrock    │───▶│  Final     │
                                    │  (2nd call) │    │  Response  │
                                    │             │    │  to User   │
                                    └─────────────┘    └────────────┘
```

### 3. Voice Input Flow

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐
│  User    │───▶│  Microphone  │───▶│  Web Speech │───▶│  Text      │
│  (Speaks)│    │  Button      │    │  API        │    │  Transcript│
└──────────┘    └──────────────┘    └─────────────┘    └────────────┘
                                                              │
                                                              ▼
                                                       ┌────────────┐
                                                       │  Chat      │
                                                       │  Input     │
                                                       │  → LLM     │
                                                       └────────────┘
```

---

## Component Details

### Frontend (Next.js 15)

| Component | Path | Description |
|-----------|------|-------------|
| Dashboard | `/dashboard` | Main overview with KPIs and charts |
| Customers | `/customers` | Customer list, create, edit, view |
| Jobs | `/jobs` | Work order management |
| Scheduler | `/scheduler` | Drag-drop job scheduling |
| Invoices | `/invoices` | Invoice management |
| AIRA Chat | `ChatBot.tsx` | AI assistant with voice support |

### API Layer (Express.js + Lambda Handlers)

| Endpoint | Handler | Description |
|----------|---------|-------------|
| `POST /customers` | `create-postgres.ts` | Create customer |
| `GET /customers` | `list-postgres.ts` | List customers |
| `GET /customers/:id` | `get-postgres.ts` | Get single customer |
| `PUT /customers/:id` | `update-postgres.ts` | Update customer |
| `POST /llm-chat` | `llm-chat/index.ts` | AI chat with tools |

### Service Layer

| Service | File | Description |
|---------|------|-------------|
| Customer | `customer.postgres.service.ts` | Customer CRUD operations |
| Job | `job.postgres.service.ts` | Job CRUD operations |
| Invoice | `invoice.postgres.service.ts` | Invoice CRUD operations |
| Bedrock LLM | `bedrock-llm.service.ts` | Claude AI integration |
| Function Executor | `llm-function-executor.ts` | Execute AI tool calls |
| Prisma | `prisma.service.ts` | Database connection |

### Database (PostgreSQL)

| Table | Key Fields | Relationships |
|-------|------------|---------------|
| `Tenant` | id, name, slug | Has many Users, Customers |
| `Customer` | id, firstName, lastName, email | Belongs to Tenant, Has many Addresses, Jobs |
| `Address` | id, street, city, state, zip | Belongs to Customer |
| `Job` | id, status, scheduledDate | Belongs to Customer, Has many LineItems |
| `Invoice` | id, total, status | Belongs to Job, Customer |
| `Employee` | id, name, skills | Belongs to Tenant |

---

## Multi-Tenancy

```
┌─────────────────────────────────────────────────────────────────┐
│                         REQUEST FLOW                             │
│                                                                  │
│  ┌──────────┐     ┌───────────────┐     ┌───────────────────┐   │
│  │  Client  │────▶│  x-tenant-id  │────▶│  Tenant Isolation │   │
│  │  Request │     │  Header       │     │  (WHERE clause)   │   │
│  └──────────┘     └───────────────┘     └───────────────────┘   │
│                                                                  │
│  Example:                                                        │
│  GET /customers                                                  │
│  Headers: { "x-tenant-id": "local-tenant" }                     │
│                                                                  │
│  SQL: SELECT * FROM customers WHERE tenant_id = 'local-tenant'  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Configuration

### Local Development

```
┌─────────────────────────────────────────────────────────────────┐
│  .env.local (Frontend)                                          │
│  ─────────────────────                                          │
│  NEXT_PUBLIC_API_BASE_URL=http://localhost:4000                 │
│  NEXT_PUBLIC_TENANT_ID=local-tenant                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  .env (Backend API)                                             │
│  ──────────────────                                             │
│  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/... │
│  AWS_REGION=us-east-1                                           │
│  BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0 │
│  PORT=4000                                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ~/.aws/credentials                                             │
│  ─────────────────                                              │
│  [default]                                                      │
│  aws_access_key_id = AKIA...                                    │
│  aws_secret_access_key = ...                                    │
│  region = us-east-1                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Production (AWS)

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS DEPLOYMENT                            │
│                                                                  │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────┐   │
│  │  CloudFront    │───▶│  API Gateway   │───▶│   Lambda     │   │
│  │  (Frontend)    │    │  (REST API)    │    │  Functions   │   │
│  └────────────────┘    └────────────────┘    └──────────────┘   │
│                                                      │           │
│                                                      ▼           │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────┐   │
│  │  Secrets       │───▶│  Aurora        │◀───│  Bedrock     │   │
│  │  Manager       │    │  PostgreSQL    │    │  (Claude)    │   │
│  └────────────────┘    └────────────────┘    └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js | 15.5.7 |
| UI Framework | React | 19.x |
| Styling | Tailwind CSS | 3.x |
| State Management | React Query | 5.x |
| Backend | Express.js | 4.x |
| Runtime | Node.js | 18.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 15.x |
| AI/LLM | AWS Bedrock | Claude 3.5 Sonnet |
| Validation | Zod | 3.x |
| Language | TypeScript | 5.x |
| Infrastructure | AWS CDK | 2.x |

---

## Security

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
│                                                                  │
│  1. Tenant Isolation                                            │
│     └─ All queries filtered by tenant_id                        │
│                                                                  │
│  2. Input Validation                                            │
│     └─ Zod schemas validate all API inputs                      │
│                                                                  │
│  3. CORS                                                        │
│     └─ Configured for allowed origins                           │
│                                                                  │
│  4. AWS IAM                                                     │
│     └─ Lambda roles with least privilege                        │
│                                                                  │
│  5. Secrets Management                                          │
│     └─ Database credentials in AWS Secrets Manager              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Future Enhancements

1. **Authentication**: Add AWS Cognito or Auth0
2. **Real-time Updates**: WebSocket for live job status
3. **Mobile App**: React Native client
4. **Advanced AI**: More function tools (scheduling, routing)
5. **Analytics**: Business intelligence dashboards
6. **Integrations**: QuickBooks, Stripe, Twilio

