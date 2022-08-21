import { Construct } from 'constructs'
import { Fn } from 'cdktf'
import { ssm, vpc, ec2, iam, datasources, s3, kms } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'

interface ComputeProps {
  vpcData: vpc.DataAwsVpc
  privateSubnets: vpc.DataAwsSubnets
  partition: datasources.DataAwsPartition
  sessionLogBucket: s3.DataAwsS3Bucket
  kmsKey: kms.DataAwsKmsKey
}

export class Compute extends Construct {
  constructor(
    readonly scope: Construct,
    readonly name: string,
    {
      kmsKey,
      partition,
      privateSubnets,
      sessionLogBucket,
      vpcData,
    }: ComputeProps
  ) {
    super(scope, name)

    const sg = new vpc.SecurityGroup(
      this,
      uniqueId({
        prefix: vpc.SecurityGroup,
        suffix: 'compute',
      }),
      {
        vpcId: vpcData.id,
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
      }
    )

    const ami = new ssm.DataAwsSsmParameter(
      this,
      uniqueId({
        prefix: ssm.DataAwsSsmParameter,
        suffix: 'amazon_linux_2',
      }),
      {
        name: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
      }
    )

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

    const ssmInstanceProfile = new iam.IamInstanceProfile(
      this,
      uniqueId({
        prefix: iam.IamInstanceProfile,
        suffix: 'ssm',
      }),
      {
        role: ssmRole.name,
      }
    )

    new ec2.Instance(
      this,
      uniqueId({
        prefix: ec2.LaunchTemplate,
        suffix: 'compute',
      }),
      {
        ami: ami.value,
        instanceType: 't2.micro',
        vpcSecurityGroupIds: [sg.id],
        iamInstanceProfile: ssmInstanceProfile.name,
        lifecycle: {
          createBeforeDestroy: true,
        },
        subnetId: Fn.element(privateSubnets.ids, 0),
      }
    )
  }
}
