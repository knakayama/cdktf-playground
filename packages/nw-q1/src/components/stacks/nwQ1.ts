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
  kmsKeyData,
  loadBalancerData,
  loadBalancerSGData,
  loadBalancerTargetGroupData,
  partitionData,
  privateSubnetsData,
  sessionLogBucketData,
  vpcData,
} from '../../modules/utils/dataSources'
import { Waf } from '../resources/waf'
import { HttpProvider } from '../../.gen/providers/http'

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

    new HttpProvider(this, 'http')

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

    const loadBalancerClass = new LoadBalancer(this, 'load_balancer', {
      vpcData: vpc,
      privateSubnets,
      hostedZone,
    })

    const loadBalancer = loadBalancerData({
      scope: this,
      dependsOn: [loadBalancerClass.loadBalancer],
    })

    new Waf(this, 'waf', {
      loadBalancer,
    })

    new GlobalLoadBalancer(this, 'global_load_balancer', {
      hostedZone,
      loadBalancer,
    })

    const loadBalancerSG = loadBalancerSGData({
      scope: this,
      dependsOn: [loadBalancerClass.loadBalancerSG],
    })

    const sessionLogBucket = sessionLogBucketData({
      scope: this,
      dependsOn: [objectStorage.sessionLogBucket],
      bucketName: objectStorage.sessionLogBucket.bucket,
    })

    const loadBalancerTargetGroup = loadBalancerTargetGroupData({
      scope: this,
      dependsOn: [loadBalancerClass.loadBalancerTargetGroup],
    })

    new Compute(this, 'compute', {
      vpc,
      loadBalancerSG,
      privateSubnets,
      sessionLogBucket,
      partition,
      kmsKey,
      loadBalancerTargetGroup,
    })
  }
}
