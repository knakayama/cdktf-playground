import { Construct } from 'constructs'
import { TerraformStack } from 'cdktf'
import { AwsProvider } from '@cdktf/provider-aws'
import { awsRegion } from '../../modules/utils'
import { Network } from '../resources/network'
import { Compute } from '../resources/compute'

export class NWQ1Stack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    new AwsProvider(this, 'aws', {
      region: awsRegion(),
    })

    new Network(this, 'network')
    new Compute(this, 'compute')
  }
}
