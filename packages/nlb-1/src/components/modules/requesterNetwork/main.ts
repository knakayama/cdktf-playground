import { Construct } from 'constructs'
import { TerraformModule } from 'cdktf'
import { datasources, iam, vpc } from '@cdktf/provider-aws'
import { ClientCompute } from '../../resources/clientCompute'
import { PublicNetwork } from '../../resources/publicNetwork'
import {
  publicSubnetsData,
  requesterVpcData,
} from '../../../modules/utils/data'

interface RequesterNetworkProps {
  azs: datasources.DataAwsAvailabilityZones
  cidrBlock: string
  defaultTag: string
  publicCidrBlocks: string[]
  privateCidrBlocks: string[]
  instanceProfile: iam.DataAwsIamInstanceProfile
}

export class RequesterNetwork extends TerraformModule {
  public readonly vpc: vpc.Vpc

  constructor(
    readonly scope: Construct,
    readonly name: string,
    {
      cidrBlock,
      defaultTag,
      publicCidrBlocks,
      azs,
      privateCidrBlocks,
      instanceProfile,
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

    this.vpc = network.vpc

    const vpc = requesterVpcData({
      scope: this,
      dependsOn: [this.vpc],
    })

    const publicSubnets = publicSubnetsData({
      scope: this,
      dependsOn: network.publicSubnets.map((subnet) => subnet),
    })

    new ClientCompute(this, 'client_compute', {
      defaultTag,
      publicSubnets,
      vpcData: vpc,
      instanceProfile,
    })
  }
}
