import { Construct } from 'constructs'
import { Fn, Resource } from 'cdktf'
import { autoscaling, ssm, vpc, ec2 } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import * as path from 'path'

interface ComputeProps {
  vpc: vpc.Vpc
  loadBalancerSG: vpc.SecurityGroup
  privateSubnets: vpc.Subnet[]
}

export class Compute extends Resource {
  constructor(scope: Construct, name: string, props: ComputeProps) {
    super(scope, name)

    const sg = new vpc.SecurityGroup(
      this,
      uniqueId({
        prefix: vpc.SecurityGroup,
        suffix: 'compute',
      }),
      {
        vpcId: props.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [props.loadBalancerSG.id],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
      }
    )

    const ami = new ssm.DataAwsSsmParameter(
      this,
      uniqueId({
        prefix: ssm.DataAwsSsmParameter,
        suffix: 'amazon_linux_2',
      }),
      {
        name: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
      }
    )

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      uniqueId({
        prefix: ec2.LaunchTemplate,
        suffix: 'compute',
      }),
      {
        imageId: ami.value,
        instanceType: 't2.micro',
        userData: Fn.filebase64(
          path.join(__dirname, '../../modules/artifacts/user-data.sh')
        ),
        vpcSecurityGroupIds: [sg.id],
        lifecycle: {
          createBeforeDestroy: true,
        },
      }
    )

    new autoscaling.AutoscalingGroup(
      this,
      uniqueId({
        prefix: autoscaling.AutoscalingGroup,
        suffix: 'compute',
      }),
      {
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 1,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        vpcZoneIdentifier: props.privateSubnets.map((subnet) => subnet.id),
        lifecycle: {
          ignoreChanges: ['desired_capacity', 'target_group_arns'],
        },
      }
    )
  }
}
