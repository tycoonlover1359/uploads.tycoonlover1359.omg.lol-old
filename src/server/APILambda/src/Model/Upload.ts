import { Entity } from "electrodb";
import { client } from "./DynamoDBClient";

const DYNAMODB_TABLE = `${process.env.UPLOADS_DYNAMODB_TABLE}`;

const Upload = new Entity(
    {
        model: {
            entity: "upload",
            version: "1",
            service: "uploads"
        },
        attributes: {
            userId: {
                type: "string"
            },
            uploadId: {
                type: "string"
            },
            s3Key: {
                type: "string",
                required: true
            },
            mimeType: {
                type: "string",
                required: true
            },
            filename: {
                type: "string",
                required: true
            }
        },
        indexes: {
            byId: {
                pk: {
                    field: "PK",
                    composite: ["userId"]
                },
                sk: {
                    field: "SK",
                    composite: ["uploadId"]
                }
            },
        }
    },
    { table: DYNAMODB_TABLE, client: client }
)

export { Upload };