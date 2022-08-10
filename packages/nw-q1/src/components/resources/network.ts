import { Construct } from 'constructs'
import { Resource, Fn } from 'cdktf'
import { vpc, datasources, ec2 } from '@cdktf/provider-aws'
import { CidrBlocks } from '../../modules/constants'

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

    const publicSubnets = CidrBlocks.publicSubnets.map(
      (cidrBlock, idx) =>
        new vpc.Subnet(this, `public_${idx}`, {
          vpcId: myVpc.id,
          cidrBlock,
          availabilityZone: Fn.element(
            props.azs.names,
            Fn.index(CidrBlocks.publicSubnets as unknown as string[], cidrBlock)
          ),
        })
    )

    CidrBlocks.privateSubnets.map(
      (cidrBlock, idx) =>
        new vpc.Subnet(this, `private_${idx}`, {
          vpcId: myVpc.id,
          cidrBlock,
          availabilityZone: Fn.element(
            props.azs.names,
            Fn.index(
              CidrBlocks.privateSubnets as unknown as string[],
              cidrBlock
            )
          ),
        })
    )

    CidrBlocks.isolatedSubnets.map(
      (cidrBlock, idx) =>
        new vpc.Subnet(this, `isolated_${idx}`, {
          vpcId: myVpc.id,
          cidrBlock,
          availabilityZone: Fn.element(
            props.azs.names,
            Fn.index(
              CidrBlocks.isolatedSubnets as unknown as string[],
              cidrBlock
            )
          ),
        })
    )

    new vpc.InternetGateway(this, 'igw', {
      vpcId: myVpc.id,
    })

    const eips = CidrBlocks.publicSubnets.map(
      (_, idx) =>
        new ec2.Eip(this, `eip_${idx}`, {
          vpc: true,
        })
    )

    publicSubnets.map(
      (subnet, idx) =>
        new vpc.NatGateway(this, `nat_gateway_${idx}`, {
          subnetId: subnet.id,
          allocationId: eips[idx].id,
        })
    )
  }
}
