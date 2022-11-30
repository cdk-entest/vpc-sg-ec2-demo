// haimtran 30 NOV 2022
// cloudwatch to stop idle instances

import {
  aws_cloudwatch,
  aws_cloudwatch_actions,
  Duration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface CloudwatchEc2Props extends StackProps {
  instanceId: string;
}

export class CloudwatchEc2Stack extends Stack {
  constructor(scope: Construct, id: string, props: CloudwatchEc2Props) {
    super(scope, id, props);

    //  create a new cloudwatch alarm
    const alarm = new aws_cloudwatch.Alarm(this, "CloudWatchAlarmStopIdleEc2", {
      alarmName: "CloudWatchAlarmStopIdleEc2",
      comparisonOperator:
        aws_cloudwatch.ComparisonOperator.LESS_THAN_LOWER_THRESHOLD,
      threshold: 0.99,
      evaluationPeriods: 6,
      datapointsToAlarm: 5,
      metric: new aws_cloudwatch.Metric({
        namespace: "AWS/EC2",
        metricName: "CPUUtilization",
        statistic: "Average",
        period: Duration.seconds(5),
        dimensionsMap: {
          InstanceId: props.instanceId,
        },
      }),
    });

    // alarm action to stop ec2
    alarm.addAlarmAction(
      new aws_cloudwatch_actions.Ec2Action(
        aws_cloudwatch_actions.Ec2InstanceAction.STOP
      )
    );
  }
}
