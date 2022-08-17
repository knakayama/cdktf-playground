import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { vpc, datasources } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

interface NetworkProps {
  vpc1: vpc.DataAwsVpc
  vpc2: vpc.DataAwsVpc
  callerIdentity: datasources.DataAwsCallerIdentity
}

export class Network extends Resource {
  constructor(
    readonly scope: Construct,
    readonly name: string,
    { vpc1, vpc2, callerIdentity }: NetworkProps
  ) {
    super(scope, name)

    new vpc.VpcPeeringConnection(
      this,
      uniqueId({
        prefix: vpc.VpcPeeringConnection,
        suffix: 'this',
      }),
      {
        vpcId: vpc1.id,
        peerVpcId: vpc2.id,
        peerOwnerId: callerIdentity.accountId,
        autoAccept: true,
        accepter: {
          allowRemoteVpcDnsResolution: true,
        },
        requester: {
          allowRemoteVpcDnsResolution: true,
        },
      }
    )
  }
}
