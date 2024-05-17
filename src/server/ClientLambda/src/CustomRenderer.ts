import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

interface TemplateCache {
    [key: string]: string;
}

export class S3Renderer implements Renderer {
    public readonly bucket: string;
    public readonly keyPrefix: string;
    private readonly s3Client: S3Client;
    private readonly cache: TemplateCache;

    constructor(bucket: string, keyPrefix?: string, region?: string) {
        this.bucket = bucket;
        this.keyPrefix = keyPrefix || "";
        this.s3Client = new S3Client({
            region: region || "us-west-2"
        });
        this.cache = {};
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
            if (!this.cache[view]) {
                console.log(`making s3 request: ${this.keyPrefix}/${view}.ejs`);
                const command = new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: `${this.keyPrefix}/${view}.ejs`,
                });
    
                const response = await this.s3Client.send(command);    
                this.cache[view] = await response.Body?.transformToString() || "";
            }

            const html = await ejs.render(this.cache[view], data, { async: true });

            return [null, html];
        } catch (e) {
            const err = e as Error;
            console.log(err);
            return [err, `<pre>${err.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`];
        }
    }
}