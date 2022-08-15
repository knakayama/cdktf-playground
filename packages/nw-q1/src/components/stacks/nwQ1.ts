import { Construct } from 'constructs'
import { TerraformStack } from 'cdktf'
import { AwsProvider } from '@cdktf/provider-aws'
import { awsRegion, defaultTag } from '../../modules/utils/constants'
import { Network } from '../resources/network'
import { ObjectStorage } from '../resources/objectStorage'
import { Encryption } from '../resources/encryption'
import { LoadBalancer } from '../resources/loadBalancer'
import { Compute } from '../resources/compute'
import { GlobalLoadBalancer } from '../resources/globalLoadBalancer'
import {
  availabilityZoneData,
  callerIdentityData,
  hostedZoneData,
  partitionData,
} from '../../modules/utils/dataSources'

export class NWQ1Stack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: {
        tags: {
          Name: defaultTag,
        },
      },
    })

    const azs = availabilityZoneData({ scope: this })
    const callerIdentity = callerIdentityData({ scope: this })
    const partition = partitionData({ scope: this })
    const hostedZone = hostedZoneData({ scope: this })

    const network = new Network(this, 'network', {
      azs,
    })

    const encryption = new Encryption(this, 'encryption', {
      callerIdentity,
      partition,
    })

    const objectStorage = new ObjectStorage(this, 'object_storage', {
      encryptionKey: encryption.encryptionKey,
    })

    new GlobalLoadBalancer(this, 'global_load_balancer', {
      hostedZone,
    })

    const lb = new LoadBalancer(this, 'load_balancer', {
      vpc: network.vpc,
      privateSubnets: network.privateSubnets,
      hostedZone,
    })

    new Compute(this, 'compute', {
      vpc: network.vpc,
      loadBalancerSG: lb.loadBalancerSG,
      privateSubnets: network.privateSubnets,
      sessionLogBucket: objectStorage.sessionLogBucket,
      partition,
      encryptionKey: encryption.encryptionKey,
      loadBalancerTargetGroup: lb.loadBalancerTargetGroup,
    })
  }
}
