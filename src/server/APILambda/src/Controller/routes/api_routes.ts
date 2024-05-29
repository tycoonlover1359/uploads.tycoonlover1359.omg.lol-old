import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import express, { NextFunction, Request, Response } from "express";
import sharp from "sharp";
import { Snowflake } from "@theinternetfolks/snowflake";
import { UploadedFile } from "express-fileupload";
import { Upload } from "../../Model/Upload";

const S3_BUCKET = process.env.UPLOADS_S3_BUCKET;
const BASE_URL = process.env.UPLOADS_BASE_URL?.endsWith("/") ? process.env.UPLOADS_BASE_URL : `${process.env.UPLOADS_BASE_URL}/`
const EPOCH = process.env.UPLOADS_EPOCH || "2024-01-01T00:00:00+00:00"
const AUTH_KEY = process.env.UPLOADS_AUTH_KEY;

const router = express.Router();
const s3Client = new S3Client({
    region: "us-west-2"
});
Snowflake.EPOCH = new Date(EPOCH).valueOf();

router.use((req: Request, res: Response, next: NextFunction) => {
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
    next();
});

router.post("/upload", async (req: Request, res: Response) => {    
    if (req.files == null || req.files.data == null) {
        res.status(400).send({
            "success": false,
            "error": "Required body data missing"
        });
        return;
    }

    let uploadedData: UploadedFile;

    if (Array.isArray(req.files.data)) {
        uploadedData = req.files.data[0];
    } else {
        uploadedData = req.files.data;
    }

    // todo:
    // 1. create unique snowflake id for the file
    const uploadId = Snowflake.generate();

    const userId = "51452077936190346";

    // // 2.1 upload the attachment to s3 with the given snowflake as the key\
    const response = await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: `uploads/${userId}/${uploadId}/${uploadedData.name}`,
        Body: uploadedData.data
    }));

    // // 2.2 create a thumbnail image and upload it as well
    await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: `uploads/${userId}/${uploadId}/thumbnail.png`,
        Body: await sharp(uploadedData.data).resize(200).toFormat("png").toBuffer()
    }))

    // // 3. create a record in dynamodb with the snowflake and original filename
    const record = await Upload.create({
        userId: userId,
        uploadId: uploadId,
        mimeType: uploadedData.mimetype,
        filename: uploadedData.name,
        title: uploadedData.name,
    }).go();
    
    // 4. generate and return the urls for that attachment
    const url = BASE_URL + "uploads/" + `${userId}/${uploadId}`;
    const thumbnail = BASE_URL + "uploads/" + `${userId}/${uploadId}?type=thumbnail`;
    // const delete_url = BASE_URL + `${userId}/${uploadId}/delete`;

    res.status(200).send({
        "success": true,
        "urls": {
            "url": url,
            "thumbnail": thumbnail,
            // "delete": delete_url
        }
    });
});

export { router };