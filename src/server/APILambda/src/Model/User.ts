import { Entity } from "electrodb";
import { client } from "./DynamoDBClient";

const DYNAMODB_TABLE = `${process.env.UPLOADS_DYNAMODB_TABLE}`;

const User = new Entity(
    {
        model: {
            entity: "user",
            version: "1",
            service: "uploads"
        },
        attributes: {
            userId: {
                type: "string",
                required: true,
                readOnly: true
            },
            passwordHash: {
                type: "string",
                required: true
            },
            apiKey: {
                type: "string"
            },
            apiKeyActive: {
                type: "boolean",
                required: true
            }
        },
        indexes: {

        }
    },
    { table: DYNAMODB_TABLE, client: client }
);

export { User };