import express, { Request, Response, Router, NextFunction } from "express";
import { FileSystemRenderer, Renderer, S3Renderer } from "./CustomRenderer";

const router: Router = express.Router();

let renderer: Renderer;

if (process.env.DEVELOPMENT == "true") {
    renderer = new FileSystemRenderer("assets/templates");
} else {
    renderer = new S3Renderer("asdlfkj");
}

async function render(req: Request, res: Response, view: string, data?: object) {
    if (!data) {
        data = {};
    }

    let err, result;
    if (req.headers["hx-request"]) {
        [err, result] = await renderer.render(view, data);
    } else {
        [err, result] = await renderer.render("base", { view: (await renderer.render(view, data))[1] });
    }
    
    if (err) {
        res.status(500);
    }
    res.send(result);
}

router.get("/", async (req: Request, res: Response) => {

    render(req, res, "home");

    // const view = "home";
    // let err, result;
    // if (req.headers["hx-request"]) {
    //     [err, result] = await renderer.render(view);
    // } else {
    //     [err, result] = await renderer.render("index", { view: (await renderer.render(view))[1] });
    // }

    // if (err) {
    //     res.status(500);
    // }
    // res.send(result);
});

router.get("/login", async (req: Request, res: Response) => {

    render(req, res, "login");

    // const view = "login";
    // let err, result;
    // if (req.headers["hx-request"]) {
    //     [err, result] = await renderer.render(view);
    // } else {
    //     [err, result] = await renderer.render("index", { view: (await renderer.render(view))[1] });
    // }

    // if (err) {
    //     res.status(500);
    // }
    // res.send(result);
});

export default router;