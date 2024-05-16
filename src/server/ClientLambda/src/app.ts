import express, { Express, Request, Response, NextFunction } from "express";

const app: Express = express();

if (process.env.DEVELOPMENT == "true") {
    console.log("using static");
    app.use(express.static("assets/static"));
}

import router from "./routes";
app.use("/", router);

export default app;