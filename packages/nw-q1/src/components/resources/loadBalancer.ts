import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { vpc, elb, route53, acm } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

interface LoadBalancerProps {
  vpc: vpc.Vpc
  privateSubnets: vpc.Subnet[]
  hostedZone: route53.DataAwsRoute53Zone
}

export class LoadBalancer extends Resource {
  public readonly loadBalancerSG: vpc.SecurityGroup
  public readonly loadBalancerTargetGroup: elb.LbTargetGroup

  constructor(scope: Construct, name: string, props: LoadBalancerProps) {
    super(scope, name)

    this.loadBalancerSG = new vpc.SecurityGroup(
      this,
      uniqueId({
        prefix: vpc.SecurityGroup,
        suffix: 'compute',
      }),
      {
        vpcId: props.vpc.id,
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
      }
    )

    const lb = new elb.Lb(
      this,
      uniqueId({
        prefix: elb.Lb,
        suffix: 'this',
      }),
      {
        internal: true,
        loadBalancerType: 'application',
        securityGroups: [this.loadBalancerSG.id],
        subnets: props.privateSubnets.map((subnet) => subnet.id),
      }
    )

    const sslCert = new acm.DataAwsAcmCertificate(
      this,
      uniqueId({
        prefix: acm.DataAwsAcmCertificate,
        suffix: 'this',
      }),
      {
        domain: props.hostedZone.name,
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
        vpcId: props.vpc.id,
      }
    )

    new elb.LbListener(
      this,
      uniqueId({
        prefix: elb.LbListener,
        suffix: 'this',
      }),
      {
        loadBalancerArn: lb.arn,
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
