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
    const [err, result] = await renderer.render("index", { title: "hello world from express/ejs!"});
    if (err) {
        res.status(500);
    }
    res.send(result);
});

export default router;