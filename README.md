# FieldSmartPro Monorepo

Complete field service management platform with AI-powered chat assistant.

**✅ Status: Backend + Frontend Ready for Local Development!**

## 🚀 Quick Start - Run Locally

### Prerequisites
- Node.js 18+ 
- PostgreSQL (or Docker)

### Start Everything

```bash
cd fieldsmartpro-monorepo

# Option 1: Automated (Windows)
.\start-local.bat

# Option 2: Manual
npm install
npm run dev
```

**Opens:**
- Web App: http://localhost:3000
- API: http://localhost:3001

📖 **See [START-HERE.md](START-HERE.md) for detailed instructions**

---

## Architecture

**Replaces Mendix** with custom AWS serverless backend + PostgreSQL + DynamoDB.

### Apps

- **web** - Next.js web app (Desktop/Tablet)
- **mobile** - React Native (Expo) mobile app
- **api** - AWS Lambda functions (REST & WebSocket)

### Packages

- **shared** - TypeScript types, utilities, constants
- **ui** - Shared React components
- **database** - Prisma schema & migrations
- **api-client** - React Query hooks for API calls

### Infrastructure

- **AWS Lambda** - Serverless API
- **Aurora PostgreSQL Serverless v2** - Relational data
- **DynamoDB** - Chat history, cache, sessions
- **API Gateway** - REST + WebSocket
- **Bedrock** - Claude AI integration
- **CloudWatch** - Logs & metrics

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp apps/api/.env.example apps/api/.env

# Run development
npm run dev

# Database migrations
npm run db:migrate

# Deploy to AWS
npm run deploy
```

## Tech Stack

- TypeScript
- Next.js 15
- React Native (Expo)
- Node.js 20
- Prisma ORM
- React Query
- Zustand
- AWS CDK
- Turborepo
# Iworks
