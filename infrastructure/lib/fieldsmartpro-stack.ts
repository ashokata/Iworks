import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class FieldSmartProStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC for RDS
    const vpc = new ec2.Vpc(this, 'FieldSmartProVPC', {
      maxAzs: 2,
      natGateways: 1, // Need NAT for Lambda to access internet (for Prisma)
    });

    // Security group for Lambda functions
    const lambdaSg = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // Security group for RDS
    const dbSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for Aurora PostgreSQL',
    });

    // Allow Lambda to connect to RDS
    dbSg.addIngressRule(lambdaSg, ec2.Port.tcp(5432), 'Allow Lambda to connect to PostgreSQL');

    // Database credentials
    const dbSecret = new secretsmanager.Secret(this, 'DBSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
      },
    });

    // Aurora PostgreSQL Serverless v2
    const dbCluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_12,
      }),
      credentials: rds.Credentials.fromSecret(dbSecret),
      defaultDatabaseName: 'fieldsmartpro',
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSg],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 4,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB Tables (keep for AI conversations and caching)
    const conversationsTable = new dynamodb.Table(this, 'ConversationsTable', {
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    conversationsTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
    });

    const cacheTable = new dynamodb.Table(this, 'CacheTable', {
      partitionKey: { name: 'cacheKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Construct DATABASE_URL for Prisma
    const databaseUrl = `postgresql://${dbSecret.secretValueFromJson('username').unsafeUnwrap()}:${dbSecret.secretValueFromJson('password').unsafeUnwrap()}@${dbCluster.clusterEndpoint.hostname}:5432/fieldsmartpro?schema=public`;

    // Lambda environment for PostgreSQL functions
    const postgresLambdaEnv = {
      DATABASE_URL: databaseUrl,
      DYNAMODB_CONVERSATIONS_TABLE: conversationsTable.tableName,
      DYNAMODB_CACHE_TABLE: cacheTable.tableName,
      NODE_ENV: 'production',
    };

    // Common Lambda configuration for PostgreSQL functions
    const postgresLambdaConfig = {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
      environment: postgresLambdaEnv,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSg],
      timeout: cdk.Duration.seconds(30),
      memorySize: 512, // More memory for Prisma
    };

    // ============================================================================
    // CUSTOMER HANDLERS (PostgreSQL)
    // ============================================================================
    
    const createCustomerFn = new lambda.Function(this, 'CreateCustomerFunction', {
      ...postgresLambdaConfig,
      handler: 'handlers/customers/create-postgres.handler',
      description: 'Create customer in PostgreSQL',
    });

    const listCustomersFn = new lambda.Function(this, 'ListCustomersFunction', {
      ...postgresLambdaConfig,
      handler: 'handlers/customers/list-postgres.handler',
      description: 'List customers from PostgreSQL',
    });

    const getCustomerFn = new lambda.Function(this, 'GetCustomerFunction', {
      ...postgresLambdaConfig,
      handler: 'handlers/customers/get-postgres.handler',
      description: 'Get customer from PostgreSQL',
    });

    const updateCustomerFn = new lambda.Function(this, 'UpdateCustomerFunction', {
      ...postgresLambdaConfig,
      handler: 'handlers/customers/update-postgres.handler',
      description: 'Update customer in PostgreSQL',
    });

    // ============================================================================
    // JOB HANDLERS (PostgreSQL)
    // ============================================================================

    const createJobFn = new lambda.Function(this, 'CreateJobFunction', {
      ...postgresLambdaConfig,
      handler: 'handlers/jobs/create.handler',
      description: 'Create job in PostgreSQL',
    });

    // ============================================================================
    // UTILITY HANDLERS
    // ============================================================================

    const healthFn = new lambda.Function(this, 'HealthFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/health/index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
      environment: {
        NODE_ENV: 'production',
      },
      timeout: cdk.Duration.seconds(10),
    });

    const seedFn = new lambda.Function(this, 'SeedFunction', {
      ...postgresLambdaConfig,
      handler: 'handlers/seed/index.handler',
      description: 'Seed database with initial data',
      timeout: cdk.Duration.seconds(300), // 5 minutes for seeding
    });

    const migrateFn = new lambda.Function(this, 'MigrateFunction', {
      ...postgresLambdaConfig,
      handler: 'handlers/migrate/index.handler',
      description: 'Run database migrations',
      timeout: cdk.Duration.seconds(300), // 5 minutes for migrations
    });

    // ============================================================================
    // CHAT & AI HANDLERS
    // ============================================================================

    const chatFn = new lambda.Function(this, 'ChatFunction', {
      ...postgresLambdaConfig,
      handler: 'handlers/chat/index.handler',
      description: 'Chat handler with Bedrock integration',
      timeout: cdk.Duration.seconds(60),
    });

    // ============================================================================
    // VAPI VOICE AGENT WEBHOOK HANDLER
    // ============================================================================

    const vapiWebhookFn = new lambda.Function(this, 'VapiWebhookFunction', {
      ...postgresLambdaConfig,
      handler: 'handlers/vapi-webhook/index.handler',
      description: 'VAPI voice agent webhook handler',
      timeout: cdk.Duration.seconds(30),
      environment: {
        ...postgresLambdaEnv,
        VAPI_API_KEY: process.env.VAPI_API_KEY || '',
      },
    });

    // LLM Chat Lambda with Bedrock integration (uses PostgreSQL for function calls)
    const llmChatFn = new lambda.Function(this, 'LLMChatFunction', {
      ...postgresLambdaConfig,
      handler: 'handlers/llm-chat/index.handler',
      description: 'LLM chat with function calling (PostgreSQL)',
      timeout: cdk.Duration.seconds(90),
      memorySize: 1024, // More memory for LLM processing
      environment: {
        ...postgresLambdaEnv,
        BEDROCK_MODEL_ID: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
        BEDROCK_FALLBACK_MODEL: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        BEDROCK_MAX_TOKENS: '4096',
        BEDROCK_TEMPERATURE: '0.7',
      },
    });

    // Grant Bedrock permissions
    const bedrockPolicy = new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: ['*'],
    });
    chatFn.addToRolePolicy(bedrockPolicy);
    llmChatFn.addToRolePolicy(bedrockPolicy);

    // Grant DynamoDB permissions for conversations
    conversationsTable.grantReadWriteData(chatFn);
    conversationsTable.grantReadWriteData(llmChatFn);
    cacheTable.grantReadWriteData(chatFn);

    // ============================================================================
    // API GATEWAY
    // ============================================================================

    const api = new apigateway.RestApi(this, 'FieldSmartProAPI', {
      restApiName: 'FieldSmartPro API',
      description: 'Field service management API - PostgreSQL Backend',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Tenant-Id', 'X-User-Id'],
      },
    });

    // Health endpoint
    const health = api.root.addResource('health');
    health.addMethod('GET', new apigateway.LambdaIntegration(healthFn));

    // Customer endpoints (PostgreSQL)
    const customers = api.root.addResource('customers');
    customers.addMethod('GET', new apigateway.LambdaIntegration(listCustomersFn));
    customers.addMethod('POST', new apigateway.LambdaIntegration(createCustomerFn));
    
    const customerById = customers.addResource('{customerId}');
    customerById.addMethod('GET', new apigateway.LambdaIntegration(getCustomerFn));
    customerById.addMethod('PUT', new apigateway.LambdaIntegration(updateCustomerFn));
    customerById.addMethod('DELETE', new apigateway.LambdaIntegration(updateCustomerFn)); // Soft delete

    // Job endpoints (PostgreSQL)
    const jobs = api.root.addResource('jobs');
    jobs.addMethod('POST', new apigateway.LambdaIntegration(createJobFn));

    // Chat endpoints
    const chat = api.root.addResource('chat');
    chat.addMethod('POST', new apigateway.LambdaIntegration(chatFn));

    // LLM Chat endpoint with function calling
    const llmChat = api.root.addResource('llm-chat');
    llmChat.addMethod('POST', new apigateway.LambdaIntegration(llmChatFn));

    // Admin endpoints
    const migrate = api.root.addResource('migrate');
    migrate.addMethod('POST', new apigateway.LambdaIntegration(migrateFn));

    const seed = api.root.addResource('seed');
    seed.addMethod('POST', new apigateway.LambdaIntegration(seedFn));

    // VAPI Webhook endpoints
    const webhooks = api.root.addResource('webhooks');
    const vapiWebhooks = webhooks.addResource('vapi');
    const vapiTenantWebhook = vapiWebhooks.addResource('{tenantId}');
    vapiTenantWebhook.addMethod('POST', new apigateway.LambdaIntegration(vapiWebhookFn));

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Aurora PostgreSQL endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbSecret.secretArn,
      description: 'Database credentials secret ARN',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });
  }
}
