import { Construct } from 'constructs'
import { Fn, Resource, TerraformIterator } from 'cdktf'
import { ssm, vpc, ec2 } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import * as path from 'path'

interface ServerComputeProps {
  vpcData: vpc.DataAwsVpc
  privateSubnets: vpc.DataAwsSubnets
  //instanceProfile: iam.DataAwsIamInstanceProfile
  defaultTag: string
}

export class ServerCompute extends Resource {
  constructor(
    readonly scope: Construct,
    readonly name: string,
    { privateSubnets, vpcData, defaultTag }: ServerComputeProps
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

    const privateSubnetIterator = TerraformIterator.fromList(privateSubnets.ids)

    new ec2.Instance(
      this,
      uniqueId({
        prefix: ec2.Instance,
        suffix: 'compute',
      }),
      {
        forEach: privateSubnetIterator,
        ami: ami.value,
        instanceType: 't2.micro',
        userData: Fn.filebase64(
          path.join(__dirname, '../../modules/artifacts/user-data.sh')
        ),
        vpcSecurityGroupIds: [sg.id],
        //iamInstanceProfile: instanceProfile.name,
        subnetId: privateSubnetIterator.value,
        lifecycle: {
          createBeforeDestroy: true,
        },
        tags: {
          Name: defaultTag,
        },
      }
    )
  }
}
