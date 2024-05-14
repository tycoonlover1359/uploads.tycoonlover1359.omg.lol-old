import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import express, { Request, Response } from "express";
import { Snowflake } from "@theinternetfolks/snowflake";
import { UploadedFile } from "express-fileupload";
import { Upload } from "./models";
import { UploadNotFoundError } from "./errors";

const S3_BUCKET = process.env.UPLOADS_S3_BUCKET;
const BASE_URL = process.env.UPLOADS_BASE_URL?.endsWith("/") ? process.env.UPLOADS_BASE_URL : `${process.env.UPLOADS_BASE_URL}/`
const EPOCH = process.env.UPLOADS_EPOCH || "2024-01-01T00:00:00+00:00"

const router = express.Router();
const s3Client = new S3Client({
    region: "us-west-2"
});
Snowflake.EPOCH = new Date(EPOCH).valueOf();

router.get("/:userId/:uploadId/:fileName", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const uploadId = req.params.uploadId;
    const fileName = req.params.fileName;

    const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: `${userId}/${uploadId}/${fileName}`
    });

    try {
        const uploadRecord = await Upload.get({
            userId: userId,
            uploadId: uploadId
        }).go();

        if (uploadRecord.data == null) {
            throw new UploadNotFoundError();
        }

        const response = await s3Client.send(command);
        // console.log(response);
        // res.status(200).send(response.Body?.transformToByteArray());
        res.status(200).contentType(uploadRecord.data.mimeType).end(await response.Body?.transformToByteArray(), "binary");
    } catch (e) {
        if (e instanceof NoSuchKey || e instanceof UploadNotFoundError) {
            res.status(404).send({
                "success": false,
                "error": "Item not found"
            });
        } else {
            console.log(e);
            res.status(500).send({
                "sucess": false,
                "error": "Internal server error"
            });
        }
    }
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
    const url = BASE_URL + `asdf/${uploadId}/${uploadedData.name}`;
    // const delete_url = BASE_URL + `asdf/${uploadId}/delete`;

    res.status(200).send({
        "success": true,
        "urls": {
            "url": url,
            // "thumbnail": BASE_URL + `example_url/thumbnail`,
            // "delete": delete_url
        }
    });
});

export default router;