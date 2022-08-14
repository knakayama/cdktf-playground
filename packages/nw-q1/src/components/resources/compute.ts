import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { vpc } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

interface ComputeProps {
  vpc: vpc.Vpc
  loadBalancerSG: vpc.SecurityGroup
}

export class Compute extends Resource {
  constructor(scope: Construct, name: string, props: ComputeProps) {
    super(scope, name)

    new vpc.SecurityGroup(
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
  }
}
