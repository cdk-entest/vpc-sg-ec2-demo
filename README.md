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

![Untitled Diagram drawio](https://user-images.githubusercontent.com/20411077/202876910-a6fbcea5-8b23-457a-b4c2-b1a65e83ed0e.png)


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
