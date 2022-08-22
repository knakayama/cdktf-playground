import { Construct } from 'constructs'
import { Fn } from 'cdktf'
import { ssm, vpc, ec2, iam } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import * as path from 'path'

interface ClientComputeProps {
  vpcData: vpc.DataAwsVpc
  publicSubnets: vpc.DataAwsSubnets
  instanceProfile: iam.DataAwsIamInstanceProfile
  defaultTag: string
}

export class ClientCompute extends Construct {
  constructor(
    readonly scope: Construct,
    readonly name: string,
    { publicSubnets, vpcData, defaultTag, instanceProfile }: ClientComputeProps
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

    const instance = new ec2.Instance(
      this,
      uniqueId({
        prefix: ec2.Instance,
        suffix: 'compute',
      }),
      {
        ami: ami.value,
        instanceType: 't2.micro',
        userData: Fn.filebase64(
          path.join(__dirname, '../../modules/artifacts/user-data.sh')
        ),
        vpcSecurityGroupIds: [sg.id],
        iamInstanceProfile: instanceProfile.name,
        subnetId: Fn.element(publicSubnets.ids, 0),
        lifecycle: {
          createBeforeDestroy: true,
        },
        tags: {
          Name: defaultTag,
        },
      }
    )

    new ec2.Eip(
      this,
      uniqueId({
        prefix: ec2.Eip,
        suffix: 'compute',
      }),
      {
        instance: instance.id,
        vpc: true,
      }
    )
  }
}
