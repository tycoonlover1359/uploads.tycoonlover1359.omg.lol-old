import express, { Request, Response, Router, NextFunction } from "express";
import { FileSystemRenderer, Renderer, S3Renderer } from "./CustomRenderer";

const router: Router = express.Router();

let renderer: Renderer;

if (process.env.DEVELOPMENT == "true") {
    renderer = new FileSystemRenderer("assets/templates");
} else {
    renderer = new S3Renderer(process.env.UPLOADS_S3_BUCKET as string, "assets/templates");
}

async function render(req: Request, view: string, data?: object): Promise<[Error | null, string]> {
    if (!data) {
        data = {};
    }

    let err, result;
    if (req.headers["hx-request"]) {
        [err, result] = await renderer.render(view, data);
    } else {
        [err, result] = await renderer.render("base", { body: (await renderer.render(view, data))[1] });
    }

    return [err, result];
}

router.use((req: Request, res: Response, next: NextFunction) => {
    res.append("Cache-Control", [`s-maxage=${0}`, `max-age=${15*60}`])
    next();
});

router.get("/", async (req: Request, res: Response) => {
    const [err, result] = await render(req, "home");
    res.send(result);
});

router.get("/login", async (req: Request, res: Response) => {
    const[err, result] = await render(req, "login");
    res.send(result);
});

export default router;