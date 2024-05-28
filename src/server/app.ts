import express, { Express, Request, Response } from "express";

const app = express();
const port = process.env.PORT || "8000";

app.get("/", (req: Request, res: Response) => {
    res.send("Hello from Express via AWS Lambda!");
});

app.get("/hello", (req: Request, res: Response) => {
    res.send("Hello!");
});

app.get("/test", (req: Request, res: Response) => {
    const name = req.query.name;

    if (name) {
        res.send(`Hello, ${name}!`);
    } else {
        res.send("Name not defined.");
    }
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});