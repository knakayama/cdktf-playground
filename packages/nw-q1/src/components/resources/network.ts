import { Construct } from 'constructs'
import { Resource, Fn } from 'cdktf'
import { vpc, datasources, ec2, iam } from '@cdktf/provider-aws'
import { awsRegion, CidrBlocks, defaultTag } from '../../modules/constants'
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

    const privateSubnets = CidrBlocks.privateSubnets.map(
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
            vpcId: myVpc.id,
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

    const ssmSG = new vpc.SecurityGroup(
      this,
      uniqueId({
        prefix: vpc.SecurityGroup,
        suffix: 'ssm',
      }),
      {
        vpcId: myVpc.id,
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: [myVpc.cidrBlock],
          },
        ],
      }
    )

    const vpcEndpointPolicy = new iam.DataAwsIamPolicyDocument(
      this,
      uniqueId({
        prefix: iam.DataAwsIamPolicyDocument,
        suffix: 'vpc_endpoint',
      }),
      {
        statement: [
          {
            effect: 'Allow',
            actions: ['*'],
            resources: ['*'],
            principals: [
              {
                identifiers: ['*'],
                type: 'AWS',
              },
            ],
          },
        ],
      }
    )

    const services = ['ssm', 'ec2messages', 'ssmmessages', 'ec2', 'logs', 'kms']

    services.forEach(
      (service) =>
        new vpc.VpcEndpoint(
          this,
          uniqueId({
            prefix: vpc.VpcEndpoint,
            suffix: service,
          }),
          {
            vpcId: myVpc.id,
            subnetIds: privateSubnets.map((subnet) => subnet.id),
            serviceName: `com.amazonaws.${awsRegion}.${service}`,
            vpcEndpointType: 'Interface',
            securityGroupIds: [ssmSG.id],
            privateDnsEnabled: true,
            policy: vpcEndpointPolicy.json,
          }
        )
    )

    const vpcEndpointS3 = new vpc.VpcEndpoint(
      this,
      uniqueId({
        prefix: vpc.VpcEndpoint,
        suffix: 's3',
      }),
      {
        vpcId: myVpc.id,
        serviceName: `com.amazonaws.${awsRegion}.s3`,
        vpcEndpointType: 'Gateway',
        policy: vpcEndpointPolicy.json,
      }
    )

    privateRouteTables.forEach(
      (routeTable, idx) =>
        new vpc.VpcEndpointRouteTableAssociation(
          this,
          uniqueId({
            prefix: vpc.VpcEndpointRouteTableAssociation,
            suffix: `s3_${idx}`,
          }),
          {
            vpcEndpointId: vpcEndpointS3.id,
            routeTableId: routeTable.id,
          }
        )
    )
  }
}
