import express, { Request, Response, Router, NextFunction } from "express";
import { render } from "../TemplateController";

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    const [err, result] = await render(req, "home");
    res.send(result);
});

router.get("/login", async (req: Request, res: Response) => {
    const[err, result] = await render(req, "login");
    res.send(result);
});

router.get("/register", async (req: Request, res: Response) => {
    res.send("register")
});

router.get("/uploads", async (req: Request, res: Response) => {
    res.send("uploads");
});

router.get("/:uploadId", async (req: Request, res: Response) => {
    res.send("view upload");
});

export { router };