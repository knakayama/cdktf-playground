import { Construct } from 'constructs'
import { Resource, Fn, Token } from 'cdktf'
import { vpc, datasources } from '@cdktf/provider-aws'
import { CidrBlocks, defaultTag } from '../../modules/constants'

interface NetworkProps {
  azs: datasources.DataAwsAvailabilityZones
}

export class Network extends Resource {
  constructor(
    readonly scope: Construct,
    readonly name: string,
    readonly props: NetworkProps
  ) {
    super(scope, name)

    const myVpc = new vpc.Vpc(this, 'vpc', {
      cidrBlock: CidrBlocks.vpc,
      enableDnsSupport: true,
      enableDnsHostnames: true,
    })

    const publicSubnet = new vpc.Subnet(this, 'public', {
      vpcId: myVpc.id,
      cidrBlock: Fn.element(
        CidrBlocks.publicSubnets as unknown as string[],
        Token.asNumber('count.index') + 1
      ),
      availabilityZone: Fn.element(
        props.azs.names,
        Token.asNumber('count.index') + 1
      ),
      tags: {
        Name: `${defaultTag}-public-${Fn.element(
          props.azs.names,
          Token.asNumber('count.index') + 1
        )}`,
      },
    })
    publicSubnet.addOverride('count', CidrBlocks.publicSubnets.length)

    const privateSubnet = new vpc.Subnet(this, 'private', {
      vpcId: myVpc.id,
      cidrBlock: Fn.element(
        CidrBlocks.privateSubnets as unknown as string[],
        Token.asNumber('count.index') + 1
      ),
      availabilityZone: Fn.element(
        props.azs.names,
        Token.asNumber('count.index') + 1
      ),
      tags: {
        Name: `${defaultTag}-private-${Fn.element(
          props.azs.names,
          Token.asNumber('count.index') + 1
        )}`,
      },
    })
    privateSubnet.addOverride('count', CidrBlocks.privateSubnets.length)
  }
}
