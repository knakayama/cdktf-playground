import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { vpc, route53 } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import { domain } from '../../modules/utils/constants'

interface DNSProps {
  hostedZone: route53.DataAwsRoute53Zone
  vpc: vpc.DataAwsVpc
}

export class DNS extends Resource {
  constructor(
    readonly scope: Construct,
    readonly name: string,
    { hostedZone, vpc }: DNSProps
  ) {
    super(scope, name)

    new route53.Route53Record(
      this,
      uniqueId({
        prefix: route53.Route53Record,
        suffix: 'public',
      }),
      {
        zoneId: hostedZone.zoneId,
        name: `test.${hostedZone.name}`,
        type: 'A',
        records: ['8.8.8.8'],
        ttl: 300,
      }
    )

    const privateHostedZone = new route53.Route53Zone(
      this,
      uniqueId({
        prefix: route53.Route53Zone,
        suffix: 'private',
      }),
      {
        name: domain,
        vpc: [
          {
            vpcId: vpc.id,
          },
        ],
      }
    )

    new route53.Route53Record(
      this,
      uniqueId({
        prefix: route53.Route53Record,
        suffix: 'private',
      }),
      {
        zoneId: privateHostedZone.zoneId,
        name: `test.${privateHostedZone.name}`,
        type: 'A',
        records: ['127.0.0.1'],
        ttl: 300,
      }
    )
  }
}
