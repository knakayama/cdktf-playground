import { Construct } from 'constructs'
import { TerraformStack } from 'cdktf'
import { AwsProvider } from '@cdktf/provider-aws'
import {
  awsRegion,
  defaultTag,
  requesterNetworkTag,
  accepterNetworkTag,
} from '../../modules/utils/constants'
import { RequesterNetwork } from '../modules/requesterNetwork/main'
import { AccepterNetwork } from '../modules/accepterNetwork/main'
//import { ObjectStorage } from '../resources/objectStorage'
//import { Encryption } from '../resources/encryption'
//import { LoadBalancer } from '../resources/loadBalancer'
import {
  availabilityZoneData,
  //callerIdentityData,
  //hostedZoneData,
  //kmsKeyData,
  //loadBalancerData,
  //loadBalancerSGData,
  //loadBalancerTargetGroupData,
  //partitionData,
  //privateSubnetsData,
  //sessionLogBucketData,
  requesterVpcData,
  //accepterVpcData,
} from '../../modules/utils/dataSources'
//import { NetworkConnection } from '../resources/networkConnection'

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
    //const callerIdentity = callerIdentityData({ scope: this })
    //const partition = partitionData({ scope: this })
    //const hostedZone = hostedZoneData({ scope: this })

    const requesterNetwork = new RequesterNetwork(this, 'requester_network', {
      azs,
      cidrBlock: '192.168.0.0/16',
      defaultTag: requesterNetworkTag,
      publicCidrBlocks: ['192.168.0.0/24', '192.168.1.0/24'],
      privateCidrBlocks: ['192.168.100.0/24', '192.168.101.0/24'],
    })

    new AccepterNetwork(this, 'accepter_network', {
      azs,
      cidrBlock: '172.16.0.0/16',
      defaultTag: accepterNetworkTag,
      privateCidrBlocks1: ['172.16.1.0/24', '172.16.2.0/24'],
      privateCidrBlocks2: ['172.16.101.0/24', '172.16.102.0/24'],
    })

    requesterVpcData({
      scope: this,
      dependsOn: [requesterNetwork],
    })

    //const accepterVpc = accepterVpcData({
    //  scope: this,
    //  dependsOn: [accepterNetwork],
    //})

    //new NetworkConnection(this, 'network_connection', {
    //  callerIdentity,
    //  requesterVpc,
    //  accepterVpc,
    //})

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
  }
}
