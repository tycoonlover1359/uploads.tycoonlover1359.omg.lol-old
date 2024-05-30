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