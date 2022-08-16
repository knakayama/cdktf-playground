import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { vpc, elb, route53 } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import { defaultTag } from '../../modules/utils/constants'

interface LoadBalancerProps {
  vpcData: vpc.DataAwsVpc
  publicSubnets: vpc.DataAwsSubnets
  hostedZone: route53.DataAwsRoute53Zone
}

export class LoadBalancer extends Resource {
  public readonly loadBalancerSG: vpc.SecurityGroup
  public readonly loadBalancerTargetGroup: elb.LbTargetGroup
  public readonly loadBalancer: elb.Lb

  constructor(
    readonly scope: Construct,
    readonly name: string,
    { hostedZone, publicSubnets, vpcData }: LoadBalancerProps
  ) {
    super(scope, name)

    this.loadBalancerSG = new vpc.SecurityGroup(
      this,
      uniqueId({
        prefix: vpc.SecurityGroup,
        suffix: 'compute',
      }),
      {
        vpcId: vpcData.id,
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
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
        tags: {
          Name: defaultTag,
          UsedBy: 'load-balancer',
        },
      }
    )

    this.loadBalancer = new elb.Lb(
      this,
      uniqueId({
        prefix: elb.Lb,
        suffix: 'this',
      }),
      {
        internal: true,
        loadBalancerType: 'network',
        securityGroups: [this.loadBalancerSG.id],
        subnets: publicSubnets.ids,
      }
    )

    this.loadBalancerTargetGroup = new elb.LbTargetGroup(
      this,
      uniqueId({
        prefix: elb.LbTargetGroup,
        suffix: 'this',
      }),
      {
        port: 443,
        protocol: 'TCP',
        vpcId: vpcData.id,
      }
    )

    new elb.LbListener(
      this,
      uniqueId({
        prefix: elb.LbListener,
        suffix: 'this',
      }),
      {
        loadBalancerArn: this.loadBalancer.arn,
        port: 443,
        protocol: 'TCP',
        defaultAction: [
          {
            type: 'forward',
            targetGroupArn: this.loadBalancerTargetGroup.arn,
          },
        ],
      }
    )

    new route53.Route53Record(
      this,
      uniqueId({
        prefix: route53.Route53Record,
        suffix: 'lb',
      }),
      {
        zoneId: hostedZone.zoneId,
        name: `lb.${hostedZone.name}`,
        type: 'A',
        alias: [
          {
            name: this.loadBalancer.dnsName,
            zoneId: this.loadBalancer.zoneId,
            evaluateTargetHealth: true,
          },
        ],
      }
    )
  }
}
