import { Construct } from 'constructs'
import { iam, datasources, s3, kms } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

interface ClientComputeProps {
  partition: datasources.DataAwsPartition
  sessionLogBucket: s3.DataAwsS3Bucket
  kmsKey: kms.DataAwsKmsKey
  defaultTag: string
}

export class InstanceProfile extends Construct {
  public readonly instanceProfile: iam.IamInstanceProfile

  constructor(
    readonly scope: Construct,
    readonly name: string,
    { partition, sessionLogBucket, kmsKey, defaultTag }: ClientComputeProps
  ) {
    super(scope, name)

    const ssmPolicyDocument = new iam.DataAwsIamPolicyDocument(
      this,
      uniqueId({
        prefix: iam.DataAwsIamPolicyDocument,
        suffix: 'ssm',
      }),
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'Service',
                identifiers: ['ec2.amazonaws.com'],
              },
            ],
          },
        ],
      }
    )

    const ssmRole = new iam.IamRole(
      this,
      uniqueId({
        prefix: iam.IamRole,
        suffix: 'ssm',
      }),
      {
        assumeRolePolicy: ssmPolicyDocument.json,
      }
    )

    const ssmCorePolicy = new iam.DataAwsIamPolicy(
      this,
      uniqueId({
        prefix: iam.IamPolicy,
        suffix: 'ssm',
      }),
      {
        arn: `arn:${partition.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore`,
      }
    )

    const cwlPolicyDocument = new iam.DataAwsIamPolicyDocument(
      this,
      uniqueId({
        prefix: iam.DataAwsIamPolicyDocument,
        suffix: 'cwl',
      }),
      {
        statement: [
          {
            effect: 'Allow',
            actions: [
              's3:PutObject',
              's3:PutObjectAcl',
              's3:PutObjectVersionAcl',
            ],
            resources: [sessionLogBucket.arn, `${sessionLogBucket.arn}/*`],
          },
          {
            effect: 'Allow',
            actions: ['s3:GetEncryptionConfiguration'],
            resources: [sessionLogBucket.arn],
          },
          {
            effect: 'Allow',
            actions: [
              'logs:PutLogEvents',
              'logs:CreateLogStream',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            resources: ['*'],
          },
          {
            actions: [
              'kms:DescribeKey',
              'kms:GenerateDataKey',
              'kms:Decrypt',
              'kms:Encrypt',
            ],
            resources: [kmsKey.arn],
          },
        ],
      }
    )

    const cwlPolicy = new iam.IamPolicy(
      this,
      uniqueId({
        prefix: iam.IamPolicy,
        suffix: 'cwl',
      }),
      {
        policy: cwlPolicyDocument.json,
      }
    )

    new iam.IamRolePolicyAttachment(
      this,
      uniqueId({
        prefix: iam.IamRolePolicyAttachment,
        suffix: 'ssm',
      }),
      {
        role: ssmRole.name,
        policyArn: ssmCorePolicy.arn,
      }
    )

    new iam.IamRolePolicyAttachment(
      this,
      uniqueId({
        prefix: iam.IamRolePolicyAttachment,
        suffix: 'cwl',
      }),
      {
        role: ssmRole.name,
        policyArn: cwlPolicy.arn,
      }
    )

    this.instanceProfile = new iam.IamInstanceProfile(
      this,
      uniqueId({
        prefix: iam.IamInstanceProfile,
        suffix: 'ssm',
      }),
      {
        name: `${defaultTag}-ssm`,
        role: ssmRole.name,
      }
    )
  }
}
