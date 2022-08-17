import { Construct } from 'constructs'
import { Fn, TerraformModule } from 'cdktf'
import { vpc, datasources, ec2 } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

interface Network2Props {
  azs: datasources.DataAwsAvailabilityZones
  cidrBlock: string
  defaultTag: string
  publicCidrBlocks: string[]
  privateCidrBlocks: string[]
}

export class Network1 extends TerraformModule {
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

    const publicSubnets = publicCidrBlocks.map(
      (cidrBlock, idx) =>
        new vpc.Subnet(
          this,
          uniqueId({
            prefix: vpc.Subnet,
            suffix: `public_${idx + 1}`,
          }),
          {
            vpcId: this.vpc.id,
            cidrBlock,
            availabilityZone: Fn.element(
              azs.names,
              Fn.index(publicCidrBlocks, cidrBlock)
            ),
            tags: {
              Name: `${defaultTag}-public-${idx + 1}`,
            },
          }
        )
    )

    const privateSubnets = privateCidrBlocks.map(
      (cidrBlock, idx) =>
        new vpc.Subnet(
          this,
          uniqueId({
            prefix: vpc.Subnet,
            suffix: `private_${idx + 1}`,
          }),
          {
            vpcId: this.vpc.id,
            cidrBlock,
            availabilityZone: Fn.element(
              azs.names,
              Fn.index(privateCidrBlocks, cidrBlock)
            ),
            tags: {
              Name: `${defaultTag}-private-${idx + 1}`,
            },
          }
        )
    )

    const eips = publicCidrBlocks.map(
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

    const natGateways = publicSubnets.map(
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
        vpcId: this.vpc.id,
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
          vpcId: this.vpc.id,
        }).id,
      }
    )

    publicSubnets.forEach(
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

    const privateRouteTables = privateSubnets.map(
      (_, idx) =>
        new vpc.RouteTable(
          this,
          uniqueId({
            prefix: vpc.RouteTable,
            suffix: `private_${idx + 1}`,
          }),
          {
            vpcId: this.vpc.id,
            tags: {
              Name: `${defaultTag}-private-${idx + 1}`,
            },
          }
        )
    )

    privateRouteTables.forEach((routeTable, idx) => {
      new vpc.Route(
        this,
        uniqueId({
          prefix: vpc.Route,
          suffix: `private_${idx + 1}`,
        }),
        {
          destinationCidrBlock: '0.0.0.0/0',
          routeTableId: routeTable.id,
          natGatewayId: natGateways[idx].id,
        }
      )
    })

    privateSubnets.forEach((subnet, idx) => {
      new vpc.RouteTableAssociation(
        this,
        uniqueId({
          prefix: vpc.RouteTableAssociation,
          suffix: `private_${idx + 1}`,
        }),
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTables[idx].id,
        }
      )
    })
  }
}
