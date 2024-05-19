import { FileSystemRenderer, Renderer, S3Renderer } from "./Classes/Renderer";

let renderer: Renderer;

if (process.env.DEVELOPMENT == "true") {
    renderer = new FileSystemRenderer("src/View/templates");
} else {
   renderer = new S3Renderer(process.env.UPLOADS_S3_BUCKET as string, "assets/templates");
}

export { renderer };