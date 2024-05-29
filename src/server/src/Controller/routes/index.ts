import express from "express";
import type { Request, Response, Router } from "express";


const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    res.send("Hello, world!");
});

export { router };