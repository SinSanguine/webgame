const client_id = (Math.random() + 1).toString(36).substring(7);
const topic = `players/${client_id}`;
const sync_time = 10;

export default async ()=>{
    /**@type {{[client_id:string]: [number,number]}} */
    const players = {

    };
    /** @type {{default: import('mqtt')}} */
    const { default: mqtt } = await import('/mqtt/dist/mqtt.esm.js');
    const mqtt_client = await mqtt.connectAsync('ws://localhost:8333/');
    mqtt_client.subscribe('players/+', err => {

        if (err)
            console.log(err);

    });
    mqtt_client.on('message', (incoming_topic, message_buffer) => {

        const message = message_buffer.toString('utf8');
        // console.log('message', incoming_topic, message);
        if (incoming_topic !== topic && message)
            players[topic] = JSON.parse(message);


    });
    setInterval(()=>{
        mqtt_client.publishAsync(topic, JSON.stringify(players[client_id]), { qos: 1, retain: true })
            // .then(() => console.log(topic))
            .catch(console.log);
    },sync_time)
    return {me:client_id,players};
}
