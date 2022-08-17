import { Construct } from 'constructs'
import { TerraformStack } from 'cdktf'
import { AwsProvider } from '@cdktf/provider-aws'
import {
  awsRegion,
  defaultTag,
  network1Tag,
  network2Tag,
} from '../../modules/utils/constants'
import { Network1 } from '../modules/network-1/main'
import { Network2 } from '../modules/network-2/main'
//import { ObjectStorage } from '../resources/objectStorage'
//import { Encryption } from '../resources/encryption'
//import { LoadBalancer } from '../resources/loadBalancer'
//import { Compute } from '../resources/compute'
import {
  availabilityZoneData,
  callerIdentityData,
  //hostedZoneData,
  //kmsKeyData,
  //loadBalancerData,
  //loadBalancerSGData,
  //loadBalancerTargetGroupData,
  //partitionData,
  //privateSubnetsData,
  //sessionLogBucketData,
  vpcData,
} from '../../modules/utils/dataSources'
import { Network } from '../resources/network'

export class Nlb1Stack extends TerraformStack {
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
    //const partition = partitionData({ scope: this })
    //const hostedZone = hostedZoneData({ scope: this })

    const network1 = new Network1(this, 'network1', {
      azs,
      cidrBlock: '192.168.0.0/16',
      defaultTag: network1Tag,
      publicCidrBlocks: ['192.168.0.0/24', '192.168.1.0/24'],
      privateCidrBlocks: ['192.168.100.0/24', '192.168.101.0/24'],
    })

    const network2 = new Network2(this, 'network2', {
      azs,
      cidrBlock: '172.16.0.0/16',
      defaultTag: network2Tag,
      privateCidrBlocks1: ['172.16.1.0/24', '172.16.2.0/24'],
      privateCidrBlocks2: ['172.16.101.0/24', '172.16.102.0/24'],
    })

    const vpc1 = vpcData({
      scope: this,
      dependsOn: [network1],
      tags: { Name: network1Tag },
    })
    const vpc2 = vpcData({
      scope: this,
      dependsOn: [network2],
      tags: { Name: network2Tag },
    })

    new Network(this, 'network', {
      callerIdentity,
      vpc1,
      vpc2,
    })

    //const encryption = new Encryption(this, 'encryption', {
    //  callerIdentity,
    //  partition,
    //})

    //const kmsKey = kmsKeyData({
    //  scope: this,
    //  dependsOn: [encryption.kmsAlias],
    //})

    //const objectStorage = new ObjectStorage(this, 'object_storage', {
    //  kmsKey,
    //})

    //const privateSubnets = privateSubnetsData({
    //  scope: this,
    //  dependsOn: network.privateSubnets.map((subnet) => subnet),
    //})

    //const loadBalancerClass = new LoadBalancer(this, 'load_balancer', {
    //  vpcData: vpc,
    //  privateSubnets,
    //  hostedZone,
    //})

    //const loadBalancer = loadBalancerData({
    //  scope: this,
    //  dependsOn: [loadBalancerClass.loadBalancer],
    //})

    //new Waf(this, 'waf', {
    //  loadBalancer,
    //})

    //new GlobalLoadBalancer(this, 'global_load_balancer', {
    //  hostedZone,
    //  loadBalancer,
    //})

    //const loadBalancerSG = loadBalancerSGData({
    //  scope: this,
    //  dependsOn: [loadBalancerClass.loadBalancerSG],
    //})

    //const sessionLogBucket = sessionLogBucketData({
    //  scope: this,
    //  dependsOn: [objectStorage.sessionLogBucket],
    //  bucketName: objectStorage.sessionLogBucket.bucket,
    //})

    //const loadBalancerTargetGroup = loadBalancerTargetGroupData({
    //  scope: this,
    //  dependsOn: [loadBalancerClass.loadBalancerTargetGroup],
    //})

    //new Compute(this, 'compute', {
    //  vpc,
    //  loadBalancerSG,
    //  privateSubnets,
    //  sessionLogBucket,
    //  partition,
    //  kmsKey,
    //  loadBalancerTargetGroup,
    //})
  }
}
