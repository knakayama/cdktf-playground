import { Construct } from 'constructs'
import { TerraformStack } from 'cdktf'
import { AwsProvider } from '@cdktf/provider-aws'
import { awsRegion, defaultTag } from '../../modules/utils/constants'
import { Network } from '../resources/network'
import { DataSources } from '../resources/dataSources'
import { ObjectStorage } from '../resources/objectStorage'
import { Encryption } from '../resources/encryption'
import { LoadBalancer } from '../resources/loadBalancer'
import { Compute } from '../resources/compute'
import { GlobalLoadBalancer } from '../resources/globalLoadBalancer'

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

    const objectStorage = new ObjectStorage(this, 'object_storage', {
      encryptionKey: encryption.encryptionKey,
    })

    const ga = new GlobalLoadBalancer(this, 'global_load_balancer')

    const lb = new LoadBalancer(this, 'load_balancer', {
      vpc: network.vpc,
      privateSubnets: network.privateSubnets,
      hostedZone: ga.hostedZone,
    })

    new Compute(this, 'compute', {
      vpc: network.vpc,
      loadBalancerSG: lb.loadBalancerSG,
      privateSubnets: network.privateSubnets,
      sessionLogBucket: objectStorage.sessionLogBucket,
      partition: dataSources.partition,
      encryptionKey: encryption.encryptionKey,
      loadBalancerTargetGroup: lb.loadBalancerTargetGroup,
    })
  }
}
