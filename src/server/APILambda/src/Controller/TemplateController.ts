import { Request, Response, Router, NextFunction } from "express";
import { FileSystemRenderer, Renderer } from "./Classes/Renderer";
import { s3Controller } from "./S3Controller";

let renderer: Renderer;

renderer = new FileSystemRenderer("src/View/templates");

async function render(req: Request, view: string, data?: object): Promise<[Error | null, string]> {
    if (!data) {
        data = {};
    }

    let err, result;
    if (req.headers["hx-boosted"]) {
        [err, result] = await renderer.render(view, data);
    } else {
        [err, result] = await renderer.render("base", { body: (await renderer.render(view, data))[1] });
    }

    return [err, result];
}

export { renderer, render };