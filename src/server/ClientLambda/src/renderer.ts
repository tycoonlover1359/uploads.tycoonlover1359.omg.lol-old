import ejs from "ejs";

async function render(view: string, data?: object): Promise<[Error | null, string]> {
    if (!data) {
        data = {};
    }

    try {
        const html = await ejs.renderFile(`templates/${view}.ejs`, data);
        return [null, html];
    } catch (err) {
        console.log(err);
        const html = "err";
        return [err as Error, html];
    }
}

export default render;