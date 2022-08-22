import { Construct } from 'constructs'
import { TerraformStack } from 'cdktf'
import { AwsProvider } from '@cdktf/provider-aws'
import { awsRegion, defaultTag } from '../../modules/utils/constants'
import { Network } from '../constructs/network'
import { ObjectStorage } from '../constructs/objectStorage'
import { Encryption } from '../constructs/encryption'
import { Compute } from '../constructs/compute'
import {
  availabilityZoneData,
  callerIdentityData,
  hostedZoneData,
  kmsKeyData,
  partitionData,
  privateSubnetsData,
  sessionLogBucketData,
  vpcData,
} from '../../modules/utils/data'
import { DNS } from '../constructs/dns'

export class NWQ2Stack extends TerraformStack {
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

    const vpc = vpcData({ scope: this, dependsOn: [network.vpc] })

    const encryption = new Encryption(this, 'encryption', {
      callerIdentity,
      partition,
    })

    const kmsKey = kmsKeyData({
      scope: this,
      dependsOn: [encryption.kmsAlias],
    })

    const objectStorage = new ObjectStorage(this, 'object_storage', {
      kmsKey,
    })

    const privateSubnets = privateSubnetsData({
      scope: this,
      dependsOn: network.privateSubnets.map((subnet) => subnet),
    })

    const sessionLogBucket = sessionLogBucketData({
      scope: this,
      dependsOn: [objectStorage.sessionLogBucket],
      bucketName: objectStorage.sessionLogBucket.bucket,
    })

    new Compute(this, 'compute', {
      vpcData: vpc,
      privateSubnets,
      sessionLogBucket,
      partition,
      kmsKey,
    })

    new DNS(this, 'dns', {
      hostedZone,
      vpc,
    })
  }
}
