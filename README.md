---
title: VPC EC2 Demo
description: Launch an EC2 in a public subnet and host a web
author: haimtran
publishedDate: 08/06/2022
date: 2022-08-06
---

## VPC Security Group and EC2 Demo

- Create a vpc
- Create an ec2 in a public subnet
- Run a web in the ec2 port 80 and userdata

![Untitled Diagram drawio](https://user-images.githubusercontent.com/20411077/202877114-b5c32ef0-e17d-40a3-813d-84a7b5c337ab.png)

## CDK Stack

create a vpc

```tsx
const vpc = new aws_ec2.Vpc(this, "VpcWithoutNat", {
  vpcName: props.vpcName,
  cidr: props.cidr,
  enableDnsHostnames: true,
  enableDnsSupport: true,
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: "PublicSubnet",
      subnetType: aws_ec2.SubnetType.PUBLIC,
    },
    {
      cidrMask: 24,
      name: "PrivateSubnet",
      subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
    },
    {
      cidrMask: 24,
      name: "PrivateSubnetWithNat",
      subnetType: aws_ec2.SubnetType.PRIVATE_WITH_NAT,
    },
  ],
});
```

add vpc endpoints

```tsx
// add s3 interface endpoint
vpc.addGatewayEndpoint("S3VpcEndpoint", {
  service: aws_ec2.GatewayVpcEndpointAwsService.S3,
});

// add vpc endpoint ssm
vpc.addInterfaceEndpoint("VpcInterfaceEndpointSSM", {
  service: aws_ec2.InterfaceVpcEndpointAwsService.SSM,
});
```

create a security group

```tsx
const sg = new aws_ec2.SecurityGroup(this, "SecurityGroupForPubEc2", {
  vpc: props.vpc,
  securityGroupName: "SGForPubEc2",
  description: "Allow 80",
  allowAllOutbound: true,
});

sg.addIngressRule(
  aws_ec2.Peer.anyIpv4(),
  aws_ec2.Port.tcp(80),
  "allow port 80 http"
);
```

create a role for the ec2

```tsx
// role for ec2
const role = new aws_iam.Role(this, "RoleForPubEc2", {
  roleName: "RoleForPubEc2",
  assumedBy: new aws_iam.ServicePrincipal("ec2.amazonaws.com"),
});

role.addToPolicy(
  new aws_iam.PolicyStatement({
    effect: Effect.ALLOW,
    resources: ["*"],
    actions: ["s3:*"],
  })
);

role.addManagedPolicy(
  aws_iam.ManagedPolicy.fromManagedPolicyArn(
    this,
    "PolicySSMMangerAccessS3",
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  )
);
```

create an ec2 in a public subnet

```tsx
const publicEc2 = new aws_ec2.Instance(this, "PubEc2Instance", {
  vpc: props.vpc,
  role: role,
  instanceName: "PubEc2Instance",
  instanceType: aws_ec2.InstanceType.of(
    aws_ec2.InstanceClass.T3,
    aws_ec2.InstanceSize.MICRO
  ),
  machineImage: new aws_ec2.AmazonLinuxImage({
    generation: aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    edition: aws_ec2.AmazonLinuxEdition.STANDARD,
  }),
  securityGroup: sg,
  vpcSubnets: {
    subnetType: aws_ec2.SubnetType.PUBLIC,
  },
  allowAllOutbound: true,
});
```

add user data from commands

```tsx
let command = `export USER_NAME=${name} \n`;
let text = fs.readFileSync("./lib/user-data.sh", "utf8");
ec2.addUserData(command.concat(text));
```

add user data from file

```tsx
publicEc2.addUserData(fs.readFileSync("./lib/user-data.sh", "utf8"));
```

## Multiple EC2

using a loop to create multiple EC2 instances

```tsx
props.instanceNames.map((name) => {
  let ec2 = new aws_ec2.Instance(this, name, {
    vpc: vpc,
    vpcSubnets: {
      subnetType: aws_ec2.SubnetType.PUBLIC,
    },
    role: role,
    securityGroup: sg,
    instanceName: name,
    instanceType: aws_ec2.InstanceType.of(
      aws_ec2.InstanceClass.T3,
      aws_ec2.InstanceSize.MICRO
    ),
    machineImage: new aws_ec2.AmazonLinuxImage({
      generation: aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      edition: aws_ec2.AmazonLinuxEdition.STANDARD,
    }),
  });

  // userdata text
  let command = `export USER_NAME=${name} \n`;
  let text = fs.readFileSync("./lib/user-data.sh", "utf8");
  // add user data
  ec2.addUserData(command.concat(text));
});
```

## SSH Username and Pass

```bash
sudo passwd ec2-user
```

the enable ssh password in sshd_config file

```bash
sudo vim /etc/ssh/sshd_config
```

edit

```text
PasswordAuthentication yes
```

and optionally

```text
PermitRootLogin yes
```

finally need to reset ssh service

```bash
sudo sshd restart
```

## Remote Desktop Connect Window 

Install microsoft remote desktop (app for mac). Then download the RDP file from aws console 

<img width="861" alt="Screen Shot 2022-11-29 at 09 01 57" src="https://user-images.githubusercontent.com/20411077/204420533-55901642-331d-46d6-ba04-a0d698560e9d.png">

Retrieve the password to connect 
<img width="861" alt="Screen Shot 2022-11-29 at 09 01 47" src="https://user-images.githubusercontent.com/20411077/204420586-d7e6720c-742e-4daa-bd47-5f25985cacf2.png">





