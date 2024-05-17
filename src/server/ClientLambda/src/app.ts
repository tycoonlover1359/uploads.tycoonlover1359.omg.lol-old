import express, { Express, Request, Response, NextFunction } from "express";

const CLOUDFRONT_KEY = process.env.CLOUDFRONT_KEY;

const app: Express = express();

app.use(express.json());
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