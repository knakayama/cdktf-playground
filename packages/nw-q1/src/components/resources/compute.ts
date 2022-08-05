import { Construct } from 'constructs'
import { TerraformOutput, Resource } from 'cdktf'
import { ec2 } from '@cdktf/provider-aws'

export class Compute extends Resource {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    const instance = new ec2.Instance(this, 'compute', {
      ami: 'ami-01456a894f71116f2',
      instanceType: 't2.micro',
      tags: {
        Name: 'test',
      },
    })

    new TerraformOutput(this, 'public-ip', {
      value: instance.publicIp,
    })
  }
}
