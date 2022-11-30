#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CloudwatchEc2Stack } from "../lib/cloudwatch-ec2-stack";
import { MultipleEc2Stack } from "../lib/multiple-ec2-stack";
import { PubEc2, VpcSgPubEc2Stack } from "../lib/vpc-sg-pub-ec2-stack";

const app = new cdk.App();

const REGION = "ap-southeast-1";

// create a new vpc
const vpc = new VpcSgPubEc2Stack(app, "VpcSimpleDemo", {
  vpcName: "VpcSimpleDemo",
  cidr: "10.0.0.0/20",
  env: {
    region: REGION,
  },
});

// create a ec2 in a public subnet
const ec2 = new PubEc2(app, "PubEc2", {
  vpc: vpc.vpc,
  keyName: "Ec2KeyPairdemo",
  instanceName: "Thang",
  env: {
    region: REGION,
  },
});

ec2.addDependency(vpc);

// create multiple ec2
const multipleEc2 = new MultipleEc2Stack(app, "MultipleEc2Stack", {
  vpcId: "vpc-07cafc6a819930727",
  vpcName: "FabbiDemo",
  keyName: "haimtranEc2KeyPair",
  instanceNames: ["Hai"],
  env: {
    region: REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});

// cloudwatch alarm to stop idel instance
// please provide instance ids here
const cloudwatch = new CloudwatchEc2Stack(app, "CloudWatchStack", {
  instanceId: multipleEc2.linuxInstanceIds[0],
  topicArn: `arn:aws:sns:ap-southeast-1:${process.env.CDK_DEFAULT_ACCOUNT}:MonitorEc2`,
  env: {
    region: REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});

cloudwatch.addDependency(multipleEc2);
