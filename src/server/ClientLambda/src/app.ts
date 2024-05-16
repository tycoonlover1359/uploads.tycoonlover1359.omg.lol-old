import express, { Express, Request, Response, NextFunction } from "express";
import render from "./renderer";

const app: Express = express();

app.get("/", async (req: Request, res: Response) => {
    const [err, result] = await render("asdf");
    if (err) {
        res.status(500).send(err.message);
    } else {
        res.send(result);
    }
});

export default app;