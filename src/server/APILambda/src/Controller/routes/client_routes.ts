import express, { Request, Response, Router, NextFunction } from "express";
import { render } from "../TemplateController";

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    const [err, result] = await render(req, "home");
    res.send(result);
});

router.get("/login", async (req: Request, res: Response) => {
    const [err, result] = await render(req, "login");
    res.send(result);
});

router.get("/register", async (req: Request, res: Response) => {
    res.send("register")
});

router.get("/uploads", async (req: Request, res: Response) => {
    const uploads = [];

    let row = [];
    for (let i = 1; i <= 20; i++) {
        row.push({
            urls: {
                thumbnail: `/static/Thumbnail Test.png`,
                view: `/uploads/${i}`,
                edit: `/uploads/${i}/edit`,
            },
            title: `upload ${i}`
        });
        if (i % 6 == 0) {
            uploads.push(row);
            row = [];
        }
    }
    if (row.length > 0) {
        uploads.push(row);
    }

    const [err, result] = await render(req, "uploads", { uploads: uploads });
    res.send(result);
});

router.get("/uploads/:uploadId", async (req: Request, res: Response) => {
    console.log(req.params.uploadId);
    res.send("view upload");
});

export { router };