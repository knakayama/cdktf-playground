import { Construct } from 'constructs'
import { TerraformStack } from 'cdktf'
import { AwsProvider } from '@cdktf/provider-aws'
import { awsRegion, defaultTag } from '../../modules/constants'
import { Network } from '../resources/network'
import { DataSources } from '../resources/dataSources'
//import { Compute } from '../resources/compute'

export class NWQ1Stack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: {
        tags: {
          Name: defaultTag,
        },
      },
    })

    const dataSources = new DataSources(this, 'data-sources')

    new Network(this, 'network', {
      azs: dataSources.azs,
    })
    //new Compute(this, 'compute')
  }
}
