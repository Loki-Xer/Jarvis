global.server = require('./config').VPS ? "VPS" : process.env.B4A_URL ? "BACK4APP" : process.env.PWD?.includes("userland") ? "USERLAND" : process.env.PITCHER_API_BASE_URL?.includes("codesandbox") ? "CODESANDBOX" : process.env.REPLIT_USER ? "REPLIT" : process.env.AWS_REGION ? "AWS" : process.env.TERMUX_VERSION ? "TERMUX" : process.env.DYNO ? "HEROKU" : process.env.KOYEB_APP_ID ? "KOYEB" : process.env.GITHUB_SERVER_URL ? "GITHUB" : process.env.RENDER ? "RENDER" : process.env.RAILWAY_SERVICE_NAME ? "RAILWAY" : process.env.VERCEL ? "VERCEL" : process.env.DIGITALOCEAN_APP_NAME ? "DIGITALOCEAN" : process.env.AZURE_HTTP_FUNCTIONS ? "AZURE" : process.env.NETLIFY ? "NETLIFY" : process.env.FLY_IO ? "FLY_IO" : process.env.CF_PAGES ? "CLOUDFLARE" : process.env.SPACE_ID ? "HUGGINGFACE" : require("os").platform().toUpperCase();
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason?.stack || reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err?.stack || err);
});
const http = require('http');
const axios = require('axios');
const PORT = typeof process.env.PORT === "string" && !Number.isNaN(Number(process.env.PORT)) ? Number(process.env.PORT) : Math.floor(Math.random() * (9999 - 3000 + 1)) + 3000;
const { Jarvis } = require("./lib/Base/");
const { removeFiles, randomUserAgent } = require("./plugins/client/");
const url = global.server === "BACK4APP" ? process.env.B4A_URL : global.server === "RENDER" ? process.env.RENDER_EXTERNAL_URL : global.server === "KOYEB" ? "https://" + process.env.KOYEB_PUBLIC_DOMAIN : false;
if (global.server === "BACK4APP") {
  process.env.NODE_OPTIONS = '--max-old-space-size=200';
} else {
  process.env.NODE_OPTIONS = `--max-old-space-size=${Math.floor((require('os').totalmem() / (1024 * 1024)) * 0.6)}`;
}
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is Running!');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} as ${global.server}`);
});
setInterval(() => {
  removeFiles("./");
  removeFiles("./lib/temp");
}, 5 * 60 * 1000);
if (url) {
  setInterval(() => {
    axios.get(url, {
        timeout: 5000,
        headers: {
            "User-Agent": randomUserAgent()
        },
        validateStatus: status => status < 500
    })
    .then(res => {
        console.log(
            `[${new Date().toISOString()}] Keep-alive Ping - ${res.status} (${res.config.headers["User-Agent"]})`
        );
    })
    .catch(err => {
        console.log(
            `[${new Date().toISOString()}] Ping Failed! ${err.message}`
        );
    });
  }, 5 * 60 * 1000);
}
Jarvis({ isStarted: true });
