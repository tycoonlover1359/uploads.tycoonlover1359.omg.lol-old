import express, { Express, Request, Response, NextFunction } from "express";
import render from "./renderer";

const app: Express = express();

app.get("/", (req: Request, res: Response) => {
    res.send(render("view_path"));
});

export default app;