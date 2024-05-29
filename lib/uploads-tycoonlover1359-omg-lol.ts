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

export class UploadsTycoonlover1359OmgLolStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Main Bucket
        const uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true
        });

        // DynamoDB table
        const uploadsTable = new dynamodb.TableV2(this, "UploadsTable", {
            partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
            billing: dynamodb.Billing.provisioned({
                readCapacity: dynamodb.Capacity.autoscaled({ maxCapacity: 1 }),
                writeCapacity: dynamodb.Capacity.autoscaled({ maxCapacity: 1 })
            }),
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // Cloudfront header added to each request from Cloudfront
        const CLOUDFRONT_KEY = "01a5ff63-13d3-41dc-87e2-d4c6dad1c975";

        // Lambda Environment Variables
        const lambdaEnvironment = {
            "UPLOADS_AUTH_KEY": "asdlfkjasdf",
            "UPLOADS_S3_BUCKET": uploadsBucket.bucketName,
            "UPLOADS_DYNAMODB_TABLE": uploadsTable.tableName,
            "UPLOADS_BASE_URL": "d3bd5go3u17xxn.cloudfront.net",
            "CLOUDFRONT_KEY": CLOUDFRONT_KEY
        };

        // Uploads assets to the bucket
        const assets = new s3_deployment.BucketDeployment(this, "APILambdaAssets", {
            sources: [
                s3_deployment.Source.asset("src/server/APILambda/src/View/static")
            ],
            destinationBucket: uploadsBucket,
            destinationKeyPrefix: "assets/static"
        });

        // ----------
        // API Lambda
        // ----------

        // Cloudwatch Log Group
        const apiLambdaFnLogs = new logs.LogGroup(this, "APILambdaLogs", {
            retention: logs.RetentionDays.INFINITE,
            removalPolicy: cdk.RemovalPolicy.DESTROY
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

        // Lambda Web Adapter layer
        const lambdaWebAdapterX86 = lambda.LayerVersion.fromLayerVersionArn(this, "LambdaAdapterLayerX86", `arn:aws:lambda:${this.region}:753240598075:layer:LambdaAdapterLayerX86:22`);

        // Sharp layer
        const sharpX86 = new lambda.LayerVersion(this, "SharpLayerX86", {
            code: lambda.Code.fromAsset("src/layers/sharp/x86"),
            compatibleArchitectures: [
                lambda.Architecture.X86_64
            ]
        });

        // Lambda function
        const apiLambdaFn = new lambda.Function(this, "APILambda", {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset("src/server/APILambda", {
                exclude: [
                    "node_modules",
                    "**/**.ts",
                    "**/**.env",
                    "bun.lockb",
                    "package*.json",
                    "src/View/static/**"
                ]
            }),
            handler: "run.sh",
            environment: {
                ...lambdaEnvironment,
                AWS_LAMBDA_EXEC_WRAPPER: "/opt/bootstrap",
                RUST_LOG: "info",
                PORT: "8080"
            },
            memorySize: 128,
            layers: [
                lambdaWebAdapterX86,
                sharpX86
            ],
            timeout: Duration.seconds(5),
            role: apiLambdaFnRole,
            logGroup: apiLambdaFnLogs
        });

        // Lambda function URL
        const apiLambdaFnUrl = apiLambdaFn.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE
        });

        // Cloudfront Distribution
        const cdn = new cloudfront.Distribution(this, "UploadsDistribution", {
            defaultBehavior: {
                origin: new origins.FunctionUrlOrigin(apiLambdaFnUrl, {
                    customHeaders: {
                        "ApiLambda-CloudfrontKey": CLOUDFRONT_KEY
                    }
                }),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                // cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED
                cachePolicy: new cloudfront.CachePolicy(this, "UploadsDistributionTestingCachePolicy", {
                    // headerBehavior: cloudfront.CacheHeaderBehavior.allowList("Authorization"),
                    queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList("type"),
                    minTtl: Duration.seconds(0),
                    maxTtl: Duration.days(1),
                    defaultTtl: Duration.minutes(0)
                })
            },
            additionalBehaviors: {
                "/static/*": {
                    origin: new origins.S3Origin(uploadsBucket, {
                        originPath: "assets/"
                    }),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
                },
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
