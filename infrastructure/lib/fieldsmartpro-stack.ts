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
      natGateways: 0,
    });

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
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB Tables
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

    // Customers DynamoDB Table (for serverless customer storage)
    const customersTable = new dynamodb.Table(this, 'CustomersTable', {
      partitionKey: { name: 'customerId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    customersTable.addGlobalSecondaryIndex({
      indexName: 'tenantId-index',
      partitionKey: { name: 'tenantId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
    });

    // Lambda environment
    const lambdaEnv = {
      DATABASE_URL: `postgresql://${dbSecret.secretValueFromJson('username').unsafeUnwrap()}:${dbSecret.secretValueFromJson('password').unsafeUnwrap()}@${dbCluster.clusterEndpoint.hostname}:5432/fieldsmartpro`,
      DYNAMODB_CONVERSATIONS_TABLE: conversationsTable.tableName,
      DYNAMODB_CACHE_TABLE: cacheTable.tableName,
      DYNAMODB_CUSTOMERS_TABLE: customersTable.tableName,
      NODE_ENV: 'production',
    };

    // Lambda Functions
    const createJobFn = new lambda.Function(this, 'CreateJobFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/jobs/create.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
      environment: lambdaEnv,
      vpc,
      timeout: cdk.Duration.seconds(30),
    });

    const chatFn = new lambda.Function(this, 'ChatFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/chat/index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
      environment: lambdaEnv,
      vpc,
      timeout: cdk.Duration.seconds(60),
    });

    const healthFn = new lambda.Function(this, 'HealthFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/health/index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
      environment: lambdaEnv,
      vpc,
      timeout: cdk.Duration.seconds(10),
    });

    const seedFn = new lambda.Function(this, 'SeedFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/seed/index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
      environment: lambdaEnv,
      vpc,
      timeout: cdk.Duration.seconds(300), // 5 minutes for seeding
    });

    const migrateFn = new lambda.Function(this, 'MigrateFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/migrate/index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
      environment: lambdaEnv,
      vpc,
      timeout: cdk.Duration.seconds(300), // 5 minutes for migrations
    });

    // Customer DynamoDB Lambdas (serverless - no VPC needed)
    const dynamoDBCustomerEnv = {
      DYNAMODB_CUSTOMERS_TABLE: customersTable.tableName,
      NODE_ENV: 'production',
    };

    const createCustomerDynamoDBFn = new lambda.Function(this, 'CreateCustomerDynamoDBFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/customers/create-dynamodb.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
      environment: dynamoDBCustomerEnv,
      timeout: cdk.Duration.seconds(30),
    });

    const listCustomersDynamoDBFn = new lambda.Function(this, 'ListCustomersDynamoDBFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/customers/list-dynamodb.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
      environment: dynamoDBCustomerEnv,
      timeout: cdk.Duration.seconds(30),
    });

    const getCustomerDynamoDBFn = new lambda.Function(this, 'GetCustomerDynamoDBFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/customers/get-dynamodb.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
      environment: dynamoDBCustomerEnv,
      timeout: cdk.Duration.seconds(30),
    });

    // Grant permissions
    [createJobFn, chatFn, healthFn, seedFn, migrateFn].forEach(fn => {
      dbCluster.connections.allowDefaultPortFrom(fn);
    });

    conversationsTable.grantReadWriteData(chatFn);
    cacheTable.grantReadWriteData(chatFn);
    
    // Grant DynamoDB permissions to customer Lambdas
    customersTable.grantReadWriteData(createCustomerDynamoDBFn);
    customersTable.grantReadData(listCustomersDynamoDBFn);
    customersTable.grantReadData(getCustomerDynamoDBFn);

    chatFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: ['*'],
    }));

    // API Gateway
    const api = new apigateway.RestApi(this, 'FieldSmartProAPI', {
      restApiName: 'FieldSmartPro API',
      description: 'Field service management API - Replaces Mendix',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Tenant-Id', 'X-User-Id'],
      },
    });

    // Routes
    const health = api.root.addResource('health');
    health.addMethod('GET', new apigateway.LambdaIntegration(healthFn));

    // Customer endpoints - using DynamoDB
    const customers = api.root.addResource('customers');
    customers.addMethod('GET', new apigateway.LambdaIntegration(listCustomersDynamoDBFn));
    customers.addMethod('POST', new apigateway.LambdaIntegration(createCustomerDynamoDBFn));
    
    const customerById = customers.addResource('{customerId}');
    customerById.addMethod('GET', new apigateway.LambdaIntegration(getCustomerDynamoDBFn));

    const jobs = api.root.addResource('jobs');
    jobs.addMethod('POST', new apigateway.LambdaIntegration(createJobFn));

    const chat = api.root.addResource('chat');
    chat.addMethod('POST', new apigateway.LambdaIntegration(chatFn));

    const migrate = api.root.addResource('migrate');
    migrate.addMethod('POST', new apigateway.LambdaIntegration(migrateFn));

    const seed = api.root.addResource('seed');
    seed.addMethod('POST', new apigateway.LambdaIntegration(seedFn));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbSecret.secretArn,
    });
  }
}
