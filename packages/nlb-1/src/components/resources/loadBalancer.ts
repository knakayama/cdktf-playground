import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { vpc, elb, route53, acm } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import { defaultTag } from '../../modules/utils/constants'

interface LoadBalancerProps {
  vpcData: vpc.DataAwsVpc
  privateSubnets: vpc.DataAwsSubnets
  hostedZone: route53.DataAwsRoute53Zone
}

export class LoadBalancer extends Resource {
  public readonly loadBalancerSG: vpc.SecurityGroup
  public readonly loadBalancerTargetGroup: elb.LbTargetGroup
  public readonly loadBalancer: elb.Lb

  constructor(
    readonly scope: Construct,
    readonly name: string,
    { hostedZone, privateSubnets, vpcData }: LoadBalancerProps
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
        loadBalancerType: 'application',
        securityGroups: [this.loadBalancerSG.id],
        subnets: privateSubnets.ids,
      }
    )

    const sslCert = new acm.DataAwsAcmCertificate(
      this,
      uniqueId({
        prefix: acm.DataAwsAcmCertificate,
        suffix: 'this',
      }),
      {
        domain: hostedZone.name,
      }
    )

    this.loadBalancerTargetGroup = new elb.LbTargetGroup(
      this,
      uniqueId({
        prefix: elb.LbTargetGroup,
        suffix: 'this',
      }),
      {
        port: 80,
        protocol: 'HTTP',
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
        protocol: 'HTTPS',
        certificateArn: sslCert.arn,
        defaultAction: [
          {
            type: 'forward',
            targetGroupArn: this.loadBalancerTargetGroup.arn,
          },
        ],
      }
    )
  }
}
