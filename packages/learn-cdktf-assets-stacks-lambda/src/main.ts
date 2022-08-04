import * as path from 'path'
import { Construct } from 'constructs'
import {
  App,
  TerraformStack,
  TerraformOutput,
  AssetType,
  TerraformAsset,
} from 'cdktf'
import * as aws from '@cdktf/provider-aws'
import * as random from '@cdktf/provider-random'

interface LambdaFunctionConfig {
  path: string
  handler: string
  runtime: string
  stageName: string
  version: string
}

const lambdaRolePolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Action: 'sts:AssumeRole',
      Principal: {
        Service: 'lambda.amazonaws.com',
      },
      Effect: 'Allow',
      Sid: '',
    },
  ],
}

class LambdaStack extends TerraformStack {
  constructor(scope: Construct, name: string, config: LambdaFunctionConfig) {
    super(scope, name)

    new aws.AwsProvider(this, 'aws', {
      region: 'us-west-2',
    })

    new random.RandomProvider(this, 'random')

    const pet = new random.Pet(this, 'random-name', {
      length: 2,
    })

    const asset = new TerraformAsset(this, 'lambdaAsset', {
      path: path.resolve(__dirname, config.path),
      type: AssetType.ARCHIVE,
    })

    const bucket = new aws.s3.S3Bucket(this, 'bucket', {
      bucketPrefix: `learn-cdktf-${name}`,
    })

    const lambdaArchive = new aws.s3.S3Object(this, 'lambdaArchive', {
      bucket: bucket.bucket,
      key: `${config.version}/${asset.fileName}`,
      source: asset.path,
    })

    const role = new aws.iam.IamRole(this, 'lambdaExec', {
      name: `learn-cdktf-${name}-${pet.id}`,
      assumeRolePolicy: JSON.stringify(lambdaRolePolicy),
    })

    new aws.iam.IamRolePolicyAttachment(this, 'lambdaManagedPolicy', {
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      role: role.name,
    })

    const lambdaFunc = new aws.lambdafunction.LambdaFunction(
      this,
      'learnCDKTFLambda',
      {
        functionName: `learn-cdktf-${name}-${pet.id}`,
        s3Bucket: bucket.bucket,
        s3Key: lambdaArchive.key,
        handler: config.handler,
        runtime: config.runtime,
        role: role.arn,
      }
    )

    const api = new aws.apigatewayv2.Apigatewayv2Api(this, 'apiGW', {
      name,
      protocolType: 'HTTP',
      target: lambdaFunc.arn,
    })

    new TerraformOutput(this, 'url', {
      value: api.apiEndpoint,
    })
  }
}

const app = new App()

new LambdaStack(app, 'lambdaHelloWorld', {
  path: './lambda-hello-world/dist',
  handler: 'index.handler',
  runtime: 'nodejs14.x',
  stageName: 'hello-world',
  version: 'v0.0.2',
})

new LambdaStack(app, 'lambdaHelloName', {
  path: './lambda-hello-name/dist',
  handler: 'index.handler',
  runtime: 'nodejs14.x',
  stageName: 'hello-name',
  version: 'v0.0.1',
})

app.synth()
