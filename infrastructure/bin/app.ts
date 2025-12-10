#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FieldSmartProStack } from '../lib/fieldsmartpro-stack';

const app = new cdk.App();

new FieldSmartProStack(app, 'FieldSmartProStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
