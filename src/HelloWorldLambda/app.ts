import express, { Express, Request, Response } from "express";

const app = express();

app.get("/", (req: Request, res: Response) => {
    res.send(`hello from aws lambda deploy by the cdk! env: ${process.env.PICS_DYNAMODB_TABLE}`);
});

export default app;