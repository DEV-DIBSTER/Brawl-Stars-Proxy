const ExpressJS = require('express');
const BodyParser = require('body-parser');
const Chalk = require('chalk');
const Axios = require('axios');
const Exec = require('child_process').exec;

const Configuration = require('./config.json');

const Server = ExpressJS();
Server.set('json spaces', 2);
Server.use(BodyParser.json(), BodyParser.urlencoded({extended: true}));

Server.get('/v1', async (Request, Response) => {
    Response.status(200).send('Version: 1');
});

Server.get('*', async (Request, Response) => {
    //Logs the request.
	const userIP = (Request.headers["cf-connecting-ip"] || Request.headers["x-forwarded-for"] || Request.ip).replace(/^::ffff:/, "");
    console.log(`${Chalk.greenBright(`[Server] | `)}${Chalk.bold.blueBright(`Request made from ${userIP} to ${Request.hostname}${Request.originalUrl}.`)}`);

    if(Request.hostname != Configuration.URL) return await Response.status(403).send('Unauthorized Domain.');
    if(!Request.headers.authorization) return await Response.status(404).send('Missing data values.');

    await Axios({
        url: `https://api.brawlstars.com${Request.url}`,
        method: 'GET',
        headers: {
            'Authorization': `${Request.headers.authorization}`,
            'Content-Type': 'application/json'
        }
    }).then(BrawlStarsResponse => {
        Response.status(BrawlStarsResponse.status).send(BrawlStarsResponse.data);
    }).catch(Error => {
        Response.status(Error.toJSON().status).send(`${Error.toJSON().message}`);
    });
});

setInterval(() => {
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
