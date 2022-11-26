import express from "express";
import chalk from "chalk";
//import { router } from "./router.js";
import path from "path";
import os from "os";
import expressWs from "express-ws";

const app = express();
const wsapp = expressWs(app);

var format_date = (t) => {
	t = t || new Date();
	return (t.getFullYear() + '-' +
		('0' + (t.getMonth() + 1)).slice(-2) + '-' +
		('0' + t.getDate()).slice(-2) + ' ' +
		('0' + t.getHours()).slice(-2) + ':' +
		('0' + t.getMinutes()).slice(-2) + ':' +
		('0' + t.getSeconds()).slice(-2) + '.' +
		('000' + t.getMilliseconds()).slice(-4));
};

app.all("*", function(req, res, next) {
	res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Headers','X-Requested-With,Content-Type');
    res.header('Access-Control-Allow-Methods','GET,POST,OPTIONS');
	console.log(req.socket.remoteAddress.split(":").pop() + " \"" +
		chalk.cyan(req.method + " " + decodeURI(req.url)) + '"');

    /*console.log('[' + format_date() + ']' + " " +
            req.socket.remoteAddress.split(":").pop() + " \"" +
            chalk.cyan(req.method + " " + decodeURI(req.url)) + '" "' +
            req.headers["user-agent"] + '"');*/
	next();
});

app.use("/", express.static(path.resolve("public")));
//app.use("/", router);

const PORT = 8080;

app.use(express.urlencoded({ extended: false }))

app.ws("/", (_ws) => {});

app.get("/:page", (req, res) => {
    res.sendFile(path.resolve(`./public/${req.params.page}.html`));
});

app.post("/", (req, res) => {
    console.log(req.body.data);
    if (! req.body.data) {
        res.statusCode = 400;
        res.send("data not found");
    } else {
        res.statusCode = 200;
        res.send("barrage sent");
        
        wsapp.getWss().clients.forEach((ws) => {
            ws.send(req.body.data);
        });
    }
})

// 开服务器板子
const server = app.listen(PORT, () => {
	console.log(chalk.yellow('Starting up server'));
	console.log(chalk.yellow('正在开启服务器'));
	console.log();
	
	var getIPAddress = () => {
		let ipv4 = ["localhost"], ifaces = os.networkInterfaces();
		for (let dev in ifaces)
			ifaces[dev].forEach((details, _alias) => {
				if (details.family == 'IPv4') ipv4.push(details.address);
			});
		return ipv4;
	};

	console.log(chalk.yellow("Server Available on  服务器在以下地址可用:"));
	let ip = getIPAddress();
	for (let i in ip) console.log(`  http://${ip[i]}:${chalk.green(PORT)}`);
	
	console.log("\nHit Ctrl-C to stop the server  按下 Ctrl-C 关闭服务器\n");
});

// 退出板子
process.on('SIGINT', () => {
    console.log(chalk.red("Server stopped, ALL child_process killed meanwhile"));
    console.log(chalk.red("服务器已关闭，同时关闭所有子进程"));
    process.exit();
});