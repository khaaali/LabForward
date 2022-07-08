"use strict";

const net = require("net");
const { parentPort } = require("node:worker_threads");

const PORT = 6162;
const HOST = "127.0.0.1";

//Create an instance of the server
const server = net.createServer(MiniConnectorServer);
//Start listening with the server on given port and host.
server.listen(PORT, HOST, function () {
	console.log(`Server started on port ${PORT} at ${HOST}`);
});

//Declare connection listener function
function MiniConnectorServer(sock) {
	//Log when a client connnects.
	let clientName = `${sock.remoteAddress}:${sock.remotePort}`;

	parentPort.postMessage(`new client connected: ${clientName}`);

	//Listen for data from the connected client and forward to terminal
	sock.on("data", function (data) {
		//Log data from the client
		parentPort.postMessage(`${clientName} Sent: ${data}`);
	});
	//Handle client connection termination.
	sock.on("close", function () {
		parentPort.postMessage(
			`${sock.remoteAddress}:${sock.remotePort} Terminated the connection`
		);
	});
	//Handle Client connection error.
	sock.on("error", function (error) {
		parentPort.postMessage(
			`${sock.remoteAddress}:${sock.remotePort} Connection Error ${error}`
		);
	});
}
