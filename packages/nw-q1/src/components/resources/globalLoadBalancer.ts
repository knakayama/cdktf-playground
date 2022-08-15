import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { globalaccelerator, route53, s3 } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import { awsRegion, defaultTag, domain } from '../../modules/utils/constants'
import { loadBalancerData } from '../../modules/utils/dataSources'

export class GlobalLoadBalancer extends Resource {
  public readonly hostedZone: route53.DataAwsRoute53Zone

  constructor(scope: Construct, name: string) {
    super(scope, name)

    const bucket = new s3.S3Bucket(
      this,
      uniqueId({
        prefix: s3.S3Bucket,
        suffix: 'accelerator',
      }),
      {
        forceDestroy: true,
      }
    )

    const accelerator = new globalaccelerator.GlobalacceleratorAccelerator(
      this,
      uniqueId({
        prefix: globalaccelerator.GlobalacceleratorAccelerator,
        suffix: 'this',
      }),
      {
        name: defaultTag,
        ipAddressType: 'IPV4',
        enabled: true,
        attributes: {
          flowLogsEnabled: true,
          flowLogsS3Bucket: bucket.id,
          flowLogsS3Prefix: 'flow-logs/',
        },
      }
    )

    const listener = new globalaccelerator.GlobalacceleratorListener(
      this,
      uniqueId({
        prefix: globalaccelerator.GlobalacceleratorListener,
        suffix: 'this',
      }),
      {
        acceleratorArn: accelerator.id,
        clientAffinity: 'SOURCE_IP',
        protocol: 'TCP',
        portRange: [
          {
            fromPort: 443,
            toPort: 443,
          },
        ],
      }
    )

    new globalaccelerator.GlobalacceleratorEndpointGroup(
      this,
      uniqueId({
        prefix: globalaccelerator.GlobalacceleratorEndpointGroup,
        suffix: 'this',
      }),
      {
        listenerArn: listener.id,
        endpointGroupRegion: awsRegion,
        trafficDialPercentage: 100.0,
        healthCheckPort: 443,
        healthCheckProtocol: 'TCP',
        healthCheckIntervalSeconds: 30,
        thresholdCount: 3,
        endpointConfiguration: [
          {
            clientIpPreservationEnabled: true,
            endpointId: loadBalancerData({
              scope: this,
              suffix: 'this',
            }).arn,
            weight: 128,
          },
        ],
      }
    )

    this.hostedZone = new route53.DataAwsRoute53Zone(
      this,
      uniqueId({
        prefix: route53.DataAwsRoute53Zone,
        suffix: 'this',
      }),
      {
        name: domain,
      }
    )

    new route53.Route53Record(
      this,
      uniqueId({
        prefix: route53.Route53Record,
        suffix: 'ga',
      }),
      {
        zoneId: this.hostedZone.zoneId,
        name: `ga.${this.hostedZone.name}`,
        type: 'A',
        alias: [
          {
            name: accelerator.dnsName,
            zoneId: accelerator.hostedZoneId,
            evaluateTargetHealth: true,
          },
        ],
      }
    )
  }
}