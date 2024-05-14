import express, { NextFunction, Request, Response } from "express";
import fileUpload from "express-fileupload";

const CLOUDFRONT_KEY = process.env.CLOUDFRONT_KEY;

const app = express();
app.use(express.json());
app.use(fileUpload({
    limits: {
        fileSize: 128 * 1024 * 1024
    }
}));
app.use((req: Request, res: Response, next: NextFunction) => {
    if ((process.env.DEVELOPMENT != "true") && (req.headers["apilambda-cloudfrontkey"] != CLOUDFRONT_KEY)) {
        res.status(403).send({
            "success": false,
            "error": "Invalid Cloudfront Key"
        });
        return;
    }
    next();
});

import router from "./routes";
app.use("/", router);


export default app;