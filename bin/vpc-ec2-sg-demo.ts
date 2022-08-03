#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PubEc2, VpcSgPubEc2Stack } from "../lib/vpc-sg-pub-ec2-stack";

const app = new cdk.App();

const vpc = new VpcSgPubEc2Stack(app, "VpcSimpleDemo", {
  vpcName: "VpcSimpleDemo",
  cidr: "10.0.0.0/20",
  env: {
    region: "us-west-2",
  },
});

const ec2 = new PubEc2(app, "PubEc2", {
  vpc: vpc.vpc,
  env: {
    region: "us-west-2",
  },
});

ec2.addDependency(vpc);
