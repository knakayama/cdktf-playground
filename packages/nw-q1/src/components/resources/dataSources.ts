import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { datasources } from '@cdktf/provider-aws'

export class DataSources extends Resource {
  public readonly azs: datasources.DataAwsAvailabilityZones

  constructor(scope: Construct, name: string) {
    super(scope, name)

    this.azs = new datasources.DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    })
  }
}
