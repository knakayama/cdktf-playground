import { Construct } from 'constructs'
import { datasources, elb, route53 } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import { defaultTag, domain } from './constants'

interface DataOptions {
  scope: Construct
  tags?: {
    [id: string]: string
  }
}

type UniqueDataOptions = Pick<DataOptions, 'scope'>

export const loadBalancerData = ({
  scope,
  tags = {},
}: DataOptions): elb.DataAwsLb =>
  new elb.DataAwsLb(
    scope,
    uniqueId({
      prefix: elb.DataAwsLb,
      suffix: 'this',
    }),
    {
      tags: {
        Name: defaultTag,
      },
      ...tags,
    }
  )

export const availabilityZoneData = ({
  scope,
}: UniqueDataOptions): datasources.DataAwsAvailabilityZones =>
  new datasources.DataAwsAvailabilityZones(
    scope,
    uniqueId({
      prefix: datasources.DataAwsAvailabilityZones,
      suffix: 'this',
    }),
    {
      state: 'available',
    }
  )

export const partitionData = ({
  scope,
}: UniqueDataOptions): datasources.DataAwsPartition =>
  new datasources.DataAwsPartition(
    scope,
    uniqueId({
      prefix: datasources.DataAwsPartition,
      suffix: 'this',
    })
  )

export const callerIdentityData = ({
  scope,
}: UniqueDataOptions): datasources.DataAwsCallerIdentity =>
  new datasources.DataAwsCallerIdentity(
    scope,
    uniqueId({
      prefix: datasources.DataAwsCallerIdentity,
      suffix: 'this',
    })
  )

export const hostedZoneData = ({ scope }: UniqueDataOptions) =>
  new route53.DataAwsRoute53Zone(
    scope,
    uniqueId({
      prefix: route53.DataAwsRoute53Zone,
      suffix: 'this',
    }),
    {
      name: domain,
    }
  )
