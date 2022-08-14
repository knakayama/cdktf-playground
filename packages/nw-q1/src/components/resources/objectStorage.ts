import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { kms, s3 } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

interface ObjectStorageProps {
  encryptionKey: kms.KmsKey
}

export class ObjectStorage extends Resource {
  constructor(
    readonly scope: Construct,
    readonly name: string,
    props: ObjectStorageProps
  ) {
    super(scope, name)

    const bucketSsm = new s3.S3Bucket(
      this,
      uniqueId({
        prefix: s3.S3Bucket,
        suffix: 'session_log',
      }),
      {
        forceDestroy: true,
      }
    )

    new s3.S3BucketOwnershipControls(
      this,
      uniqueId({
        prefix: s3.S3BucketOwnershipControls,
        suffix: 'session_log',
      }),
      {
        bucket: bucketSsm.bucket,
        rule: {
          objectOwnership: 'BucketOwnerEnforced',
        },
      }
    )

    new s3.S3BucketVersioningA(
      this,
      uniqueId({
        prefix: s3.S3BucketVersioningA,
        suffix: 'session_log',
      }),
      {
        bucket: bucketSsm.bucket,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    )

    new s3.S3BucketServerSideEncryptionConfigurationA(
      this,
      uniqueId({
        prefix: s3.S3BucketServerSideEncryptionConfigurationA,
        suffix: 'session_log',
      }),
      {
        bucket: bucketSsm.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              kmsMasterKeyId: props.encryptionKey.id,
              sseAlgorithm: 'aws:kms',
            },
          },
        ],
      }
    )

    new s3.S3BucketLifecycleConfiguration(
      this,
      uniqueId({
        prefix: s3.S3BucketLifecycleConfiguration,
        suffix: 'session_log',
      }),
      {
        bucket: bucketSsm.id,
        rule: [
          {
            id: 'archive_after_X_days',
            status: 'Enabled',
            transition: [
              {
                days: 10,
                storageClass: 'GLACIER',
              },
            ],
            expiration: {
              days: 14,
            },
          },
        ],
      }
    )

    new s3.S3BucketLoggingA(
      this,
      uniqueId({
        prefix: s3.S3BucketLoggingA,
        suffix: 'session_log',
      }),
      {
        bucket: bucketSsm.id,
        targetBucket: bucketSsm.id,
        targetPrefix: 'log/',
      }
    )

    new s3.S3BucketPublicAccessBlock(
      this,
      uniqueId({
        prefix: s3.S3BucketPublicAccessBlock,
        suffix: 'session_log',
      }),
      {
        bucket: bucketSsm.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    )
  }
}