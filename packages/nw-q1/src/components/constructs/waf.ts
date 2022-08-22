import { Construct } from 'constructs'
import { Fn } from 'cdktf'
import { elb, wafv2 } from '@cdktf/provider-aws'
import { uniqueId } from '@cdktf-playground/core/src'
import { defaultTag } from '../../modules/utils/constants'
import { DataHttp } from '../../.gen/providers/http'

interface WafProps {
  loadBalancer: elb.DataAwsLb
}

export class Waf extends Construct {
  constructor(
    readonly scope: Construct,
    readonly name: string,
    { loadBalancer }: WafProps
  ) {
    super(scope, name)

    const ipSet = new wafv2.Wafv2IpSet(
      this,
      uniqueId({
        prefix: wafv2.Wafv2IpSet,
        suffix: 'lb',
      }),
      {
        name: defaultTag,
        ipAddressVersion: 'IPV4',
        scope: 'REGIONAL',
        addresses: [
          Fn.chomp(
            `${
              new DataHttp(
                this,
                uniqueId({
                  prefix: DataHttp,
                  suffix: 'this',
                }),
                {
                  url: 'http://ipv4.icanhazip.com',
                }
              ).body
            }/32`
          ),
        ],
      }
    )

    const webAcl = new wafv2.Wafv2WebAcl(
      this,
      uniqueId({
        prefix: wafv2.Wafv2WebAcl,
        suffix: 'this',
      }),
      {
        name: defaultTag,
        scope: 'REGIONAL',
        defaultAction: {
          allow: {},
        },
        rule: [
          {
            name: defaultTag,
            priority: 0,
            statement: {
              ipSetReferenceStatement: {
                arn: ipSet.arn,
              },
            },
            action: {
              block: {
                customResponse: {
                  responseCode: 403,
                  responseHeader: [
                    {
                      name: 'X-MY-HEADER',
                      value: 'true',
                    },
                  ],
                },
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              sampledRequestsEnabled: true,
              metricName: defaultTag,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          sampledRequestsEnabled: true,
          metricName: defaultTag,
        },
      }
    )

    new wafv2.Wafv2WebAclAssociation(
      this,
      uniqueId({
        prefix: wafv2.Wafv2WebAclAssociation,
        suffix: 'this',
      }),
      {
        resourceArn: loadBalancer.arn,
        webAclArn: webAcl.arn,
      }
    )
  }
}
