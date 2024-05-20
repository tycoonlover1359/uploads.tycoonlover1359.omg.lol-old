import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import express, { Request, Response, Router, NextFunction } from "express";
import { Upload } from "../../Model/Upload";
import { UploadNotFoundError } from "../Classes/Errors";
import { s3Controller } from "../S3Controller";
import { render } from "../TemplateController";

const router: Router = express.Router();

router.get("/:userId/:uploadId/:fileName", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const uploadId = req.params.uploadId;
    const fileName = req.params.fileName;

    try {
        const uploadRecord = await Upload.get({
            userId: userId,
            uploadId: uploadId
        }).go();

        if (uploadRecord.data == null) {
            throw new UploadNotFoundError();
        }

        const response = await s3Controller.getObject(`${userId}/${uploadId}/${fileName}`);
        
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

router.get("/", async (req: Request, res: Response) => {
    const [err, result] = await render(req, "view_item", {
        title: "title",
        rawLink: "/static/Test.png",
    });
    res.send(result);
});

export { router };