```markdown
implements comand line interface for handling user inputs

Design: TerminalHandler is root for application, it starts/stops the server. 
start/stop the client passive/active devices.  

passive device: send data every 5seconds with uuid, random decimals and type of device eg:
{
id: 'a5c4f77e-08a0-4261-b5c5-5639fcede355',
data: 0.7347096025707847,
type: 'Passive'
}

Active device: to request data from active device UUID of the device needs to be 
sent on the termnial to receive data 

eg:
aae8b8de-aca9-4ed1-9601-0550d1165ccb // uuid sent on termnial

returns:
number of client devices: 1
running task aae8b8de-aca9-4ed1-9601-0550d1165ccb on thread 3
{
id: 'aae8b8de-aca9-4ed1-9601-0550d1165ccb',
data: 0.41402337447306614,
type: 'Active'
}

server and clients are served on worker threads and communication between threads 
is maintained by parentPort.

Inside termnial user can enter numpad keys to do th following:
1 -> start TCP server on a worker thread
2 -> stop TCP server, terminating thread
3 -> start TCP client passive device on a worker thread
4 -> stop TCP client, terminate thread
5 -> start TCP client active device on worker thread
6 -> requests Active tcp client to send data

Start application:

node ./TerminalHandler.js
```
