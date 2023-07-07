const ExpressJS = require('express');
const BodyParser = require('body-parser');
const Chalk = require('chalk');
const Axios = require('axios');
const HTTPsProxyMiddleware = require("http-proxy-middleware");
const Exec = require('child_process').exec;

const Configuration = require('./config.json');

const Server = ExpressJS();

const BrawlStarsProxy = HTTPsProxyMiddleware.createProxyMiddleware({
    target: "https://api.brawlstars.com",
    changeOrigin: true,
    logLevel: "silent",
    pathRewrite: {
      "^/v1": "/v1",
    },
    onProxyReq: async (ProxyRequest, Request, Response) => {
        const userIP = (Request.headers["cf-connecting-ip"] || Request.headers["x-forwarded-for"] || Request.ip).replace(/^::ffff:/, "");
        console.log(`${Chalk.greenBright(`[Server] | `)}${Chalk.bold.blueBright(`Request made from ${userIP} to ${Request.hostname}${Request.originalUrl}.`)}`);

        if(Request.hostname != Configuration.URL) return await Response.status(403).send('Unauthorized Domain.');
        if(!Request.headers.authorization) return await Response.status(404).send('Missing data values.');

        ProxyRequest.setHeader("Authorization", `Bearer ${Request.headers.authorization}`);
    },
});

Server.set('json spaces', 2);
Server.use(BodyParser.json(), BodyParser.urlencoded({extended: true}));

Server.use('/v1', BrawlStarsProxy);

setInterval(() => {
	if(Configuration.AutomaticUpdate == false) return;

        Exec(`git pull`, (Error, Stdout) => {
            let Response = (Error || Stdout);
            if (!Error) {
                if (Response.includes("Already up to date.")) {
                    //console.log(`${Chalk.greenBright(`[Server] | Server Files are already updated.`)}`);
                } else {
                   console.log(`${Chalk.greenBright(`[Server] | Server Files are being updated!`)}`);
                    setTimeout(() => {
                        process.exit();
                    }, 1000);
                };
            };
        });
}, 30 * 1000);

Server.listen(Configuration.Port, function () {
    const Divider = Chalk.blueBright('------------------------------------------------------\n');
    const Text = Chalk.redBright('██████╗ ██╗██████╗ ███████╗████████╗███████╗██████╗\n██╔══██╗██║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗\n██║  ██║██║██████╔╝███████╗   ██║   █████╗  ██████╔╝\n██║  ██║██║██╔══██╗╚════██║   ██║   ██╔══╝  ██╔══██╗\n██████╔╝██║██████╔╝███████║   ██║   ███████╗██║  ██║\n╚═════╝ ╚═╝╚═════╝ ╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝\n');

    console.log(`${Divider}${Text}${Divider}`);    
    console.log(`${Chalk.greenBright(`[Server] | `)}${Chalk.bold.blueBright(`Server is online at: ${Configuration.URL} at port ${Configuration.Port}!`)}`);
});
