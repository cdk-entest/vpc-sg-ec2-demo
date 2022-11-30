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

## Basic Vim

create a vimrc file at

```bash
vim ~/.vim/vimrc
```

add very basic configuration for vim

```tsx
" tab width
set tabstop=2
set shiftwidth=2
set softtabstop=2
set expandtab
set cindent
set autoindent
set smartindent
set mouse=a
set hlsearch
set showcmd
set title
set expandtab
set incsearch

" line number
set number
hi CursorLineNr cterm=None

" highlight current line
set cursorline
hi CursorLine cterm=NONE ctermbg=23  guibg=Grey40

" change cursor between modes
let &t_SI = "\e[6 q"
let &t_EI = "\e[2 q"

" netrw wsize
let g:netrw_liststyle=3
let g:netrw_keepdir=0
let g:netrw_winsize=30
map <C-a> : Lexplore<CR>

" per default, netrw leaves unmodified buffers open.  This autocommand
" deletes netrw's buffer once it's hidden (using ':q;, for example)
autocmd FileType netrw setl bufhidden=delete  " or use :qa!

" these next three lines are for the fuzzy search:
set nocompatible      "Limit search to your project
set path+=**          "Search all subdirectories and recursively
set wildmenu          "Shows multiple matches on one line

" highlight syntax
set re=0
syntax on
```
