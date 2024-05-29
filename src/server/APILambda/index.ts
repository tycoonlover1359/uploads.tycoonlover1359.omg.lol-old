import express from "express";
import app from "./src/app";

const port = process.env.PORT || 8000;

console.log("using static");
app.use("/static", express.static("src/View/static"));

app.listen(port, () => {
    console.log(`Server listening to http://localhost:${port}`);
});