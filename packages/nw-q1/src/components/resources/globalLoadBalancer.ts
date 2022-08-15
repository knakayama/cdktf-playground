import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { route53 } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import { domain } from '../../modules/utils/constants'

export class GlobalLoadBalancer extends Resource {
  public readonly hostedZone: route53.DataAwsRoute53Zone

  constructor(scope: Construct, name: string) {
    super(scope, name)

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
  }
}
