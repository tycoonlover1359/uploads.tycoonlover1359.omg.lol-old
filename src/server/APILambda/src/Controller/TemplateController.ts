import { FileSystemRenderer, Renderer, S3Renderer } from "./Classes/Renderer";
import { s3Controller } from "./S3Controller";

let renderer: Renderer;

if (process.env.DEVELOPMENT == "true") {
    renderer = new FileSystemRenderer("src/View/templates");
} else {
    renderer = new S3Renderer({
        s3Handler: s3Controller,
        keyPrefix: "assets/templates"
    })
}

export { renderer };