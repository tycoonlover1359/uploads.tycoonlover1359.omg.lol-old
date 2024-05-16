import ejs from "ejs";

function render(view: string, options?: object): string {
    const html = ejs.render("<%= people.join('asdf, '); %>", { people: ["A", "B", "C", "D"] });
    return html;
}

export default render;