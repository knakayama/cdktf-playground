import { Construct } from 'constructs'
import { TerraformStack } from 'cdktf'
import { AwsProvider } from '@cdktf/provider-aws'
import { awsRegion, defaultTag } from '../../modules/constants'
import { Network } from '../resources/network'
import { DataSources } from '../resources/dataSources'
import { ObjectStorage } from '../resources/objectStorage'
import { Encryption } from '../resources/encryption'

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

    const dataSources = new DataSources(this, 'data_sources')

    const encryption = new Encryption(this, 'encryption', {
      callerIdentity: dataSources.callerIdentity,
      partition: dataSources.partition,
    })

    new Network(this, 'network', {
      azs: dataSources.azs,
    })

    new ObjectStorage(this, 'objectStorage', {
      encryptionKey: encryption.key,
    })
  }
}
