import app from "./src/app";

const port = process.env.PORT || 8000;

app.listen(port, () => {
    console.log(`Server listening to http://localhost:${port}`);
});