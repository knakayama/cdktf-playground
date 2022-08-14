import { Construct } from 'constructs'
import { Fn, Resource } from 'cdktf'
import {
  autoscaling,
  ssm,
  vpc,
  ec2,
  iam,
  datasources,
  s3,
  kms,
} from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import * as path from 'path'

interface ComputeProps {
  vpc: vpc.Vpc
  loadBalancerSG: vpc.SecurityGroup
  privateSubnets: vpc.Subnet[]
  partition: datasources.DataAwsPartition
  sessionLogBucket: s3.S3Bucket
  encryptionKey: kms.KmsKey
}

export class Compute extends Resource {
  constructor(scope: Construct, name: string, props: ComputeProps) {
    super(scope, name)

    const sg = new vpc.SecurityGroup(
      this,
      uniqueId({
        prefix: vpc.SecurityGroup,
        suffix: 'compute',
      }),
      {
        vpcId: props.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [props.loadBalancerSG.id],
          },
        ],
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
        arn: `arn:${props.partition.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore`,
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
            resources: [
              props.sessionLogBucket.arn,
              `${props.sessionLogBucket.arn}/*`,
            ],
          },
          {
            effect: 'Allow',
            actions: ['s3:GetEncryptionConfiguration'],
            resources: [props.sessionLogBucket.arn],
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
            resources: [props.encryptionKey.arn],
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

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      uniqueId({
        prefix: ec2.LaunchTemplate,
        suffix: 'compute',
      }),
      {
        imageId: ami.value,
        instanceType: 't2.micro',
        userData: Fn.filebase64(
          path.join(__dirname, '../../modules/artifacts/user-data.sh')
        ),
        vpcSecurityGroupIds: [sg.id],
        iamInstanceProfile: {
          arn: ssmInstanceProfile.arn,
        },
        lifecycle: {
          createBeforeDestroy: true,
        },
      }
    )

    new autoscaling.AutoscalingGroup(
      this,
      uniqueId({
        prefix: autoscaling.AutoscalingGroup,
        suffix: 'compute',
      }),
      {
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 1,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        vpcZoneIdentifier: props.privateSubnets.map((subnet) => subnet.id),
        lifecycle: {
          ignoreChanges: ['desired_capacity', 'target_group_arns'],
        },
      }
    )
  }
}
