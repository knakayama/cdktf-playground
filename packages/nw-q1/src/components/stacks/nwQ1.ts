import { Construct } from 'constructs'
import { TerraformStack } from 'cdktf'
import { AwsProvider } from '@cdktf/provider-aws'
import { awsRegion, defaultTag } from '../../modules/constants'
import { Network } from '../resources/network'
import { DataSources } from '../resources/dataSources'
import { ObjectStorage } from '../resources/objectStorage'
import { Encryption } from '../resources/encryption'
import { LoadBalancer } from '../resources/loadBalancer'
import { Compute } from '../resources/compute'

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

    const network = new Network(this, 'network', {
      azs: dataSources.azs,
    })

    const encryption = new Encryption(this, 'encryption', {
      callerIdentity: dataSources.callerIdentity,
      partition: dataSources.partition,
    })

    new ObjectStorage(this, 'object_storage', {
      encryptionKey: encryption.key,
    })

    const lb = new LoadBalancer(this, 'load_balancer', {
      vpc: network.vpc,
    })

    new Compute(this, 'compute', {
      vpc: network.vpc,
      loadBalancerSG: lb.loadBalancerSG,
    })
  }
}
