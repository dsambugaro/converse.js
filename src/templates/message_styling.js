import { html } from "lit-html";
import xss from "xss/dist/xss";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";

export default (o) => {
    const whiteList = {
        b: [],
        code: [],
        del: [],
        em: [],
        i: [],
    };
    return html`${unsafeHTML(xss.filterXSS(o.html, { whiteList }))}`;
}
