/*------------------------------------------------------------------------------------------------------------------------------------------------------


Copyright (C) 2023 Loki - Xer.
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
Jarvis - Loki-Xer 


------------------------------------------------------------------------------------------------------------------------------------------------------*/

const { System, changeVar, setData, config: Config, platform: { heroku, koyeb, render, railway }, bot } = require("../lib/");
const { version } = require('../package.json');
const simpleGit = require("simple-git");
const pm2 = require("pm2");
const git = simpleGit();

System({
    pattern: "(shutdown|poweroff)",
    fromMe: true,
    type: "server",
    desc: "shutdown bot",
}, async (message) => {
    await message.reply(`_Jarvis is shutting down..._`);
    return await bot.stop();
});

System({
  pattern: "setvar",
  fromMe: true,
  type: "server",
  desc: "Set environment variable",
}, async (m, match) => {
  if (!match) return await m.reply(`Example: .setvar SUDO:917025673121`);
  const [key, ...part] = match.split(":");
  const value = part.join(":").trim();
  if (!key || !value) return await m.send(`_*Example: .setvar SUDO:917025673121*_`);
  if (m.client.server === "HEROKU") {
    await m.send(`_*Updated variable ${key.toUpperCase()}: ${value}*_`);
    const env = await heroku.setVar(key.toUpperCase(), value);
    if (!env) return m.reply(env);
  } else if (m.client.server === "RENDER") {
      await m.send(`*_Successfully Set_* *${key.toUpperCase()}:${value}*\n_ReDeploying..._`);
      await render.setVar(key.toUpperCase(), value);
  } else if (m.client.server === "KOYEB") {
    const koyebEnv = await koyeb.setVar(key.toUpperCase(), value);
    await m.reply(koyebEnv);
  } else if (m.client.server === "RAILWAY") {
    await railway.setVar(key.toUpperCase(), value, m);
  } else {
    const env = await changeVar(key.toUpperCase(), value);
    if (!env) return m.send("*Error in changing variable*");
    await setData(key.toUpperCase(), value, !!value, "vars");
    await m.reply(`_*Environment variable ${key.toUpperCase()} set to ${value}*_`);
    await bot.restart();
  }
});


System({
    pattern: "(platform|server)",
    fromMe: true,
    type: "server",
    desc: "Show which platform you delpoyed",
}, async (msg, match) => {
    msg.reply("_*" + "You are delpoyed on " + server.charAt(0).toUpperCase() + server.slice(1).toLowerCase() + "*_");
});

System({
    pattern: "delvar",
    fromMe: true,
    type: "server",
    desc: "Delete environment variable",
}, async (message, match) => {
    if (!match) return await message.reply("_Example: delvar sudo_");
    const key = match.trim().toUpperCase();
    if (message.client.server === "HEROKU") {
      await message.reply(`_*deleted var ${key.toUpperCase()}*_`);
      const env = await heroku.setVar(key.toUpperCase(), null);
      if (!env) return message.reply(env);
    } else if(message.client.server === "RENDER") {
        await message.send(`*_Successfully Deleted_* *${key}*\n_ReDeploying..._`);
        await render.delVar(key);
    } else if (message.client.server === "KOYEB") {
      const koyebEnv = await koyeb.setVar(key.toUpperCase(), null);
      await message.reply(`_*deleted var ${key.toUpperCase()}*_`);
    } else if (message.client.server === "RAILWAY") {
      await railway.setVar(key.toUpperCase(), null, message);
    } else {
      const env = await changeVar(key.toUpperCase(), "");
      if (!env) return message.reply("*Error in deleted variable*");  
      await setData(key.toUpperCase(), null, false, "vars");
      await message.reply(`_*deleted var ${key.toUpperCase()}*_`);
      await bot.restart();
    }
});

System({
    pattern: "(allvar|allenv)",
    fromMe: true,
    type: "server",
    desc: "all environment variables",
}, async (message) => {
    delete Config.DATABASE;
    delete Config.ALIVE_DATA;
    delete Config.GOODBYE_MSG;
    delete Config.WELCOME_MSG;
    if (message.client.server !== "HEROKU") {
        delete Config.HEROKU_API_KEY;
        delete Config.HEROKU_APP_NAME;
    };
    if (message.client.server !== "KOYEB") {
        delete Config.KOYEB_API;
        delete Config.KOYEB_APP_NAME;
    };
    if (message.client.server !== "RENDER") {
        delete Config.RENDER_API;
        delete Config.RENDER_APP_NAME;
    };
    if (message.client.server !== "RAILWAY") {
        delete Config.RAILWAY_API;
    };
    let s = '\n*All Your Vars*\n\n';
    for (const key in Config) {
       if (process.env[key]){
         s += `*${key}*: ${Config[key]}\n\n`;
         }
       };
    await message.reply(s);
});

System({
    pattern: "(getvar|getenv)",
    fromMe: true,
    type: "server",
    desc: "Show env",
}, async (message, match) => {
    if(!match) return message.reply("_*eg: getvar sudo*_");
    const requestedVar = match.trim().toUpperCase();
    if (typeof requestedVar !== 'string' || !requestedVar.trim()) {
          await message.reply("_*Invalid variable name provided.*_");
    } else if (Object.prototype.hasOwnProperty.call(process.env, requestedVar) || Object.prototype.hasOwnProperty.call(Config, requestedVar)) {
           const value = process.env[requestedVar] || Config[requestedVar];
           await message.reply(`*${requestedVar}*: ${value}`);
    } else {
           await message.reply(`_*Variable '${requestedVar}' not found.*_`);
    }
});

System({
    pattern: "(getsudo|getadmins)", 
    fromMe: true, 
    type: "server",
    desc: "shows sudo", 
 }, async (message, match) => {
    await message.reply("_*SUDO NUMBER'S ARA :*_ "+"```"+Config.SUDO+"```")
});

System({
    pattern: "dyno",
    fromMe: true,
    type: "server",
    desc: "Show Quota info of heroku",
}, async (message) => {
    if(message.client.server !== "HEROKU") return await message.reply(`_this cmd for heroku_`);
    if(!Config.HEROKU_API_KEY) return await message.send("*Can't find HEROKU_API_KEY*");
    await message.reply(await heroku.dyno());
});

System({
    pattern: "setsudo", 
    fromMe: true, 
    desc: "set sudo", 
    type: "server" 
}, async (message, match) => { 
    let newSudo;
    if (message.mention && message.mention.jid && message.mention.jid[0]) {
      newSudo = message.mention.jid[0].split("@")[0];
    } else if (message.reply_message && message.reply_message.sender) {
      newSudo = message.reply_message.sender.split("@")[0];
    } else {
      newSudo = null;
    }
    if (!newSudo && !match) return await message.reply("_Reply to someone/mention_\n*Example:* . setsudo @user");
    let setSudo = Config.SUDO;
    if (newSudo) {
        setSudo = (setSudo + "," + newSudo).replace(/,,/g, ",");
        setSudo = setSudo.startsWith(",") ? setSudo.replace(",", "") : setSudo;
    }
    await message.reply("*new sudo numbers are :* " + setSudo);
    await message.reply("_It takes 30 seconds to take effect_");

    if (message.client.server === "HEROKU") {
      const env = await heroku.setVar("SUDO", setSudo);
      if (!env) return message.reply(env);
    } else if (message.client.server === "KOYEB") {
      const koyebEnv = await koyeb.setVar("SUDO", setSudo);
    } else if (message.client.server === "RENDER") {
        await render.setVar("SUDO", setSudo);
    } else if (message.client.server === "RAILWAY") {
      await railway.setVar("SUDO", setSudo, message);
    } else {
      const env = await changeVar("SUDO", setSudo);
      if (!env) return message.send("*Error set sudo*");  
      await setData("SUDO", setSudo, !!setSudo, "vars");
      await bot.restart();
    }
});

System({
  pattern: "delsudo",
  fromMe: true,
  desc: "delete sudo sudo",
  type: "server",
}, async (m, text) => {
  let sudoNumber = m.quoted? m.reply_message.sender : text;
  sudoNumber = sudoNumber.split("@")[0];
  if (!sudoNumber) return await m.send("*Need reply/mention/number*");
  let sudoList = Config.SUDO.split(",");
  sudoList = sudoList.filter((number) => number!== sudoNumber);
  let newSudoList = sudoList.join(",");
  await m.send(`NEW SUDO NUMBERS ARE: \n\`\`\`${newSudoList}\`\`\``, { quoted: m.data });
  await m.send("_IT TAKES 30 SECONDS TO MAKE EFFECT_", { quoted: m });
   if (m.client.server === "HEROKU") {
      const env = await heroku.setVar("SUDO", newSudoList);
      if (!env) return m.reply(env);
    } else if (m.client.server === "KOYEB") {
      const koyebEnv = await koyeb.setVar("SUDO", newSudoList);
    } else if (m.client.server === "RENDER") {
       await render.setVar("SUDO", newSudoList);
    } else if (m.client.server === "RAILWAY") {
      await railway.setVar("SUDO", newSudoList, m);
    } else {
      const env = await changeVar("SUDO", newSudoList);
      if (!env) return m.send("*Error set sudo*");  
      await setData("SUDO", newSudoList, !!newSudoList, "vars");
      await bot.restart();
    }
});

System({
    pattern: "update",
    fromMe: true,
    type: "server",
    desc: "Checks for update.",
}, async (message, match) => {
    const server = message.client.server;
    await git.fetch();
    var commits = await git.log([Config.BRANCH + "..origin/" + Config.BRANCH,]);
    if (match == "now") {
        if (commits.total === 0) {
            return await message.reply(`_Jarvis is on the latest version: v${version}_`);
        } else {
            if (server === "HEROKU") {
                await heroku.update(message);
            } else if (server === "RENDER") {
                await render.update('do_not_clear');
                await new Promise((resolve) => pm2.stop('jarvis-md', resolve));
            } else if (server === "KOYEB") {
                await message.reply("_*Building preparing 𐍮*_")
                let check = await koyeb.getStatus();
                if (check) return message.reply('_Please wait..._\n_Currently 2 instances are running in Koyeb, wait to stop one of them._');
                let data = await koyeb.update();
                return await message.reply(data);
            } else {
                await bot.update(message);
                await bot.restart();
            }
        }
    } else if (commits.total === 0) {
        return await message.send(`_Jarvis is on the latest version: v${version}_`);
    } else {
        var availupdate = "*Updates available for Jarvis-md* \n\n";
        commits["all"].map((commit, num) => {
            availupdate += num + 1 + " ●  " + commit.message + "\n";
        });
        const updateCommand = message.prefix ? `${message.prefix} update now` : "update now";
        return await message.send(`${availupdate}\n\n _type *${updateCommand}*_`);
    }
});

System({
  pattern: "restart",
  fromMe: true,
  desc: "for restart bot",
  type: "server",
}, async (message) => {
  await message.send("_*Restarting*_");
  if (message.client.server === "HEROKU") {
      await heroku.restart(message)
  } else if (message.client.server === "RENDER") {
      await render.restart();
  } else if (message.client.server === "RAILWAY") {
      await railway.restart();
  } else {
      await bot.restart();
  };
});

System({
  pattern: "mode",
  fromMe: true,
  type: "server",
  desc: "change work type",
}, async (message, value) => {
  if (!value) {
    return message.isGroup ? await message.send("Choose mode", { values: [ { displayText: "private", id: "mode private" }, { displayText: "public", id: "mode public" }, ], onlyOnce: true, withPrefix: true, participates: [message.sender], }, "poll") : message.reply("_*mode private/public*_");
  }
  const workType = value.toLowerCase();
  if (workType!== "public" && workType!== "private") return;
  await message.send(`_*Work type changed to ${workType}*_`);
  let env;
  switch (message.client.server) {
    case "HEROKU":
      env = await heroku.setVar("WORK_TYPE", workType);
      break;
    case "KOYEB":
      env = await koyeb.setVar("WORK_TYPE", workType);
      break;
    case "RENDER":
      env = await render.setVar("WORK_TYPE", workType);
      break;
    case "RAILWAY":
     env = await railway.setVar("WORK_TYPE", workType, message);
     break;
    default:
      env = await changeVar("WORK_TYPE", workType);
      if (!env) return await message.send("*Error in changing variable*");
      await setData("WORK_TYPE", workType,!!workType, "vars");
      await bot.restart();
  }
  if (!env) return await message.reply(env);
});
