import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { s3 } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

export class S3 extends Resource {
  constructor(readonly scope: Construct, readonly name: string) {
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
  }
}
