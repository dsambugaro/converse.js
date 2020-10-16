/**
 * @copyright 2020, the Converse.js contributors
 * @license Mozilla Public License (MPLv2)
 * @description Pure functions to help funcitonally parse messages.
 * @todo Other parsing helpers can be made more abstract and placed here.
 */
const helpers = {};

// Captures all mentions, but includes a space before the @
helpers.mention_regex = /(?:\s|^)([@][\w_-]+(?:\.\w+)*)/ig;

helpers.matchRegexInText = text => regex => text.matchAll(regex);

const escapeRegexChars = (string, char) => string.replace(RegExp('\\' + char, 'ig'), '\\' + char);

helpers.escapeCharacters = characters => string =>
    characters.split('').reduce(escapeRegexChars, string);

helpers.escapeRegexString = helpers.escapeCharacters('[\\^$.?*+(){}');

// `for` is ~25% faster than using `Array.find()`
helpers.findFirstMatchInArray = array => text => {
    for (let i = 0; i < array.length; i++) {
        if (text.localeCompare(array[i], undefined, {sensitivity: 'base'}) === 0) {
            return array[i];
        }
    }
    return null;
};

const reduceReferences = ([text, refs], ref, index) => {
    let updated_text = text;
    let { begin, end } = ref;
    const { value } = ref;
    begin = begin - index;
    end = end - index - 1; // -1 to compensate for the removed @
    updated_text = `${updated_text.slice(0, begin)}${value}${updated_text.slice(end + 1)}`;
    return [updated_text, [...refs, { ...ref, begin, end }]]
}

helpers.reduceTextFromReferences = (text, refs) => refs.reduce(reduceReferences, [text, []]);

export default helpers;

const styling_directives = ['*', '_', '~', '`', '```', '>'];
const recursive_directives = ['*', '_', '~', '>'];
const styling_map = {
    '*': 'strong',
    '_': 'emphasis',
    '~': 'strike',
    '`': 'preformatted',
    '```': 'preformatted_block',
    '>': 'quote'
};

const styling_templates = {
    emphasis: (text) => `<i>${text}</i>`,
    preformatted: (text) => `<code>${text}</code>`,
    preformatted_block: (text) => `<div class="code_block">${text}</div>`,
    quote: (text) => `<div class="quote">${text}</div>`,
    strike: (text) => `<del>${text}</del>`,
    strong: (text) => `<b>${text}</b>`,
};


function getStylingMarkup (text) {
    let i = 0, html = '';
    while (i < text.length) {
        if (styling_directives.includes(text[i])) {
            const begin = i;
            const d = text[i]; // the styling directive
            const template = styling_templates[styling_map[d]];
            i++;
            while (i < text.length && text[i] !== d) {
                i++;
            }

            // TODO: don't let spans wrap \n
            // TODO: Properly match preformatted blocks

            if (i < text.length) {
                if (d === '>') {
                    // The only directive that doesn't have a closing tag
                    html += `${d}${template(getStylingMarkup(text.slice(begin+1)))}`
                } else if (recursive_directives.includes(d)) {
                    html += `${d}${template(getStylingMarkup(text.slice(begin+1, i)))}${d}`
                } else {
                    html +=  `${d}${template(text.slice(begin+1, i))}${d}`
                }
            } else {
                // We reached the end without finding a match
                // Go back to original i and continue
                i = begin;
            }
        } else {
            html += text[i];
        }
        i++;
    }
    return html;
}


export function getMessageStylingReferences (message) {
    let i = 0;
    const references = [];
    while (i < message.length) {
        if (styling_directives.includes(message[i])) {
            const begin = i;
            const directive = message[i];
            i++;
            while (i < message.length && message[i] !== directive) {
                i++;
            }
            if (i < message.length) {
                references.push({
                    begin,
                    'end': i+1,
                    'html': getStylingMarkup(message.slice(begin, i+1))
                });
            } else {
                // We reached the end without finding a match
                // Go back to original i and continue
                i = begin;
            }
        }
        i++;
    }
    return references;
}
