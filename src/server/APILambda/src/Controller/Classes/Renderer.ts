import fs from "node:fs/promises";
import ejs from "ejs";
import { S3Handler } from "./S3Handler";

/**
 * Required interface for all template renders
 */
export interface Renderer {
    /**
     * Renders a view with the provided data
     * 
     * @param view The view to render
     * @param data The data to pass the view
     * @returns A promose that resolves to an error or the rendered template
     */
    render(view: string, data?: object): Promise<[Error | null, string]>;
}

/**
 * A renderer that uses the filesystem for template storage.
 */
export class FileSystemRenderer implements Renderer {
    /**
     * The root directory to search for templates
     */
    public readonly rootDir: string;
    
    /**
     * The file extension that templates use
     */
    public readonly extension: string;

    /**
     * Instantiates a new `FileSystemRenderer`
     * 
     * @param rootDir The root directory to search for templates
     * @param extension The file extension that templates use
     */
    constructor(rootDir: string, extension?: string) {
        this.rootDir = rootDir;
        this.extension = extension || "ejs";
    }

    /**
     * Renders a view with the provided data
     * 
     * @param view The view to render
     * @param data The data to pass the view
     * @returns A promise that resolves to an error or the rendered template
     */
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

/**
 * An interface for template caches to use
 */
export interface TemplateCache {
    /**
     * Gets a template from the cache
     * 
     * @param itemName The name of the template to get
     */
    getItem(itemName: string): Promise<[Error | null, string | null]> | [Error | null, string | null];

    /**
     * Puts a template into the cache
     * 
     * @param itemName The name of the template to cache
     * @param itemValue The template's data
     */
    setItem(itemName: string, itemValue: string): Promise<Error | void> | Error | void;
}

/**
 * A filesystem template cache
 */
export class FilesystemTemplateCache implements TemplateCache {
    /**
     * The cache directory
     */
    public readonly cacheDir: string;

    /**
     * Instantiates a new `FilesystemTemplateCache`
     * 
     * @param cacheDir The cache directory
     */
    constructor(cacheDir: string) {
        this.cacheDir = cacheDir;
    }

    /**
     * Gets a template from the cache
     * 
     * @param itemName The template to get
     * @returns A promise that resolves to an error or the template
     */
    public async getItem(itemName: string): Promise<[Error | null, string | null]> {
        try {
            const contents = await fs.readFile(`${this.cacheDir}/${itemName}.ejs`, { encoding: "utf8" });
            return [null, contents];
        } catch (e) {
            return [e as Error, null];
        }
    }

    /**
     * Puts a template into the cache
     * 
     * @param itemName The name of the template to cache
     * @param itemValue The template's data
     * @returns Whether there was an error putting the data into the cache; or void
     */
    public async setItem(itemName: string, itemValue: string): Promise<Error | void> {
        try {
            await fs.writeFile(`${this.cacheDir}/${itemName}.ejs`, itemValue, { encoding: "utf8" });
        } catch (e) {
            return e as Error;
        }
    }
}

/**
 * Props for creating an `S3Renderer`
 */
interface S3RendererProps {
    /**
     * The name of the bucket to use
     */
    bucket?: string;

    /**
     * The region the bucket
     */
    bucketRegion?: string;

    /**
     * The prefix to use for object keys
     */
    keyPrefix?: string;

    /**
     * The `S3Handler` to use
     */
    s3Handler?: S3Handler;

    /**
     * The `TemplateCache` to use
     */
    cache?: TemplateCache
}

/**
 * A renderer that uses Amazon S3 for template storage
 */
export class S3Renderer implements Renderer {
    /**
     * The prefix to use for object keys
     */
    public readonly keyPrefix: string;

    /**
     * The `S3Handler` to use
     */
    private readonly s3Client: S3Handler;

    /**
     * The `TemplateCache` to use
     */
    private readonly cache: TemplateCache;

    /**
     * Instantiates a new `S3Renderer`
     * 
     * @param props `S3RendererProps` to use for instantiation
     */
    constructor(props: S3RendererProps) {
        if (props.s3Handler != null) {
            this.s3Client = props.s3Handler;
        } else if (props.bucket != null) {
            this.s3Client = new S3Handler(props.bucket, props.bucketRegion);
        }
        this.keyPrefix = props.keyPrefix || "";
        this.cache = props.cache || new FilesystemTemplateCache("/tmp");
    }

    /**
     * Renders a view with the provided data
     * 
     * @param view The view to render
     * @param data The data to pass the view
     * @returns A promise that resolves to an error or the rendered template
     */
    public async render(view: string, data?: object): Promise<[Error | null, string]> {
        if (!data) {
            data = {};
        }
    
        data = {
            render: async (v: string, d?: object) => (await this.render(v, d))[1],
            ...data
        }

        try {
            let [err, result] = await this.cache.getItem(view);

            if (result == null) {
                console.log(`making s3 request: ${this.keyPrefix}/${view}.ejs`);
                const response = await this.s3Client.getObject(`${this.keyPrefix}/${view}.ejs`);    
                result = await response.Body?.transformToString() || "";
                this.cache.setItem(view, result);
            }

            const html = await ejs.render(result, data, { async: true });

            return [null, html];
        } catch (e) {
            const err = e as Error;
            console.log(err);
            return [err, `<pre>${err.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`];
        }
    }
}