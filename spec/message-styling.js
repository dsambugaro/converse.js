/*global mock, converse */

const u = converse.env.u;

describe("A Chat Message", function () {

    fit("can be styled with XEP-0393 message styling hints",
        mock.initConverse(['rosterGroupsFetched', 'chatBoxesFetched'], {},
            async function (done, _converse) {

        await mock.waitForRoster(_converse, 'current', 1);
        const contact_jid = mock.cur_names[0].replace(/ /g,'.').toLowerCase() + '@montague.lit';
        await mock.openChatBoxFor(_converse, contact_jid);
        const view = _converse.api.chatviews.get(contact_jid);
        let msg_text = "This *message _contains_* styling hints! \`Here's *some* code\`";
        let msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        let msg_el = view.el.querySelector('converse-chat-message-body');
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            'This *<b>message _<i>contains</i>_</b>* styling hints! `<code>Here\'s *some* code</code>`');

        msg_text = "Here's a ~strikethrough section~";
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            "Here's a ~<del>strikethrough section</del>~");

        msg_text = `Here's a code block: \`\`\`\nInside the code-block, we don't enable *styling hints* like ~these~\n\`\`\``;

        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        done();
    }));
});
