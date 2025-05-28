const WebSocket = require('ws');
const url = 'wss://pokemon-stats-k0jo.onrender.com'
const ws = new WebSocket( url );

// rest syntax to collect multiple elements into single(process.argv)
const [,, type, name, param] = process.argv;

let startTime;
ws.on('open', () => {
    startTime = performance.now();
    const payload = { type, requestId: Math.floor(startTime), name };
    if (type === 'holdItems') payload.battleType = param;
    if (type === 'evProfile') payload.trainer = param;
    console.log('OUT', JSON.stringify(payload));
    ws.send(JSON.stringify(payload));
});


ws.on('message', msg => {
    const elapsedTime = (performance.now() - startTime) / 1000;
    console.log('IN', msg.toString());
    console.log(`RTT: ${elapsedTime.toFixed(2)}s`);
    ws.close();
});


ws.on('error', (err) => {
  console.error('WebSocket error:', err.message);
});
