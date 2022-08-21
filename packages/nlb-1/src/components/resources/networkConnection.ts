import { Construct } from 'constructs'
import { vpc, datasources } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

interface NetworkConnectionProps {
  requesterVpc: vpc.DataAwsVpc
  accepterVpc: vpc.DataAwsVpc
  callerIdentity: datasources.DataAwsCallerIdentity
}

export class NetworkConnection extends Construct {
  constructor(
    readonly scope: Construct,
    readonly name: string,
    { requesterVpc, accepterVpc, callerIdentity }: NetworkConnectionProps
  ) {
    super(scope, name)

    new vpc.VpcPeeringConnection(
      this,
      uniqueId({
        prefix: vpc.VpcPeeringConnection,
        suffix: 'this',
      }),
      {
        vpcId: requesterVpc.id,
        peerVpcId: accepterVpc.id,
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
