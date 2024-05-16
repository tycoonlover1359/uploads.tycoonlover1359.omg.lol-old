import express, { Request, Response, Router, NextFunction } from "express";
import { FileSystemRenderer, Renderer, S3Renderer } from "./CustomRenderer";

const router: Router = express.Router();

let renderer: Renderer;

if (process.env.DEVELOPMENT == "true") {
    renderer = new FileSystemRenderer("assets/templates");
} else {
    renderer = new S3Renderer("asdlfkj");
}

router.get("/", async (req: Request, res: Response) => {
    const [err, result] = await renderer.render("index");
    if (err) {
        res.status(500).send(err.message);
    } else {
        res.send(result);
    }
});

export default router;