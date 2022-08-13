import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { datasources } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

export class DataSources extends Resource {
  public readonly azs: datasources.DataAwsAvailabilityZones
  public readonly partition: datasources.DataAwsPartition
  public readonly callerIdentity: datasources.DataAwsCallerIdentity

  constructor(scope: Construct, name: string) {
    super(scope, name)

    this.azs = new datasources.DataAwsAvailabilityZones(
      this,
      uniqueId({
        prefix: datasources.DataAwsAvailabilityZones,
        suffix: 'this',
      }),
      {
        state: 'available',
      }
    )

    this.partition = new datasources.DataAwsPartition(
      this,
      uniqueId({
        prefix: datasources.DataAwsPartition,
        suffix: 'this',
      })
    )

    this.callerIdentity = new datasources.DataAwsCallerIdentity(
      this,
      uniqueId({
        prefix: datasources.DataAwsCallerIdentity,
        suffix: 'this',
      })
    )
  }
}
