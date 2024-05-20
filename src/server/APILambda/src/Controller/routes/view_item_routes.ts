import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import express, { Request, Response, Router, NextFunction } from "express";
import { Upload } from "../../Model/Upload";
import { UploadNotFoundError } from "../Classes/Errors";
import { s3Controller } from "../S3Controller";
import { render } from "../TemplateController";

const router: Router = express.Router();

router.get("/:userId/:uploadId", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const uploadId = req.params.uploadId;

    try {
        const uploadRecord = await Upload.get({
            userId: userId,
            uploadId: uploadId
        }).go();

        const filename = uploadRecord.data?.filename;

        if (uploadRecord == null || filename == null) {
            throw new UploadNotFoundError();
        }

        const [err, result] = await render(req, "view_item", {
            title: filename,
            rawLink: `/view/${userId}/${uploadId}/raw`
        });
        res.send(result);
    } catch (e) {
        if (e instanceof UploadNotFoundError) {
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

router.get("/:userId/:uploadId/action", async (req: Request, res: Response) => {
    res.send("action");
});

router.get("/:userId/:uploadId/:type", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const uploadId = req.params.uploadId;
    const type = req.params.type;

    try {
        if (type != "raw" && type != "thumbnail") {
            throw new UploadNotFoundError();
        }

        const uploadRecord = await Upload.get({
            userId: userId,
            uploadId: uploadId
        }).go();

        const filename = uploadRecord.data?.filename;

        if (uploadRecord.data == null || filename == null) {
            throw new UploadNotFoundError();
        }

        let key: string = "";
        if (type == "raw") {
            key = `${userId}/${uploadId}/${filename}`;
        } else if (type == "thumbnail") {
            key = `${userId}/${uploadId}/thumbnail.png`
        }
        const response = await s3Controller.getObject(key);
        
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