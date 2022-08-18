import { Construct } from 'constructs'
import { TerraformModule } from 'cdktf'
import { datasources, vpc } from '@cdktf/provider-aws'
import { PrivateNetwork } from '../../resources/privateNetwork'

interface AccepterNetworkProps {
  azs: datasources.DataAwsAvailabilityZones
  cidrBlock: string
  defaultTag: string
  privateCidrBlocks1: string[]
  privateCidrBlocks2: string[]
}

export class AccepterNetwork extends TerraformModule {
  public readonly vpc: vpc.Vpc

  constructor(
    readonly scope: Construct,
    readonly name: string,
    {
      cidrBlock,
      defaultTag,
      privateCidrBlocks1,
      azs,
      privateCidrBlocks2,
    }: AccepterNetworkProps
  ) {
    super(scope, name, {
      source: './src/components/modules/accepterNetwork',
    })

    const network = new PrivateNetwork(this, 'private_network', {
      azs,
      cidrBlock,
      defaultTag,
      privateCidrBlocks1,
      privateCidrBlocks2,
    })

    this.vpc = network.vpc
  }
}
