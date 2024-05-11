// import fs from "node:fs";
import express, { Express, Request, Response } from "express";
import fileUpload, { UploadedFile } from "express-fileupload";

const AUTH_KEY = process.env.UPLOADS_AUTH_KEY;
const S3_BUCKET = process.env.UPLOADS_S3_BUCKET;
const DYNAMODB_TABLE = process.env.UPLOADS_DYNAMODB_TABLE;
const BASE_URL = process.env.UPLOADS_BASE_URL?.endsWith("/") ? process.env.UPLOADS_BASE_URL : `${process.env.UPLOADS_BASE_URL}/`

const app = express();

app.use(express.json());
app.use(fileUpload({
    limits: {
        fileSize: 128 * 1024 * 1024
    }
}));

app.post("/upload", (req: Request, res: Response) => {
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
    console.log(uploadedData);
    // fs.writeFile(`./${uploadedData.name}`, uploadedData.data, (err) => {
    //     console.error(err);
    // });

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