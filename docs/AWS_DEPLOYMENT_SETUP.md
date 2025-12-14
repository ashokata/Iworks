# FieldSmartPro - AWS Cloud Deployment Guide

This guide will help you deploy and run the FieldSmartPro application on AWS cloud infrastructure.

---

## Prerequisites

Before you begin, ensure you have the following:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 18.x or higher | https://nodejs.org/ |
| **npm** | 9.x or higher | Comes with Node.js |
| **AWS CLI** | v2 | https://aws.amazon.com/cli/ |
| **AWS CDK** | 2.x | `npm install -g aws-cdk` |
| **Git** | Latest | https://git-scm.com/ |
| **Docker** (optional) | Latest | For local testing |

### AWS Account Requirements

- Active AWS account with billing enabled
- IAM user with appropriate permissions (or use AWS SSO)
- AWS credentials configured locally

---

## Quick Start (30 Minutes)

### 1. Clone and Install

```bash
git clone <repository-url>
cd fieldsmartpro-monorepo
npm install
```

### 2. Configure AWS Credentials

**Option 1: AWS CLI Configuration**
```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output format: `json`

**Option 2: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

**Option 3: AWS SSO**
```bash
aws sso login --profile your-profile
```

### 3. Set Environment Variables

**Backend API (`apps/api/.env`):**

```env
# Database (will be created by CDK)
# DATABASE_URL will be auto-configured from AWS Secrets Manager

# AWS Configuration
AWS_REGION="us-east-1"
NODE_ENV="production"
LOG_LEVEL="info"

# Bedrock LLM
BEDROCK_MODEL_ID="us.anthropic.claude-3-5-sonnet-20241022-v2:0"
BEDROCK_FALLBACK_MODEL="us.anthropic.claude-3-haiku-20240307-v1:0"
BEDROCK_MAX_TOKENS="4096"
BEDROCK_TEMPERATURE="0.7"

# VAPI Voice Agent
VAPI_API_KEY="your-vapi-api-key-here"
API_BASE_URL="https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod"

# JWT & Security
JWT_SECRET="generate-a-strong-secret-key"
API_KEY="generate-a-strong-api-key"
```

**Frontend (`apps/web/.env.production`):**

```env
# API Configuration - Points to deployed AWS API Gateway
NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_TENANT_ID=your-tenant-id

# Mapbox (if using maps)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

### 4. Deploy Infrastructure

The CDK stack will create:
- VPC with public/private subnets
- Aurora PostgreSQL Serverless v2 database
- API Gateway REST API
- Lambda functions for all endpoints
- DynamoDB tables (for conversations/caching)
- Security groups and IAM roles

```bash
cd infrastructure

# Bootstrap CDK (first time only)
cdk bootstrap

# Review what will be created
cdk diff

# Deploy the stack
cdk deploy --all

# Note the outputs:
# - ApiUrl: Your API Gateway endpoint
# - DatabaseEndpoint: RDS endpoint
# - DatabaseSecretArn: Secret ARN for database credentials
```

### 5. Set Up the Database

After deployment, run migrations:

```bash
cd apps/api

# Set DATABASE_URL from AWS Secrets Manager
export DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id <DatabaseSecretArn> \
  --query SecretString --output text | jq -r '.DATABASE_URL')

# Or manually construct:
# export DATABASE_URL="postgresql://postgres:PASSWORD@ENDPOINT:5432/fieldsmartpro?schema=public"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### 6. Update API Gateway Environment Variables

Update Lambda environment variables with the database connection:

```bash
# Get the secret value
aws secretsmanager get-secret-value \
  --secret-id <DatabaseSecretArn> \
  --query SecretString --output text

# Update Lambda environment variables via AWS Console or CLI
# The CDK should handle this automatically, but verify in AWS Console
```

### 7. Deploy Frontend

**Option 1: Vercel (Recommended)**

```bash
cd apps/web

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

**Option 2: AWS Amplify**

```bash
cd apps/web

# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

**Option 3: S3 + CloudFront**

```bash
cd apps/web

# Build the app
npm run build

# Deploy to S3
aws s3 sync .next/static s3://your-bucket/static
aws s3 sync out s3://your-bucket --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

---

## Infrastructure Details

### What Gets Created

| Resource | Type | Purpose |
|----------|------|---------|
| **VPC** | Virtual Private Cloud | Network isolation |
| **Aurora PostgreSQL** | RDS Serverless v2 | Primary database |
| **API Gateway** | REST API | Public API endpoint |
| **Lambda Functions** | Serverless compute | API handlers |
| **DynamoDB** | NoSQL database | Conversations & caching |
| **Secrets Manager** | Secrets storage | Database credentials |
| **Security Groups** | Network security | Firewall rules |
| **IAM Roles** | Access control | Permissions |

### CDK Stack Structure

```
infrastructure/
├── bin/
│   └── app.ts              # CDK app entry point
├── lib/
│   └── fieldsmartpro-stack.ts  # Main stack definition
└── cdk.json                # CDK configuration
```

### Cost Estimation

**Monthly costs (approximate):**

- Aurora Serverless v2 (0.5-4 ACU): $30-200/month
- Lambda (1M requests): $0.20
- API Gateway (1M requests): $3.50
- DynamoDB (on-demand): $1.25 per million requests
- Data transfer: $0.09/GB

**Total: ~$50-250/month** (depending on usage)

---

## Environment Configuration

### Backend Environment Variables

Set these in Lambda environment variables or AWS Systems Manager Parameter Store:

```env
# Database (auto-configured from Secrets Manager)
DATABASE_URL=postgresql://...

# AWS
AWS_REGION=us-east-1
NODE_ENV=production

# Bedrock
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_FALLBACK_MODEL=us.anthropic.claude-3-haiku-20240307-v1:0
BEDROCK_MAX_TOKENS=4096
BEDROCK_TEMPERATURE=0.7

# VAPI
VAPI_API_KEY=your-vapi-api-key
API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod

# Security
JWT_SECRET=your-jwt-secret
API_KEY=your-api-key
```

### Frontend Environment Variables

Set in your hosting platform (Vercel, Amplify, etc.):

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_TENANT_ID=your-tenant-id
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

---

## VAPI Voice Agent Setup (Production)

### 1. Get VAPI API Key

1. Sign up at https://dashboard.vapi.ai
2. Get your API key from the dashboard
3. Store it in AWS Secrets Manager or Lambda environment variables

### 2. Configure VAPI Webhook URL

Use your deployed API Gateway URL (no ngrok needed in production):

```
https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod/webhooks/vapi/{tenantId}
```

### 3. Provision VAPI for Tenants

**Via API:**
```bash
curl -X POST https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod/api/tenants/{tenantId}/vapi/provision \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: {tenantId}"
```

**Via Script (local with AWS credentials):**
```bash
cd apps/api
export DATABASE_URL="postgresql://..."
export VAPI_API_KEY="your-key"
npx tsx scripts/create-demo-tenant.ts
```

### 4. Update VAPI Assistant Webhook

```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_VAPI_API_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    serverUrl = "https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod/webhooks/vapi/{tenantId}"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.vapi.ai/assistant/ASSISTANT_ID" -Method PATCH -Headers $headers -Body $body
```

---

## API Endpoints (Production)

All endpoints are available at your API Gateway URL:

```
https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
```

### Health Check
```
GET /health
GET /health/db
```

### Customers
```
POST   /customers
GET    /customers
GET    /customers/:id
PUT    /customers/:id
DELETE /customers/:id
```

### Employees
```
POST   /employees
GET    /employees
GET    /employees/:id
PUT    /employees/:id
DELETE /employees/:id
```

### Jobs
```
POST /jobs
```

### LLM Chat
```
POST /llm-chat
```

### VAPI Voice Agent
```
POST /webhooks/vapi/:tenantId
GET  /api/tenants/:tenantId/vapi/config
PUT  /api/tenants/:tenantId/vapi/config
POST /api/tenants/:tenantId/vapi/provision
GET  /api/tenants/:tenantId/vapi/calls
GET  /api/tenants/:tenantId/vapi/analytics
```

---

## Database Management

### Access Database

**Via Prisma Studio (local with VPN/Bastion):**
```bash
cd apps/api
export DATABASE_URL="postgresql://..."
npx prisma studio
```

**Via AWS RDS Query Editor:**
- Go to AWS Console > RDS > Query Editor
- Connect to your Aurora cluster

**Via psql (with VPN/Bastion):**
```bash
psql "postgresql://postgres:PASSWORD@ENDPOINT:5432/fieldsmartpro"
```

### Run Migrations

```bash
cd apps/api
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
```

### Seed Database

```bash
cd apps/api
export DATABASE_URL="postgresql://..."
npx prisma db seed
```

### Backup Database

**Automated backups** are enabled by default (7-day retention).

**Manual snapshot:**
```bash
aws rds create-db-cluster-snapshot \
  --db-cluster-snapshot-identifier fieldsmartpro-manual-$(date +%Y%m%d) \
  --db-cluster-identifier your-cluster-id
```

---

## Monitoring & Logging

### CloudWatch Logs

View Lambda function logs:
```bash
aws logs tail /aws/lambda/FieldSmartProStack-CreateCustomerFunction --follow
```

### CloudWatch Metrics

Monitor:
- Lambda invocations and errors
- API Gateway requests and latency
- Aurora connections and CPU
- DynamoDB read/write capacity

### CloudWatch Dashboards

Create custom dashboards in AWS Console to monitor:
- API request rates
- Error rates
- Database performance
- Lambda cold starts

---

## Troubleshooting

### API Gateway 502/503 Errors

**Issue:** Lambda function errors or timeouts

**Solution:**
1. Check CloudWatch logs for the specific Lambda function
2. Verify environment variables are set correctly
3. Check Lambda timeout settings (increase if needed)
4. Verify database connectivity from Lambda

### Database Connection Issues

**Issue:** `P1001: Can't reach database server`

**Solution:**
1. Verify Lambda is in the same VPC as RDS
2. Check security group rules allow Lambda → RDS (port 5432)
3. Verify DATABASE_URL is correct
4. Check RDS cluster is in "Available" state

### Lambda Cold Starts

**Issue:** Slow first request after inactivity

**Solution:**
1. Enable Lambda provisioned concurrency (costs more)
2. Use Lambda SnapStart (Java only)
3. Optimize bundle size
4. Use connection pooling for database

### CORS Errors

**Issue:** Frontend can't call API

**Solution:**
1. Verify API Gateway CORS is configured
2. Check frontend URL is in allowed origins
3. Verify preflight OPTIONS requests are handled

### VAPI Webhook Not Receiving Calls

**Issue:** Webhooks not reaching API

**Solution:**
1. Verify webhook URL is correct in VAPI dashboard
2. Check API Gateway logs for incoming requests
3. Verify Lambda function is deployed and active
4. Check CloudWatch logs for errors

---

## Security Best Practices

### 1. Secrets Management

- Store sensitive data in AWS Secrets Manager
- Never commit secrets to git
- Rotate secrets regularly

### 2. IAM Permissions

- Use least-privilege IAM policies
- Don't use root account for operations
- Enable MFA for production accounts

### 3. Network Security

- Keep RDS in private subnets
- Use security groups to restrict access
- Enable VPC Flow Logs for monitoring

### 4. API Security

- Use API keys or JWT tokens
- Enable rate limiting
- Use HTTPS only
- Validate all inputs

### 5. Database Security

- Use strong passwords
- Enable encryption at rest
- Enable SSL/TLS connections
- Regular security updates

---

## Scaling

### Auto-Scaling

**Aurora Serverless v2:**
- Automatically scales between 0.5-4 ACU
- No manual intervention needed

**Lambda:**
- Automatically scales to handle traffic
- 1000 concurrent executions by default (can request increase)

**API Gateway:**
- Handles up to 10,000 requests/second per region
- Can request limit increases

### Manual Scaling

**Increase Aurora capacity:**
```bash
aws rds modify-db-cluster \
  --db-cluster-identifier your-cluster-id \
  --serverless-v2-scaling-configuration MinCapacity=2,MaxCapacity=8
```

**Increase Lambda concurrency:**
- Request limit increase via AWS Support

---

## Cost Optimization

### 1. Right-Size Resources

- Monitor Aurora ACU usage and adjust min/max
- Review Lambda memory allocation
- Use DynamoDB on-demand billing for variable workloads

### 2. Use Reserved Capacity

- Consider Aurora Reserved Instances for predictable workloads
- Use Savings Plans for Lambda

### 3. Monitor Costs

- Set up AWS Cost Alerts
- Use AWS Cost Explorer
- Review monthly bills

### 4. Clean Up

- Delete unused resources
- Remove old CloudWatch logs
- Archive old database snapshots

---

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy CDK
        run: |
          cd infrastructure
          npm install
          cdk deploy --all --require-approval never
      
      - name: Deploy API
        run: |
          cd apps/api
          npm run build
          # Deploy Lambda functions (handled by CDK)
      
      - name: Deploy Frontend
        run: |
          cd apps/web
          npm run build
          # Deploy to Vercel/Amplify/S3
```

---

## Disaster Recovery

### Backup Strategy

1. **Automated RDS Backups:** 7-day retention (configurable)
2. **Manual Snapshots:** Before major changes
3. **Code Repository:** Git for all code
4. **Infrastructure as Code:** CDK for infrastructure

### Recovery Procedures

**Database Recovery:**
```bash
# Restore from snapshot
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier restored-cluster \
  --snapshot-identifier snapshot-id
```

**Infrastructure Recovery:**
```bash
cd infrastructure
cdk deploy --all
```

---

## Multi-Tenancy

The application supports multiple tenants. Each tenant:
- Has isolated data (via `tenantId` column)
- Can have separate VAPI configuration
- Can have different feature flags

**Create a new tenant:**
```bash
cd apps/api
export DATABASE_URL="postgresql://..."
npx tsx scripts/create-demo-tenant.ts
```

Or via API:
```bash
# Create tenant (implement endpoint if needed)
POST /api/tenants
```

---

## Quick Reference Commands

```bash
# Deploy infrastructure
cd infrastructure && cdk deploy --all

# View stack outputs
cdk outputs

# Destroy infrastructure (careful!)
cdk destroy --all

# Run database migrations
cd apps/api && export DATABASE_URL="..." && npx prisma migrate deploy

# Seed database
cd apps/api && export DATABASE_URL="..." && npx prisma db seed

# View Lambda logs
aws logs tail /aws/lambda/FunctionName --follow

# Create database snapshot
aws rds create-db-cluster-snapshot --db-cluster-snapshot-identifier name --db-cluster-identifier id

# Update Lambda environment
aws lambda update-function-configuration --function-name Name --environment Variables="{KEY=value}"

# Test API endpoint
curl https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod/health
```

---

## Support & Resources

- **AWS Documentation:** https://docs.aws.amazon.com/
- **CDK Documentation:** https://docs.aws.amazon.com/cdk/
- **Prisma Documentation:** https://www.prisma.io/docs
- **VAPI Documentation:** https://docs.vapi.ai/
- **Architecture Document:** [./ARCHITECTURE.md](./ARCHITECTURE.md)
- **VAPI Integration:** [./VAPI_INTEGRATION_ARCHITECTURE.md](./VAPI_INTEGRATION_ARCHITECTURE.md)

---

## Next Steps

1. ✅ Deploy infrastructure with CDK
2. ✅ Set up database and run migrations
3. ✅ Deploy frontend to hosting platform
4. ✅ Configure VAPI for production
5. ✅ Set up monitoring and alerts
6. ✅ Configure CI/CD pipeline
7. ✅ Set up backup and disaster recovery procedures

---

**Note:** This guide assumes you have appropriate AWS permissions and a production-ready setup. For development/testing, consider using the [Local Development Setup](./LOCAL_DEVELOPMENT_SETUP.md) guide instead.

