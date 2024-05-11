import * as cdk from 'aws-cdk-lib';
import {
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
                "UPLOADS_DYNAMODB_TABLE": dbTable.tableName
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
