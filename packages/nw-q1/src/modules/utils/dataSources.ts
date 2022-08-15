import { Construct } from 'constructs'
import { elb } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import { defaultTag } from './constants'

interface DataOptions {
  scope: Construct
  suffix: string
  tags?: {
    [id: string]: string
  }
}

export const loadBalancerData = ({
  scope,
  suffix,
  tags = {},
}: DataOptions): elb.DataAwsLb =>
  new elb.DataAwsLb(
    scope,
    uniqueId({
      prefix: elb.DataAwsLb,
      suffix,
    }),
    {
      tags: {
        Name: defaultTag,
      },
      ...tags,
    }
  )
