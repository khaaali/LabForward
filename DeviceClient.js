"use strict";

const net = require("net");
const { workerData, parentPort, threadId } = require("node:worker_threads");

const client = new net.Socket();
const PORT = 6162;
const HOST = "127.0.0.1";

// establishes connections
client.connect(PORT, HOST, function () {
	console.log(`Client connected to: ${PORT} :  ${HOST}`);
	client.write("UUID" + workerData.id);
	sendData(workerData.id);
});

client.on("data", function (data) {
	console.log("Received: " + data);
});

client.on("close", function () {
	console.log("Connection closed");
});

// send data to terminal on main thread depending on worker type.
function sendData(deviceUUID) {
	let payload = {
		id: deviceUUID,
		data: Math.random(),
		type: workerData.type,
	};
	// passive data
	if (workerData.type === "Passive") {
		setInterval(() => {
			payload.data = Math.random();
			//  post to main thread terminal
			parentPort.postMessage(JSON.stringify(payload));
		}, 5000);
	} // sends active data once on start to terminal
	if (workerData.type === "Active") {
		parentPort.postMessage(JSON.stringify(payload));
	}
}

//  worker listens for active uuid and send data to main thread on termial
parentPort.on("message", (uuid) => {
	let payload = {
		id: uuid,
		data: Math.random(),
		type: "Active",
	};
	console.log(`running task ${uuid} on thread ${threadId}`);
	parentPort.postMessage(JSON.stringify(payload));
});
