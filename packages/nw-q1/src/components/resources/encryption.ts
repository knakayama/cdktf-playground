import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { datasources, iam, kms } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import { awsRegion, defaultTag } from '../../modules/utils/constants'

interface EncryptionProps {
  partition: datasources.DataAwsPartition
  callerIdentity: datasources.DataAwsCallerIdentity
}

export class Encryption extends Resource {
  public readonly kmsAlias: kms.KmsAlias

  constructor(
    readonly scope: Construct,
    readonly name: string,
    props: EncryptionProps
  ) {
    super(scope, name)

    const policyDocument = new iam.DataAwsIamPolicyDocument(
      this,
      uniqueId({
        prefix: iam.DataAwsIamPolicyDocument,
        suffix: 'kms',
      }),
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'AWS',
                identifiers: [
                  `arn:${props.partition.partition}:iam::${props.callerIdentity.accountId}:root`,
                ],
              },
            ],
            actions: ['kms:*'],
            resources: ['*'],
          },
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: [`logs.${awsRegion}.amazonaws.com`],
              },
            ],
            actions: [
              'kms:Encrypt*',
              'kms:Decrypt*',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:Describe*',
            ],
            resources: ['*'],
          },
        ],
      }
    )

    const kmsKey = new kms.KmsKey(
      this,
      uniqueId({
        prefix: kms.KmsKey,
        suffix: 'ssm',
      }),
      {
        policy: policyDocument.json,
        enableKeyRotation: true,
        deletionWindowInDays: 10,
      }
    )

    this.kmsAlias = new kms.KmsAlias(
      this,
      uniqueId({
        prefix: kms.KmsAlias,
        suffix: 'ssm',
      }),
      {
        name: `alias/${defaultTag}`,
        targetKeyId: kmsKey.id,
      }
    )
  }
}
