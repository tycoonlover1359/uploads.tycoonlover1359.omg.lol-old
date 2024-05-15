import serverlessExpress from "@codegenie/serverless-express";
import app from "./src/app";

exports.handler = serverlessExpress({ app })