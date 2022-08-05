import { Construct } from 'constructs'
import { Resource } from 'cdktf'
import { vpc } from '@cdktf/provider-aws'

export class Network extends Resource {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    new vpc.Vpc(this, 'this', {
      cidrBlock: '192.168.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
    })
  }
}
