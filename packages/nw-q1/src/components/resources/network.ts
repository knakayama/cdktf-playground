import { Construct } from 'constructs'
import { Resource, Fn } from 'cdktf'
import { vpc, datasources, ec2 } from '@cdktf/provider-aws'
import { CidrBlocks, defaultTag } from '../../modules/constants'
import { uniqueId } from '@cdktf-playground/core/src'

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

    const myVpc = new vpc.Vpc(
      this,
      uniqueId({
        prefix: vpc.Vpc,
        suffix: 'this',
      }),
      {
        cidrBlock: CidrBlocks.vpc,
        enableDnsSupport: true,
        enableDnsHostnames: true,
      }
    )

    const publicSubnets = CidrBlocks.publicSubnets.map(
      (cidrBlock, idx) =>
        new vpc.Subnet(
          this,
          uniqueId({
            prefix: vpc.Subnet,
            suffix: `public_${idx + 1}`,
          }),
          {
            vpcId: myVpc.id,
            cidrBlock,
            availabilityZone: Fn.element(
              props.azs.names,
              Fn.index(
                CidrBlocks.publicSubnets as unknown as string[],
                cidrBlock
              )
            ),
            tags: {
              Name: `${defaultTag}-public-${idx + 1}`,
            },
          }
        )
    )

    CidrBlocks.privateSubnets.map(
      (cidrBlock, idx) =>
        new vpc.Subnet(
          this,
          uniqueId({
            prefix: vpc.Subnet,
            suffix: `private_${idx + 1}`,
          }),
          {
            vpcId: myVpc.id,
            cidrBlock,
            availabilityZone: Fn.element(
              props.azs.names,
              Fn.index(
                CidrBlocks.privateSubnets as unknown as string[],
                cidrBlock
              )
            ),
            tags: {
              Name: `${defaultTag}-private-${idx + 1}`,
            },
          }
        )
    )

    CidrBlocks.isolatedSubnets.map(
      (cidrBlock, idx) =>
        new vpc.Subnet(
          this,
          uniqueId({
            prefix: vpc.Subnet,
            suffix: `isolated_${idx + 1}`,
          }),
          {
            vpcId: myVpc.id,
            cidrBlock,
            availabilityZone: Fn.element(
              props.azs.names,
              Fn.index(
                CidrBlocks.isolatedSubnets as unknown as string[],
                cidrBlock
              )
            ),
            tags: {
              Name: `${defaultTag}-isolated-${idx + 1}`,
            },
          }
        )
    )

    const eips = CidrBlocks.publicSubnets.map(
      (_, idx) =>
        new ec2.Eip(
          this,
          uniqueId({
            prefix: ec2.Eip,
            suffix: `nat_gateway_${idx + 1}`,
          }),
          {
            vpc: true,
          }
        )
    )

    publicSubnets.map(
      (subnet, idx) =>
        new vpc.NatGateway(
          this,
          uniqueId({
            prefix: vpc.NatGateway,
            suffix: `public_${idx + 1}`,
          }),
          {
            subnetId: subnet.id,
            allocationId: eips[idx].id,
          }
        )
    )

    const publicRouteTable = new vpc.RouteTable(
      this,
      uniqueId({
        prefix: vpc.RouteTable,
        suffix: 'public',
      }),
      {
        vpcId: myVpc.id,
        tags: {
          Name: `${defaultTag}-public`,
        },
      }
    )

    new vpc.Route(
      this,
      uniqueId({
        prefix: vpc.Route,
        suffix: 'public',
      }),
      {
        destinationCidrBlock: '0.0.0.0/0',
        routeTableId: publicRouteTable.id,
        gatewayId: new vpc.InternetGateway(this, 'igw', {
          vpcId: myVpc.id,
        }).id,
      }
    )

    publicSubnets.map(
      (subnet, idx) =>
        new vpc.RouteTableAssociation(
          this,
          uniqueId({
            prefix: vpc.RouteTableAssociation,
            suffix: `public_${idx}`,
          }),
          {
            subnetId: subnet.id,
            routeTableId: publicRouteTable.id,
          }
        )
    )
  }
}
