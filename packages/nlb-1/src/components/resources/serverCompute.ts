import { Construct } from 'constructs'
import { Fn, Resource } from 'cdktf'
import { ssm, vpc, ec2, iam } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import * as path from 'path'

interface ServerComputeProps {
  vpcData: vpc.DataAwsVpc
  privateSubnets: vpc.DataAwsSubnets
  instanceProfile: iam.DataAwsIamInstanceProfile
  defaultTag: string
}

interface MakeInstanceOptions {
  ami: ssm.DataAwsSsmParameter
  defaultTag: string
  subnetId: string
  sg: vpc.SecurityGroup
  id: string
  instanceProfile: iam.DataAwsIamInstanceProfile
}

export class ServerCompute extends Resource {
  constructor(
    readonly scope: Construct,
    readonly name: string,
    { privateSubnets, vpcData, defaultTag, instanceProfile }: ServerComputeProps
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

    // TODO: This causes the error message below:
    // The "for_each" set includes values derived from resource attributes that
    // cannot be determined until apply, and so Terraform cannot determine the
    // full set of keys that will identify the instances of this resource.
    //
    // When working with unknown values in for_each, it's better to use a map
    // value where the keys are defined statically in your configuration and where
    // only the values contain apply-time results.
    //
    // Alternatively, you could use the -target planning option to first apply
    // only the resources that the for_each value depends on, and then apply a
    // second time to fully converge.
    //const privateSubnetIterator = TerraformIterator.fromList(privateSubnets.ids)

    this.#makeInstance({
      ami,
      defaultTag,
      subnetId: Fn.element(privateSubnets.ids, 0),
      sg,
      id: 'compute1',
      instanceProfile,
    })

    this.#makeInstance({
      ami,
      defaultTag,
      subnetId: Fn.element(privateSubnets.ids, 1),
      sg,
      id: 'compute2',
      instanceProfile,
    })
  }

  #makeInstance({
    ami,
    defaultTag,
    subnetId,
    sg,
    id,
    instanceProfile,
  }: MakeInstanceOptions): void {
    new ec2.Instance(
      this,
      uniqueId({
        prefix: ec2.Instance,
        suffix: `compute_${id}`,
      }),
      {
        ami: ami.value,
        instanceType: 't2.micro',
        userData: Fn.filebase64(
          path.join(__dirname, '../../modules/artifacts/user-data.sh')
        ),
        vpcSecurityGroupIds: [sg.id],
        iamInstanceProfile: instanceProfile.name,
        subnetId,
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
