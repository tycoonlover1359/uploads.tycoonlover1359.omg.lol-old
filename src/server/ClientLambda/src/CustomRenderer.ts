import ejs from "ejs";

export interface Renderer {
    render(view: string, data?: object): Promise<[Error | null, string]>;
}

export class FileSystemRenderer implements Renderer {
    public readonly rootDir: string;
    public readonly extension: string;

    constructor(rootDir: string, extension?: string) {
        this.rootDir = rootDir;
        this.extension = extension || "ejs";
    }

    public async render(view: string, data?: object): Promise<[Error | null, string]> {
        if (!data) {
            data = {};
        }
    
        data = {
            render: async (v: string, d?: object) => (await this.render(v, d))[1],
            ...data
        }
        try {
            const html = await ejs.renderFile(`${this.rootDir}/${view}.${this.extension}`, data, { async: true });
            // console.log(html);
            return [null, html];
        } catch (e) {
            const err = e as Error;
            console.log(err);
            return [err, `<pre>${err.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`];
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