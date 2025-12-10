"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldSmartProStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const rds = __importStar(require("aws-cdk-lib/aws-rds"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const secretsmanager = __importStar(require("aws-cdk-lib/aws-secretsmanager"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const path = __importStar(require("path"));
class FieldSmartProStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        // Lambda environment
        const lambdaEnv = {
            DATABASE_URL: `postgresql://${dbSecret.secretValueFromJson('username').unsafeUnwrap()}:${dbSecret.secretValueFromJson('password').unsafeUnwrap()}@${dbCluster.clusterEndpoint.hostname}:5432/fieldsmartpro`,
            DYNAMODB_CONVERSATIONS_TABLE: conversationsTable.tableName,
            DYNAMODB_CACHE_TABLE: cacheTable.tableName,
            NODE_ENV: 'production',
        };
        // Lambda Functions
        const createCustomerFn = new lambda.Function(this, 'CreateCustomerFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'handlers/customers/create.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
            environment: lambdaEnv,
            vpc,
            timeout: cdk.Duration.seconds(30),
        });
        const listCustomersFn = new lambda.Function(this, 'ListCustomersFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'handlers/customers/list.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/dist')),
            environment: lambdaEnv,
            vpc,
            timeout: cdk.Duration.seconds(30),
        });
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
        // Grant permissions
        [createCustomerFn, listCustomersFn, createJobFn, chatFn, healthFn, seedFn, migrateFn].forEach(fn => {
            dbCluster.connections.allowDefaultPortFrom(fn);
        });
        conversationsTable.grantReadWriteData(chatFn);
        cacheTable.grantReadWriteData(chatFn);
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
        const customers = api.root.addResource('customers');
        customers.addMethod('GET', new apigateway.LambdaIntegration(listCustomersFn));
        customers.addMethod('POST', new apigateway.LambdaIntegration(createCustomerFn));
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
exports.FieldSmartProStack = FieldSmartProStack;
