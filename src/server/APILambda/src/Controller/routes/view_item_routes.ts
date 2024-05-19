import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import express, { Request, Response, Router, NextFunction } from "express";
import { Upload } from "../../Model/Upload";
import { UploadNotFoundError } from "../Classes/Errors";

const S3_BUCKET = process.env.UPLOADS_S3_BUCKET;

const router: Router = express.Router();
const s3Client = new S3Client({
    region: "us-west-2"
});

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

export { router };