import { Construct } from 'constructs'
import { TerraformModule } from 'cdktf'
import { datasources, iam, vpc } from '@cdktf/provider-aws'
import { PrivateNetwork } from '../../constructs/privateNetwork'
import {
  accepterVpcData,
  privateSubnetsData,
} from '../../../modules/utils/data'
import { ServerCompute } from '../../constructs/serverCompute'

interface AccepterNetworkProps {
  azs: datasources.DataAwsAvailabilityZones
  cidrBlock: string
  defaultTag: string
  privateCidrBlocks1: string[]
  privateCidrBlocks2: string[]
  instanceProfile: iam.DataAwsIamInstanceProfile
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
      instanceProfile,
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

    const vpc = accepterVpcData({
      scope: this,
      dependsOn: [this.vpc],
    })

    const privateSubnets = privateSubnetsData({
      scope: this,
      dependsOn: network.privateSubnets.map((subnet) => subnet),
    })

    new ServerCompute(this, 'client_compute', {
      defaultTag,
      privateSubnets,
      vpcData: vpc,
      instanceProfile,
    })
  }
}
