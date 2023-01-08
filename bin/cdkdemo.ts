#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkdemoStack } from '../lib/cdkdemo-stack';

const app = new cdk.App();
new CdkdemoStack(app, 'CdkdemoStack');
