import { Construct } from 'constructs'
import { Fn } from 'cdktf'
import { vpc, datasources } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

interface PrivateNetworkProps {
  azs: datasources.DataAwsAvailabilityZones
  cidrBlock: string
  defaultTag: string
  privateCidrBlocks1: string[]
  privateCidrBlocks2: string[]
}

export class PrivateNetwork extends Construct {
  public readonly vpc: vpc.Vpc
  public readonly privateSubnets: vpc.Subnet[]

  constructor(
    readonly scope: Construct,
    readonly name: string,
    {
      cidrBlock,
      defaultTag,
      privateCidrBlocks1,
      privateCidrBlocks2,
      azs,
    }: PrivateNetworkProps
  ) {
    super(scope, name)

    this.vpc = new vpc.Vpc(
      this,
      uniqueId({
        prefix: vpc.Vpc,
        suffix: 'this',
      }),
      {
        cidrBlock,
        enableDnsSupport: true,
        enableDnsHostnames: true,
        tags: {
          Name: defaultTag,
        },
      }
    )

    const privateSubnets1 = privateCidrBlocks1.map(
      (cidrBlock, idx) =>
        new vpc.Subnet(
          this,
          uniqueId({
            prefix: vpc.Subnet,
            suffix: `private_1_${idx + 1}`,
          }),
          {
            vpcId: this.vpc.id,
            cidrBlock,
            availabilityZone: Fn.element(
              azs.names,
              Fn.index(privateCidrBlocks1, cidrBlock)
            ),
            tags: {
              Name: `${defaultTag}-private-1-${idx + 1}`,
            },
          }
        )
    )

    const privateSubnets2 = privateCidrBlocks2.map(
      (cidrBlock, idx) =>
        new vpc.Subnet(
          this,
          uniqueId({
            prefix: vpc.Subnet,
            suffix: `private_2_${idx + 1}`,
          }),
          {
            vpcId: this.vpc.id,
            cidrBlock,
            availabilityZone: Fn.element(
              azs.names,
              Fn.index(privateCidrBlocks2, cidrBlock)
            ),
            tags: {
              Name: `${defaultTag}-private-2-${idx + 1}`,
            },
          }
        )
    )

    privateSubnets1.map(
      (_, idx) =>
        new vpc.RouteTable(
          this,
          uniqueId({
            prefix: vpc.RouteTable,
            suffix: `private_1_${idx + 1}`,
          }),
          {
            vpcId: this.vpc.id,
            tags: {
              Name: `${defaultTag}-private-1-${idx + 1}`,
            },
          }
        )
    )

    privateSubnets2.map(
      (_, idx) =>
        new vpc.RouteTable(
          this,
          uniqueId({
            prefix: vpc.RouteTable,
            suffix: `private_2_${idx + 1}`,
          }),
          {
            vpcId: this.vpc.id,
            tags: {
              Name: `${defaultTag}-private-2-${idx + 1}`,
            },
          }
        )
    )

    this.privateSubnets = [privateSubnets1[0], privateSubnets2[0]]

    //privateRouteTables2.forEach((routeTable, idx) => {
    //  new vpc.Route(
    //    this,
    //    uniqueId({
    //      prefix: vpc.Route,
    //      suffix: `private_2_${idx + 1}`,
    //    }),
    //    {
    //      destinationCidrBlock: '0.0.0.0/0',
    //      routeTableId: routeTable.id,
    //      natGatewayId: natGateways[idx].id,
    //    }
    //  )
    //})

    //privateSubnets2.forEach((subnet, idx) => {
    //  new vpc.RouteTableAssociation(
    //    this,
    //    uniqueId({
    //      prefix: vpc.RouteTableAssociation,
    //      suffix: `private_${idx + 1}`,
    //    }),
    //    {
    //      subnetId: subnet.id,
    //      routeTableId: privateRouteTables2[idx].id,
    //    }
    //  )
    //})
  }
}
