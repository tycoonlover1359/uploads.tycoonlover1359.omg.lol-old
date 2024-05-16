import ejs from "ejs";

export interface Renderer {
    render(view: string, data?: object): Promise<[Error | null, string]>;
}

export class FileSystemRenderer implements Renderer {
    public readonly rootDir: string;

    constructor(rootDir: string) {
        this.rootDir = rootDir;
    }

    public async render(view: string, data?: object): Promise<[Error | null, string]> {
        if (!data) {
            data = {};
        }
    
        try {
            const html = await ejs.renderFile(`${this.rootDir}/${view}.ejs`, data);
            return [null, html];
        } catch (err) {
            console.log(err);
            const html = "err";
            return [err as Error, html];
        }
    }
}

export class S3Renderer implements Renderer {
    public readonly bucket: string;

    constructor(bucket: string) {
        this.bucket = bucket;
    }

    public async render(view: string, data?: object): Promise<[Error | null, string]> {
        return [null, "s3renderer"];
    }
}


// async function render(view: string, data?: object): Promise<[Error | null, string]> {
    // if (!data) {
    //     data = {};
    // }

    // try {
    //     const html = await ejs.renderFile(`templates/${view}.ejs`, data);
    //     return [null, html];
    // } catch (err) {
    //     console.log(err);
    //     const html = "err";
    //     return [err as Error, html];
    // }
// }