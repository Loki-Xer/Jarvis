/*------------------------------------------------------------------------------------------------------------------------------------------------------


Copyright (C) 2023 Loki - Xer.
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
Jarvis - Loki-Xer 


------------------------------------------------------------------------------------------------------------------------------------------------------*/

const { System, isPrivate, copilot, gemini, chatgpt } = require("../lib/");

System({
    pattern: "copilot", 
    fromMe: isPrivate,
    desc: "ai copilot", 
    type: "ai",
}, async (m, match) => {
   match = match || m.reply_message?.text;
   if(match && m.quoted) match += "\n" + m.reply_message.text;
   if(!match) return m.reply("_*need query !!*_\n_*eg: .copilot create a simple html page*_");
   let session = m.quoted && m.store.copilot.has(m.reply_message.id) ? m.store.copilot.get(m.reply_message.id) : copilot.generateNewSession();
   const res = await copilot.chat(session, match);
   const msg = await m.send(res.text, { contextInfo: { forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363197401188542@newsletter", newsletterName: "copilot" }}});
   m.store.copilot.set(msg.key.id, session);
});

System({
   pattern: 'gemini',
   fromMe: isPrivate,
   desc: 'Chat with gemini ai',
   type: 'ai',
}, async (message, match) => {
  match = match || message.reply_message.text;
  if (!(match || message.quoted) || (message.quoted && !message.reply_message.image)) return message.reply("_*Need Prompt !!*_\n_*eg: .gemini who is iron man?*_\n _For image you have to Reply to an image and also give a prompt_");
  const path = message.quoted && message.reply_message?.image ? await message.reply_message.downloadAndSaveMedia() : null;
  const res = await gemini(match, path);
  await message.send(res, { contextInfo: { forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: '120363197401188542@newsletter', newsletterName: 'ɢᴇᴍɪɴɪ ᴀɪ' } } });
});

