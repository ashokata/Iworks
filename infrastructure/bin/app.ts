#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FieldSmartProStack } from '../lib/fieldsmartpro-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

// Development Environment
new FieldSmartProStack(app, 'FieldSmartProStack-Development', {
  env: { account, region },
  stage: 'development',
  description: 'FieldSmartPro Development/QA Environment',
  tags: {
    Environment: 'Development',
    Project: 'FieldSmartPro',
    ManagedBy: 'CDK',
  },
});

// Production Environment (uncomment when ready)
// new FieldSmartProStack(app, 'FieldSmartProStack-Production', {
//   env: { account, region },
//   stage: 'production',
//   description: 'FieldSmartPro Production Environment',
//   tags: {
//     Environment: 'Production',
//     Project: 'FieldSmartPro',
//     ManagedBy: 'CDK',
//   },
// });
