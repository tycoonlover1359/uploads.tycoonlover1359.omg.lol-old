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

export class UploadsTycoonlover1359OmgLol extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Main Bucket
        const uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
        });

        // DynamoDB table
        const uploadsTable = new dynamodb.TableV2(this, "UploadsTable", {
            partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
            billing: dynamodb.Billing.provisioned({
                readCapacity: dynamodb.Capacity.autoscaled({ maxCapacity: 1 }),
                writeCapacity: dynamodb.Capacity.autoscaled({ maxCapacity: 1 })
            })
        });

        // Cloudfront header added to each request from Cloudfront
        const CLOUDFRONT_KEY = "01a5ff63-13d3-41dc-87e2-d4c6dad1c975";

        // Lambda Environment Variables
        const lambdaEnvironment = {
            "UPLOADS_AUTH_KEY": "asdlfkjasdf",
            "UPLOADS_S3_BUCKET": uploadsBucket.bucketName,
            "UPLOADS_DYNAMODB_TABLE": uploadsTable.tableName,
            "UPLOADS_BASE_URL": "https://d1vixn6080s60f.cloudfront.net/",
            "CLOUDFRONT_KEY": CLOUDFRONT_KEY
        };

        // Uploads assets to the bucket
        const assets = new s3_deployment.BucketDeployment(this, "ClientLambdaAssets", {
            sources: [
                s3_deployment.Source.asset("src/server/ClientLambda/assets")
            ],
            destinationBucket: uploadsBucket,
            destinationKeyPrefix: "assets"
        });

        // ----------
        // API Lambda
        // ----------

        // Cloudwatch Log Group
        const apiLambdaFnLogs = new logs.LogGroup(this, "APILambdaLogs", {
            retention: logs.RetentionDays.INFINITE
        });

        // IAM Role
        const apiLambdaFnRole = new iam.Role(this, "APILambdaExecutionRole", {
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
                                uploadsTable.tableArn,
                                `${uploadsTable.tableArn}/index/*`
                            ]
                        }),
                        new iam.PolicyStatement({
                            actions: [
                                "s3:PutObject",
                                "s3:GetObject"
                            ],
                            resources: [
                                `${uploadsBucket.bucketArn}/*`
                            ]
                        }),
                        new iam.PolicyStatement({
                            actions: [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            resources: [
                                `${apiLambdaFnLogs.logGroupArn}`,
                                `${apiLambdaFnLogs.logGroupArn}:log-stream:*`
                            ]
                        })
                    ]
                })
            }
        });

        // Lambda function
        const apiLambdaFn = new lambda_nodejs.NodejsFunction(this, "APILambda", {
            entry: "src/server/APILambda/run_lambda.ts",
            handler: "index.handler",
            timeout: Duration.seconds(3),
            bundling: {
                minify: true
            },
            environment: lambdaEnvironment,
            role: apiLambdaFnRole,
            logGroup: apiLambdaFnLogs
        });

        // Lambda function URL
        const apiLambdaFnUrl = apiLambdaFn.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE
        });

        // ------------
        // ClientLambda
        // ------------

        // Cloudwatch logs
        const clientFnLogs = new logs.LogGroup(this, "ClientLambdaLogs", {
            retention: logs.RetentionDays.INFINITE
        });

        // IAM Role
        const clientFnRole = new iam.Role(this, "ClientLambdaExecutionRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            inlinePolicies: {
                "ApiLambdaExecutionPolicy": new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: [
                                "s3:PutObject",
                                "s3:GetObject"
                            ],
                            resources: [
                                `${uploadsBucket.bucketArn}/*`
                            ]
                        }),
                        new iam.PolicyStatement({
                            actions: [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            resources: [
                                `${clientFnLogs.logGroupArn}`,
                                `${clientFnLogs.logGroupArn}:log-stream:*`
                            ]
                        })
                    ]
                })
            }
        });

        // Lambda Function
        const clientFn = new lambda_nodejs.NodejsFunction(this, "ClientLambda", {
            entry: "src/server/ClientLambda/run_lambda.ts",
            handler: "index.handler",
            timeout: Duration.seconds(3),
            bundling: {
                minify: true
            },
            environment: lambdaEnvironment,
            role: apiLambdaFnRole,
            logGroup: apiLambdaFnLogs
        });

        // Lambda Function URL
        const clientFnUrl = clientFn.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE
        });

        // Cloudfront Distribution
        const cdn = new cloudfront.Distribution(this, "UploadsDistribution", {
            defaultBehavior: {
                origin: new origins.FunctionUrlOrigin(clientFnUrl, {
                    customHeaders: {
                        "ApiLambda-CloudfrontKey": CLOUDFRONT_KEY
                    }
                }),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
            },
            additionalBehaviors: {
                // "/static": {
                //     origin: new origins.S3Origin(bucket)
                // },
                "/api": {
                    origin: new origins.FunctionUrlOrigin(apiLambdaFnUrl, {
                        customHeaders: {
                            "ApiLambda-CloudfrontKey": CLOUDFRONT_KEY
                        }
                    }),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
                }
            },
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100
        });

        // Outputs
        new cdk.CfnOutput(this, "DynamodbTable", {
            value: uploadsTable.tableName
        });
        new cdk.CfnOutput(this, "S3Bucket", {
            value: uploadsBucket.bucketName
        });
        new cdk.CfnOutput(this, "CloudfrontDistribution", {
            value: cdn.domainName
        });
    }
}