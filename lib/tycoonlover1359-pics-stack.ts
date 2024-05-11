import * as cdk from 'aws-cdk-lib';
import {
    aws_lambda_nodejs as lambda_nodejs,
    aws_lambda as lambda,
    Duration
} from "aws-cdk-lib";
import { Construct } from 'constructs';

export class Tycoonlover1359PicsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const fn = new lambda_nodejs.NodejsFunction(this, "HelloWorldLambda", {
            entry: "src/HelloWorldLambda/lambda.ts",
            handler: "index.handler",
            timeout: Duration.seconds(3),
            bundling: {
                minify: true
            }
        });

        const fnUrl = fn.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE
        });

        new cdk.CfnOutput(this, "HelloWorldLmabdaFunctionURL", {
            value: fnUrl.url
        });
    }
}
