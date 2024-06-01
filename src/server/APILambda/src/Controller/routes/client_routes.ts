import express, { Request, Response, Router, NextFunction } from "express";
import { render } from "../TemplateController";
import { Upload } from "../../Model/Upload";
import { s3Controller } from "../S3Controller";
import { NoSuchKey } from "@aws-sdk/client-s3";

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    const [err, result] = await render(req, "home", { title: "Home" });
    res.send(result);
});

router.get("/login", async (req: Request, res: Response) => {
    const [err, result] = await render(req, "login", { title: "Login" });
    res.send(result);
});

router.get("/register", async (req: Request, res: Response) => {
    res.send("register")
});

router.get("/uploads/:userId", async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const uploads = [];

    const response = await Upload.query.byId({
        userId: userId
    }).go();


    let row = [];
    for (let i = 1; i <= response.data.length; i++) {
        const upload = response.data[i - 1];
        row.push({
            title: upload.title,
            urls: {
                thumbnail: upload.mimeType.includes("image/") ? `/uploads/${upload.userId}/${upload.uploadId}?type=thumbnail` : null,
                view: `/uploads/${upload.userId}/${upload.uploadId}`,
                edit: `/uploads/${upload.userId}/${upload.uploadId}/edit`
            }
        });
        if (i % 3 == 0) {
            uploads.push(row);
            row = [];
        }
    }
    if (row.length > 0) {
        uploads.push(row);
    }

    const [err, result] = await render(req, "uploads", { title: "Uploads", uploads: uploads });
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
            title: `${upload.data.title}`,
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