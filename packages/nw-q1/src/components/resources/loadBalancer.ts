import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { vpc } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

interface LoadBalancerProps {
  vpc: vpc.Vpc
}

export class LoadBalancer extends Resource {
  public readonly loadBalancerSG: vpc.SecurityGroup

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
  }
}
