// haimtran 19 NOV 2022
// create multiple ec2

import { aws_ec2, aws_iam, Stack, StackProps } from "aws-cdk-lib";
import { Effect } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as fs from "fs";

interface MultipleEc2Props extends StackProps {
  vpcId: string;
  vpcName: string;
  keyName?: string;
  instanceNames: string[];
}

export class MultipleEc2Stack extends Stack {
  public readonly linuxInstanceIds: string[] = [];
  public readonly windowInstanceIds: string[] = [];

  constructor(scope: Construct, id: string, props: MultipleEc2Props) {
    super(scope, id, props);

    // lookup an existed vpc
    const vpc = aws_ec2.Vpc.fromLookup(this, "ExistedVpc", {
      vpcId: props.vpcId,
      vpcName: props.vpcName,
    });

    // create a security group
    const sg = new aws_ec2.SecurityGroup(this, "SecurityGroupForGroupEc2", {
      vpc: vpc,
      securityGroupName: "SecurityGroupForGroupEc2",
      description: "Allow port 80, 22",
      allowAllOutbound: true,
    });

    sg.addIngressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.tcp(80),
      "allow port 80"
    );

    sg.addIngressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.tcp(22),
      "allow port 22 ssh from internet"
    );

    sg.addIngressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.tcp(3389),
      "allo window remote desktop"
    );

    // create an iam role
    const role = new aws_iam.Role(this, "RoleForGroupEc2", {
      roleName: "RoleForGroupEc2",
      assumedBy: new aws_iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    role.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          "arn:aws:s3:::haimtran-workspace",
          "arn:aws:s3:::haimtran-workspace/*",
        ],
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

    // create multiple ec2 instances window
    props.instanceNames.map((name) => {
      let ec2Window = new aws_ec2.Instance(this, `${name}-window`, {
        vpc: vpc,
        vpcSubnets: {
          subnetType: aws_ec2.SubnetType.PUBLIC,
        },
        role: role,
        securityGroup: sg,
        keyName: props.keyName,
        instanceName: `${name}-window`,
        instanceType: aws_ec2.InstanceType.of(
          aws_ec2.InstanceClass.T3,
          aws_ec2.InstanceSize.LARGE
        ),
        machineImage: new aws_ec2.WindowsImage(
          aws_ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE
        ),
      });

      ec2Window.addUserData("");

      // save instance ids
      this.windowInstanceIds.push(ec2Window.instanceId);
    });

    // create multiple ec2 instances
    props.instanceNames.map((name) => {
      let ec2 = new aws_ec2.Instance(this, `${name}-linux`, {
        vpc: vpc,
        vpcSubnets: {
          subnetType: aws_ec2.SubnetType.PUBLIC,
        },
        role: role,
        securityGroup: sg,
        instanceName: `${name}-linux`,
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
      // save instance ids
      this.linuxInstanceIds.push(ec2.instanceId);
    });
  }
}
