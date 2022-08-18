import { Construct } from 'constructs'
import { TerraformModule } from 'cdktf'
import { datasources } from '@cdktf/provider-aws'
import { ClientCompute } from '../../resources/clientCompute'
import { PublicNetwork } from '../../resources/publicNetwork'
import { publicSubnetsData } from '../../../modules/utils/dataSources'

interface RequesterNetworkProps {
  azs: datasources.DataAwsAvailabilityZones
  cidrBlock: string
  defaultTag: string
  publicCidrBlocks: string[]
  privateCidrBlocks: string[]
}

export class RequesterNetwork extends TerraformModule {
  constructor(
    readonly scope: Construct,
    readonly name: string,
    {
      cidrBlock,
      defaultTag,
      publicCidrBlocks,
      azs,
      privateCidrBlocks,
    }: RequesterNetworkProps
  ) {
    super(scope, name, {
      source: './src/components/modules/requesterNetwork',
    })

    const network = new PublicNetwork(this, 'public_network', {
      azs,
      cidrBlock,
      defaultTag,
      privateCidrBlocks,
      publicCidrBlocks,
    })

    //const vpc = requesterVpcData({
    //  scope: this,
    //  dependsOn: [network.vpc],
    //})

    const publicSubnets = publicSubnetsData({
      scope: this,
      dependsOn: network.publicSubnets.map((subnet) => subnet),
    })

    new ClientCompute(this, 'client_compute', {
      defaultTag,
      publicSubnets,
      vpcData: network.vpc,
    })
  }
}
