import express, { Express, NextFunction, Request, Response } from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Snowflake } from "@theinternetfolks/snowflake";

import { Upload } from "./models";

const AUTH_KEY = process.env.UPLOADS_AUTH_KEY;
const S3_BUCKET = process.env.UPLOADS_S3_BUCKET;
const BASE_URL = process.env.UPLOADS_BASE_URL?.endsWith("/") ? process.env.UPLOADS_BASE_URL : `${process.env.UPLOADS_BASE_URL}/`
const EPOCH = process.env.UPLOADS_EPOCH || "2024-01-01T00:00:00+00:00"
const CLOUDFRONT_KEY = process.env.CLOUDFRONT_KEY;

const app = express();
const s3Client = new S3Client({
    region: "us-west-2"
});
Snowflake.EPOCH = new Date(EPOCH).valueOf();

app.use(express.json());
app.use(fileUpload({
    limits: {
        fileSize: 128 * 1024 * 1024
    }
}));
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(req.method, req.path);
    next();
});

app.post("/upload", async (req: Request, res: Response) => {
    if ((process.env.IS_DEVELOPMENT != "true") && (req.headers["apilambda-cloudfrontkey"] != CLOUDFRONT_KEY)) {
        res.status(403).send({
            "success": false,
            "error": "Invalid Cloudfront Key"
        });
        return;
    }

    if (req.headers.authorization == null) {
        res.status(403).send({
            "success": false,
            "error": "No API Key provided"
        });
        return;
    }

    if (req.headers.authorization != AUTH_KEY) {
        res.status(401).send({
            "success": false,
            "error": "Invalid API Key"
        });
        return;
    }
    
    if (req.files == null || req.files.data == null) {
        res.status(400).send({
            "success": false,
            "error": "Required body data missing"
        });
        return;
    }

    const uploadedData = req.files.data as UploadedFile;

    // todo:
    // 1. create unique snowflake id for the file
    const uploadId = Snowflake.generate();
    // 2. upload the attachment to s3 with the given snowflake as the key
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: `asdf/${uploadId}/${uploadedData.name}`,
        Body: uploadedData.data
    });
    const response = await s3Client.send(command);
    // 3. create a record in dynamodb with the snowflake and original filename
    const record = await Upload.create({
        userId: "asdf",
        uploadId: uploadId,
        s3Key: `uploads/asdf/${uploadId}`,
        mimeType: uploadedData.mimetype,
        filename: uploadedData.name
    }).go();
    // 4. generate and return the urls for that attachment


    res.status(200).send({
        "success": true,
        "urls": {
            "url": BASE_URL + `example_url`,
            "thumbnail": BASE_URL + `example_url/thumbnail`,
            "delete": BASE_URL + `example_url/delete`
        }
    });
});

export default app;