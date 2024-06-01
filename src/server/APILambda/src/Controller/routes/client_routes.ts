import express, { Request, Response, Router, NextFunction } from "express";
import { render } from "../TemplateController";
import { Upload } from "../../Model/Upload";
import { s3Controller } from "../S3Controller";
import { NoSuchKey } from "@aws-sdk/client-s3";

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    const [err, result] = await render(req, "home");
    res.send(result);
});

router.get("/login", async (req: Request, res: Response) => {
    const [err, result] = await render(req, "login");
    res.send(result);
});

router.get("/register", async (req: Request, res: Response) => {
    res.send("register")
});

router.get("/uploads", async (req: Request, res: Response) => {
    const uploads = [];

    let row = [];
    for (let i = 1; i <= 20; i++) {
        row.push({
            urls: {
                thumbnail: `/static/Thumbnail Test.png`,
                view: `/uploads/${i}`,
                edit: `/uploads/${i}/edit`,
            },
            title: `upload ${i}`
        });
        if (i % 6 == 0) {
            uploads.push(row);
            row = [];
        }
    }
    if (row.length > 0) {
        uploads.push(row);
    }

    const [err, result] = await render(req, "uploads", { uploads: uploads });
    res.send(result);
});

router.get("/uploads/:userId/:uploadId", async (req: Request, res: Response) => {
    console.log(`getting upload ${req.params.userId}/${req.params.uploadId}`)
    const upload = await Upload.get({
        userId: req.params.userId,
        uploadId: req.params.uploadId
    }).go();

    if (upload.data == null) {
        console.log("upload is null")
        const [err, result] = await render(req, "errors/404");
        res.status(404).send(result);
        return;
    }
    console.log("got upload");

    const type = req.query.type ? req.query.type : null;

    if (type) {
        console.log(`type is: ${type}`)
        const mimeType = upload.data.mimeType;
        if (mimeType.includes("image/")) {
            console.log("item is image; sending raw")
            let key: string;
            if (type === "raw") {
                key = `uploads/${req.params.userId}/${req.params.uploadId}/${upload.data.filename}`;
            } else if (type === "thumbnail") {
                key = `uploads/${req.params.userId}/${req.params.uploadId}/thumbnail.png`;
            } else {
                const [err, result] = await render(req, "errors/404");
                res.status(404).send(result);
                return;
            }
    
            try {
                const response = await s3Controller.getObject(key);
                res.status(200).contentType(upload.data.mimeType).end(await response.Body?.transformToByteArray(), "binary");
            } catch (e) {
                const err = e as Error;
                if (e instanceof NoSuchKey) {
                    const [err, result] = await render(req, "errors/404");
                    res.status(404).send(result);
                } else {
                    res.sendStatus(500);
                }
            } finally {
                return;
            }
        } else if (mimeType.includes("text/")) {
            if (type == "raw") {
                const response = await s3Controller.getObject(`uploads/${req.params.userId}/${req.params.uploadId}/${upload.data.filename}`);
                res.contentType(upload.data.mimeType).end(await response.Body?.transformToString());
            }
        }
    } else {
        console.log("no type; sending user page");
        const [err, result] = await render(req, "view_item", {
            title: `Test.png`,
            mimeType: upload.data.mimeType,
            links: {
                raw: `/uploads/${req.params.userId}/${req.params. uploadId}?type=raw`
            }
        });
    
        res.send(result);
    }
});

// router.get("/uploads/:userId/:uploadId/raw", async (req: Request, res: Response) => {
//     const upload = await Upload.get({
//         userId: req.params.userId,
//         uploadId: req.params.uploadId
//     }).go();

//     if (upload.data == null) {
//         const [err, result] = await render(req, "errors/404");
//         res.status(404).send(result);
//         return;
//     }


// });

export { router };