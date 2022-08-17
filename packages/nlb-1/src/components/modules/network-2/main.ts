import { Construct } from 'constructs'
import { Fn, TerraformModule } from 'cdktf'
import { vpc, datasources } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

interface Network2Props {
  azs: datasources.DataAwsAvailabilityZones
  cidrBlock: string
  defaultTag: string
  privateCidrBlocks1: string[]
  privateCidrBlocks2: string[]
}

export class Network2 extends TerraformModule {
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
    }: Network2Props
  ) {
    super(scope, name, {
      source: './src/components/modules/network-1',
    })

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
