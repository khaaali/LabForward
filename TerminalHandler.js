"use strict";

/*
implements comand line interface for handling user inputs

Design: TerminalHandler is root for application, it starts/stops the server. start/stop the client passive/active devices.  
passive device send data every 5seconds with uuid, random decimals and type of device eg:
{
  id: 'a5c4f77e-08a0-4261-b5c5-5639fcede355',
  data: 0.7347096025707847,
  type: 'Passive'
}

Active device: to request data from active device UUID of the device needs to be sent on the termnial to receive data eg:
aae8b8de-aca9-4ed1-9601-0550d1165ccb   // uuid sent on termnial 

returns:
number of client devices: 1
running task aae8b8de-aca9-4ed1-9601-0550d1165ccb on thread 3
{
  id: 'aae8b8de-aca9-4ed1-9601-0550d1165ccb',
  data: 0.41402337447306614,
  type: 'Active'
}

server and clients are served on worker threads and communication between threads is maintained by parentPort. 

Inside termnial user can enter numpad keys to do th following:
	1 ->  start TCP server on a worker thread
	2 ->  stop TCP server, terminating thread
	3 ->  start TCP client passive device on a worker thread
	4 ->  stop TCP client, terminate thread
	5 ->  start TCP client active device on worker thread
	6 ->  requests Active tcp client to send data  

*/

const readline = require("readline");
const crypto = require("crypto");
const { Worker } = require("node:worker_threads");

const terminal = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// contains worker instance for MiniConnectoreServer
let miniConnectorServer;

// contains list of object with worker id and device type
let deviceClientList = [];

// contains list of worker instances for Active and Passive devices
let workersList = [];

// check on UUIDv4 formatting
const regexExp =
	/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

// numpad key codes for triggering the corresponding functions
let keyCodes = {
	1: startMiniConnectorServer,
	2: stopMiniConnectorServer,
	3: startDeviceClientPassive,
	4: stopDeviceClientPassive,
	5: startDeviceClientActive,
	6: sendRequestDeviceClientActiveData,
};

// checks event on terminal with a callback
terminal.on("line", function (stdin) {
	userInputHandler(stdin);
});

// exit the terminal
terminal.on("close", function () {
	console.log("\n Exit !!!");
	process.exit(0);
});

/* 
expects numpad keys inputs 1-6 
	1 ->  start TCP server on a worker thread
	2 ->  stop TCP server, terminating thread
	3 ->  start TCP client passive device on a worker thread
	4 ->  stop TCP client, terminate thread
	5 ->  start TCP client active device on worker thread
	6 ->  requests Active tcp client to send data  

*/
function userInputHandler(input) {
	console.log("number of client devices: " + deviceClientList.length);

	if (!isNaN(input) && input <= 5 && input) {
		console.log(keyCodes[input]);
		keyCodes[input]();
	}

	if (input && regexExp.test(input)) {
		keyCodes[6](input);
	}
}

/*
creates server on worker thread attaches eventlistner 
*/

function startMiniConnectorServer() {
	if (!miniConnectorServer) {
		miniConnectorServer = new Worker("./MiniConnectorServer.js");
		miniConnectorServer.on("message", (data) => {
			// incoming data from miniConnectorServer worker
			console.log(data);
		});
		console.log("total workers:" + workersList.length);
	}
}

/*
terminates the worker thread for server closing all client connections
*/
function stopMiniConnectorServer() {
	if (miniConnectorServer) miniConnectorServer.terminate();
	miniConnectorServer = null;
	workersList.length = 0;
	deviceClientList.length = 0;
}

/*
creates passive client on worker thread attaches eventlistner 
*/
function startDeviceClientPassive() {
	if (miniConnectorServer) {
		let uuid = crypto.randomUUID();
		const worker = new Worker("./DeviceClient.js", {
			workerData: { type: "Passive", id: uuid },
		});
		worker.threadid = uuid;
		worker.on("message", (data) => {
			// incoming data from workers
			console.log(JSON.parse(data));
		});
		workersList.push(worker);
		deviceClientList.push({ id: uuid, object: worker, type: "Passive" });
		console.log("client devices: " + deviceClientList.length);
		console.log("total workers:" + workersList.length);
	}
}

// removes recently added worker client from deviceClientList and worker list
function stopDeviceClientPassive() {
	if (workersList.length) {
		let worker = workersList.pop();
		deviceClientList = deviceClientList.filter(
			(item) => item.id != worker.threadid
		);
		worker.terminate();
	}
}

// creates active client on worker thread attaches eventlistner

function startDeviceClientActive() {
	if (miniConnectorServer) {
		let uuid = crypto.randomUUID();
		const worker = new Worker("./DeviceClient.js", {
			workerData: { type: "Active", id: uuid },
		});
		worker.threadid = uuid;
		worker.on("message", (data) => {
			// incoming data from workers shows data
			console.log(JSON.parse(data));
		});
		workersList.push(worker);
		deviceClientList.push({ id: uuid, object: worker, type: "Active" });
		console.log("client devices: " + deviceClientList.length);
		console.log("total workers:" + workersList.length);
	}
}

// send request on worker with active uuid to receive data on terminal

function sendRequestDeviceClientActiveData(id) {
	if (isActiveUUID(id)) getWorkerOnId(id).postMessage(id);
}

// retrives worker with the uuid

function getWorkerOnId(uuid) {
	return workersList.find((worker) => worker.threadid === uuid);
}

// checks on uuid for valid type
function isActiveUUID(uuid) {
	return deviceClientList.find(
		(item) => item.id === uuid && item.type === "Active"
	)
		? true
		: false;
}
