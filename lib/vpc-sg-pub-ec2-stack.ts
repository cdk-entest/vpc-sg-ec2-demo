import { Stack, StackProps, aws_ec2, aws_iam } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as fs from "fs";

interface VpcProps extends StackProps {
  vpcName: string;
  cidr: string;
}

export class VpcSgPubEc2Stack extends Stack {
  public readonly vpc: aws_ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id, props);

    // create a new vpc
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

    // add s3 interface endpoint
    vpc.addGatewayEndpoint("S3VpcEndpoint", {
      service: aws_ec2.GatewayVpcEndpointAwsService.S3,
    });

    // add vpc endpoint ssm
    vpc.addInterfaceEndpoint("VpcInterfaceEndpointSSM", {
      service: aws_ec2.InterfaceVpcEndpointAwsService.SSM,
    });

    this.vpc = vpc;
  }
}

interface PubEc2Props extends StackProps {
  vpc: aws_ec2.Vpc;
}

export class PubEc2 extends Stack {
  constructor(scope: Construct, id: string, props: PubEc2Props) {
    super(scope, id, props);

    // pub security group
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

    // public subnet ec2
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

    // user data
    publicEc2.addUserData(
      fs.readFileSync("./lib/script/user-data-pub-ec2-web.sh", "utf8")
    );
  }
}
