import express, { Express, NextFunction, Request, Response } from "express";
import fileUpload from "express-fileupload";
import session from "express-session";
import { GrantType, setupKinde } from "@kinde-oss/kinde-node-express";

const CLOUDFRONT_KEY = process.env.CLOUDFRONT_KEY;

const KINDE_CONFIG = {
    clientId: "d82b979f46a94be7b60d827bd4413b58",
    issuerBaseUrl: "https://tycoonlover1359-dev.us.kinde.com",
    siteUrl: "http://localhost:8000",
    secret: "2Yrj6QRmdYP6kMoluvOY3aPRJ0bOAyr8QWwNO2Si4Go9rKJbUW",
    redirectUrl: "http://localhost:8000/kinde_callback",
    scope: "openid profile email",
    grantType: GrantType.AUTHORIZATION_CODE,
    unAuthorisedUrl: "http://localhost:8000/unauthorized",
    postLogoutRedirectUrl: "http://localhost:8000"
};


const app: Express = express();
setupKinde(KINDE_CONFIG, app);
app.use(express.json());
// app.set("trust proxy", 1);
// app.use(session({
//     secret: "alksdjlaskdjfhasjghlsakdfuasjdf",
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false }
// }));
app.use(fileUpload({
    limits: {
        fileSize: 128 * 1024 * 1024
    }
}));
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(req.path);

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

import { router as api_routes } from "./Controller/routes/api_routes";
app.use("/api", api_routes);

export default app;