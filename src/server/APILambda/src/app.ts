import express, { Express, NextFunction, Request, Response } from "express";
import fileUpload from "express-fileupload";

const CLOUDFRONT_KEY = process.env.CLOUDFRONT_KEY;

const app: Express = express();
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

import { router as client_routes } from "./Controller/routes/client_routes";
app.use("/", client_routes);

import { router as view_item_routes } from "./Controller/routes/view_item_routes";
app.use("/view", view_item_routes);

import { router as api_routes } from "./Controller/routes/api_routes";
app.use("/api", api_routes);


export default app;