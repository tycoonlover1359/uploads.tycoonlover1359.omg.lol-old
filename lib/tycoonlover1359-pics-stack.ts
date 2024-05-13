import * as cdk from 'aws-cdk-lib';
import {
    aws_cloudfront_origins as origins,
    aws_cloudfront as cloudfront,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_lambda_nodejs as lambda_nodejs,
    aws_lambda as lambda,
    Duration
} from "aws-cdk-lib";
import { Construct } from 'constructs';

export class Tycoonlover1359PicsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const CLOUDFRONT_KEY = "01a5ff63-13d3-41dc-87e2-d4c6dad1c975";

        const bucket = new s3.Bucket(this, "UploadsBucket", {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });

        const dbTable = new dynamodb.TableV2(this, "UploadsTable", {
            partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
            billing: dynamodb.Billing.provisioned({
                readCapacity: dynamodb.Capacity.autoscaled({ maxCapacity: 1 }),
                writeCapacity: dynamodb.Capacity.autoscaled({ maxCapacity: 1 })
            })
        });

        const fn = new lambda_nodejs.NodejsFunction(this, "APILambda", {
            entry: "src/APILambda/lambda.ts",
            handler: "index.handler",
            timeout: Duration.seconds(3),
            bundling: {
                minify: true
            },
            environment: {
                "UPLOADS_AUTH_KEY": "asdlfkjasdf",
                "UPLOADS_S3_BUCKET": bucket.bucketName,
                "UPLOADS_DYNAMODB_TABLE": dbTable.tableName,
                "CLOUDFRONT_KEY": CLOUDFRONT_KEY
            }
        });

        const fnUrl = fn.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE
        });

        const cdn = new cloudfront.Distribution(this, "UploadsDistribution", {
            defaultBehavior: {
                origin: new origins.FunctionUrlOrigin(fnUrl, {
                    customHeaders: {
                        "ApiLambda-CloudfrontKey": CLOUDFRONT_KEY
                    }
                }),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
            }
        });

        new cdk.CfnOutput(this, "ApiLambdaFunctionURL", {
            value: fnUrl.url
        });
        new cdk.CfnOutput(this, "DynamodbTable", {
            value: dbTable.tableName
        });
        new cdk.CfnOutput(this, "S3Bucket", {
            value: bucket.bucketName
        });
        new cdk.CfnOutput(this, "CloudfrontDistribution", {
            value: cdn.domainName
        });
    }
}
