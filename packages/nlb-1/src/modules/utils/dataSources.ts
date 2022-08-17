import { Construct } from 'constructs'
import { datasources, elb, kms, s3, vpc } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import { defaultTag } from './constants'
import { ITerraformDependable } from 'cdktf'
import * as hash from 'object-hash'

interface DataOptions {
  scope: Construct
  dependsOn: ITerraformDependable[]
}

type IndependentDataOptions = Pick<DataOptions, 'scope'>
type SessionLogBucketDataOptions = DataOptions & {
  bucketName: string
}
type TaggedDataOptions = DataOptions & {
  tags: {
    [key: string]: string
  }
}

export const loadBalancerData = ({
  scope,
  dependsOn,
}: DataOptions): elb.DataAwsLb =>
  new elb.DataAwsLb(
    scope,
    uniqueId({
      prefix: elb.DataAwsLb,
      suffix: 'this',
    }),
    {
      dependsOn,
      tags: {
        Name: defaultTag,
      },
    }
  )

export const availabilityZoneData = ({
  scope,
}: IndependentDataOptions): datasources.DataAwsAvailabilityZones =>
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
}: IndependentDataOptions): datasources.DataAwsPartition =>
  new datasources.DataAwsPartition(
    scope,
    uniqueId({
      prefix: datasources.DataAwsPartition,
      suffix: 'this',
    })
  )

export const callerIdentityData = ({
  scope,
}: IndependentDataOptions): datasources.DataAwsCallerIdentity =>
  new datasources.DataAwsCallerIdentity(
    scope,
    uniqueId({
      prefix: datasources.DataAwsCallerIdentity,
      suffix: 'this',
    })
  )

export const vpcData = ({
  scope,
  dependsOn,
  tags,
}: TaggedDataOptions): vpc.DataAwsVpc =>
  new vpc.DataAwsVpc(
    scope,
    uniqueId({
      prefix: vpc.DataAwsVpc,
      suffix: hash(dependsOn),
    }),
    {
      dependsOn,
      tags,
    }
  )

export const kmsKeyData = ({
  scope,
  dependsOn,
}: DataOptions): kms.DataAwsKmsKey =>
  new kms.DataAwsKmsKey(
    scope,
    uniqueId({
      prefix: kms.DataAwsKmsKey,
      suffix: 'this',
    }),
    {
      dependsOn,
      keyId: `alias/${defaultTag}`,
    }
  )

export const privateSubnetsData = ({
  scope,
  dependsOn,
}: DataOptions): vpc.DataAwsSubnets =>
  new vpc.DataAwsSubnets(
    scope,
    uniqueId({
      prefix: vpc.DataAwsSubnets,
      suffix: 'this',
    }),
    {
      dependsOn,
      filter: [
        {
          name: 'tag:Name',
          values: [`${defaultTag}-private-*`],
        },
      ],
    }
  )

export const loadBalancerSGData = ({
  scope,
  dependsOn,
}: DataOptions): vpc.DataAwsSecurityGroup =>
  new vpc.DataAwsSecurityGroup(
    scope,
    uniqueId({
      prefix: vpc.DataAwsSecurityGroup,
      suffix: 'this',
    }),
    {
      dependsOn,
      tags: {
        Name: defaultTag,
        UsedBy: 'load-balancer',
      },
    }
  )

export const sessionLogBucketData = ({
  scope,
  dependsOn,
  bucketName,
}: SessionLogBucketDataOptions): s3.DataAwsS3Bucket =>
  new s3.DataAwsS3Bucket(
    scope,
    uniqueId({
      prefix: s3.DataAwsS3Bucket,
      suffix: 'this',
    }),
    {
      dependsOn,
      bucket: bucketName,
    }
  )

export const loadBalancerTargetGroupData = ({
  scope,
  dependsOn,
}: DataOptions): elb.DataAwsLbTargetGroup =>
  new elb.DataAwsLbTargetGroup(
    scope,
    uniqueId({
      prefix: elb.DataAwsLbTargetGroup,
      suffix: 'this',
    }),
    {
      dependsOn,
      tags: {
        Name: defaultTag,
      },
    }
  )
