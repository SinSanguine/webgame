const express = require('express');
const aedes = require('aedes')({
    preConnect: (client, packet, negate) => console.log('Connected: ', packet.clientId) || negate(null, true),
    // published: (packet, client, done) => console.log(packet.topic) || done(),
});
const http = require('http');
const ws = require('websocket-stream');

const app = express();

app.use(express.static('./static'));
app.use('/mqtt', express.static('./node_modules/mqtt'));

app.listen(process.env.PORT, () => console.log('Server listening on ', process.env.PORT));

const mqtt_port = process.env.MQTT_PORT || 8333;
const httpServer = http.createServer();
ws.createServer({ server: httpServer }, aedes.handle);
httpServer.listen(mqtt_port, () => {
    console.log('websocket server listening on port ', mqtt_port);
});

