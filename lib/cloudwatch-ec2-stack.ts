// haimtran 30 NOV 2022
// cloudwatch to stop idle instances

import {
  aws_cloudwatch,
  aws_cloudwatch_actions,
  aws_sns,
  Duration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface CloudwatchEc2Props extends StackProps {
  instanceId: string;
  topicArn: string;
}

export class CloudwatchEc2Stack extends Stack {
  constructor(scope: Construct, id: string, props: CloudwatchEc2Props) {
    super(scope, id, props);

    // alarm stop instance when idle
    const alarmStopIdleEc2 = new aws_cloudwatch.Alarm(
      this,
      "CloudWatchAlarmStopIdleEc2",
      {
        alarmName: "CloudWatchAlarmStopIdleEc2",
        comparisonOperator:
          aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        threshold: 0.99,
        // how many data points (evaluation periods)
        evaluationPeriods: 6,
        // means 5 out of 6 data points
        datapointsToAlarm: 4,
        metric: new aws_cloudwatch.Metric({
          namespace: "AWS/EC2",
          metricName: "CPUUtilization",
          statistic: "Average",
          // average within 5 minutes to get 1 data point
          period: Duration.minutes(5),
          dimensionsMap: {
            InstanceId: props.instanceId,
          },
        }),
      }
    );

    // alarm stop instance when it is too hot
    const alarmStopTooHotEc2 = new aws_cloudwatch.Alarm(
      this,
      "CloudWatchAlrmStopTooHotEc2",
      {
        alarmName: "CloudWatchAlrmStopTooHotEc2",
        comparisonOperator:
          aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        threshold: 5.0,
        // how many data points (evaluation periods)
        evaluationPeriods: 3,
        // means 1 out of 3 data points
        datapointsToAlarm: 1,
        metric: new aws_cloudwatch.Metric({
          namespace: "AWS/EC2",
          metricName: "CPUUtilization",
          statistic: "Average",
          // average within 1 minutes to get 1 data point
          period: Duration.minutes(1),
          dimensionsMap: {
            InstanceId: props.instanceId,
          },
        }),
      }
    );

    // alarm action to stop ec2
    alarmStopIdleEc2.addAlarmAction(
      new aws_cloudwatch_actions.Ec2Action(
        aws_cloudwatch_actions.Ec2InstanceAction.STOP
      )
    );

    // stop too hot instance
    alarmStopTooHotEc2.addAlarmAction(
      new aws_cloudwatch_actions.Ec2Action(
        aws_cloudwatch_actions.Ec2InstanceAction.STOP
      )
    );

    // send notification
    alarmStopTooHotEc2.addAlarmAction(
      new aws_cloudwatch_actions.SnsAction(
        aws_sns.Topic.fromTopicArn(this, "SnsTopic", props.topicArn)
      )
    );
  }
}
