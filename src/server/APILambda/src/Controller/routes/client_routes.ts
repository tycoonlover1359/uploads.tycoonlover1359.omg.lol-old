import express, { Request, Response, Router, NextFunction } from "express";
import { render } from "../TemplateController";

const router: Router = express.Router();

router.use((req: Request, res: Response, next: NextFunction) => {
    res.append("Cache-Control", [`s-maxage=${0}`, /*`max-age=${0}`*/])
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

export { router };