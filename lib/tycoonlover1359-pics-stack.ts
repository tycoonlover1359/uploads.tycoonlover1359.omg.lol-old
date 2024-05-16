import * as cdk from 'aws-cdk-lib';
import {
    aws_cloudfront_origins as origins,
    aws_cloudfront as cloudfront,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_lambda_nodejs as lambda_nodejs,
    aws_lambda as lambda,
    aws_logs as logs,
    aws_s3 as s3,
    aws_s3_deployment as s3_deployment,
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

        // const assets = new s3_deployment.BucketDeployment(this, "Deploy", {
            
        // });

        const dbTable = new dynamodb.TableV2(this, "UploadsTable", {
            partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
            billing: dynamodb.Billing.provisioned({
                readCapacity: dynamodb.Capacity.autoscaled({ maxCapacity: 1 }),
                writeCapacity: dynamodb.Capacity.autoscaled({ maxCapacity: 1 })
            })
        });

        const fnLogs = new logs.LogGroup(this, "APILambdaLogs", {
            retention: logs.RetentionDays.INFINITE
        });

        const fnRole = new iam.Role(this, "APILambdaExecutionRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            inlinePolicies: {
                "ApiLambdaExecutionPolicy": new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: [
                                "dynamodb:BatchGetItem",
                                "dynamodb:GetItem",
                                "dynamodb:BatchWriteItem",
                                "dynamodb:PutItem",
                                "dynamodb:Query",
                                "dynamodb:Scan",
                                "dynamodb:UpdateItem"
                            ],
                            resources: [
                                dbTable.tableArn,
                                `${dbTable.tableArn}/index/*`
                            ]
                        }),
                        new iam.PolicyStatement({
                            actions: [
                                "s3:PutObject",
                                "s3:GetObject"
                            ],
                            resources: [
                                `${bucket.bucketArn}/*`
                            ]
                        }),
                        new iam.PolicyStatement({
                            actions: [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            resources: [
                                `${fnLogs.logGroupArn}`,
                                `${fnLogs.logGroupArn}:log-stream:*`
                            ]
                        })
                    ]
                })
            }
        });

        const fn = new lambda_nodejs.NodejsFunction(this, "APILambda", {
            entry: "src/server/APILambda/run_lambda.ts",
            handler: "index.handler",
            timeout: Duration.seconds(3),
            bundling: {
                minify: true
            },
            environment: {
                "UPLOADS_AUTH_KEY": "asdlfkjasdf",
                "UPLOADS_S3_BUCKET": bucket.bucketName,
                "UPLOADS_DYNAMODB_TABLE": dbTable.tableName,
                "UPLOADS_BASE_URL": "https://d1vixn6080s60f.cloudfront.net/",
                "CLOUDFRONT_KEY": CLOUDFRONT_KEY
            },
            role: fnRole,
            logGroup: fnLogs
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
            },
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100
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
