import { S3Handler } from "./Classes/S3Handler";

if (typeof process.env.UPLOADS_S3_BUCKET == "undefined") {
    throw new Error("Environment Variable `UPLOADS_S3_BUCKET` is not defined");
}

const s3Controller: S3Handler = new S3Handler(process.env.UPLOADS_S3_BUCKET, "us-west-2");

export { s3Controller };