import express, { Express } from "express";

const app: Express = express();

import { router as indexRoutes } from "./Controller/routes/index";
app.use("", indexRoutes);

export { app };