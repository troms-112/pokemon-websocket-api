// Sources used to write this code
// [1] websockets/ws, “examples/express-session-parse/index.js,” GitHub, [Online]. 
// Available: https://github.com/websockets/ws/blob/master/examples/express-session
// -parse/index.js. [Accessed: May 13, 2025].

// [2] GeeksforGeeks, “How to create a WebSocket connection in JavaScript?,” 
// GeeksforGeeks, Mar. 28, 2022. [Online]. Available: https://www.geeksforgeeks.org/
// how-to-create-a-websocket-connection-in-javascript/. [Accessed: May 13, 2025].

// [3] GeeksforGeeks, “switch case in JavaScript,” GeeksforGeeks, Nov. 9, 2021. 
// [Online]. Available: https://www.geeksforgeeks.org/switch-case-in-javascript/.
// [Accessed: May 13, 2025].

// Import the websocket library for creating the server
// node-fetch is needed to call PokeAPI
require ('dotenv').config();
const express   = require("express");
const http      = require("http");
const WebSocket = require('ws');
const fetch     = require('node-fetch');
const app       = express();


// Bind the server to the localhost on port 5050
const HOST = process.env.HOST || "localhost";
const PORT = parseInt(process.env.PORT, 10) || 5050;

// Middleware:
app.use(express.json());

//confirm backend is working
app.get("/", (req, res) => {
    res.send("Austin's Microservice A is running.");
});

// Create HTTP server and attach Express
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Listen for new connections
wss.on('connection', (ws) => {
    ws.on('message', async raw => {
        // parse raw data into json 
        let request;
        try {
            request = JSON.parse(raw);
        } catch {
            // reject invalid payload
            return ws.send(JSON.stringify({
                type:   'error',
                message: 'Invalid JSON Payload'
            }));
        }

         // Get the parameters from the request
        const { type, requestId, name, battleType, trainer } = request;
        
        // Route the request based on type
        switch (type) {
            case 'baseStats':
                try {
                    // Get real data from PokeAPI
                    const data = await getBaseStats(name);
                    // return the stats as a JSON
                    ws.send(JSON.stringify({
                        requestId,
                        type: 'baseStatsResponse',
                        name,
                        data
                    }));
                } catch (err) {
                    ws.send(JSON.stringify({
                        requestId,
                        type: 'error',
                        message: err.message
                    }));
                }
                break;
            
            case 'holdItems': 
                {
                    // Use stub data for item recommendations
                    const data = getHoldItems(name, battleType);
                    ws.send(JSON.stringify({
                        requestId,
                        type: 'holdItemsResponse',
                        name,
                        data,
                    }));
                }
                break;

            case 'evProfile': 
               try {
                    // Get real data from PokeAPI
                    const data = await getEVProfile(name);
                    // return the stats as a JSON
                    ws.send(JSON.stringify({
                        requestId,
                        type: 'evProfileResponse',
                        name,
                        data
                    }));
                } catch (err) {
                    ws.send(JSON.stringify({
                        requestId,
                        type: 'error',
                        message: err.message
                    }));
                }
                break;
            
            default:
                // Throw error for unknown request type
                ws.send(JSON.stringify({
                    requestId,
                    type: 'error',
                    message: 'Invalid request type'
                }));
        }
    });
});


// real pokemon server
// return stats as JSON object
async function getBaseStats(name) {
    // only need the name
    const slug = name.toLowerCase().trim();
    // need the stats based on the name
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
    if (!res.ok) throw new Error (`Pokemon "${name}" not found`);
    const json = await res.json();

    // convert API stats to hashmap 
    const stats= {};
    json.stats.forEach(s => {
        // formats data to return snake_Case
        const key = s.stat.name.replace(/-/g, '_');
        stats[key] = s.base_stat;
    });

    return stats;
}


// Dummy stats for hold items
function getHoldItems(name, battleType) {
    return [
        { item: 'Leftovers',        justification: 'Provides passive healing each turn' },
        { item: 'Choice Scarf',     justification: 'Increases speed but locks into one move' }
    ];
}


// real pokemon server
// return stats as JSON object
async function getEVProfile(name) {
    // only need the name
    const slug = name.toLowerCase().trim();
    // need the stats based on the name
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
    if (!res.ok) throw new Error (`Pokemon "${name}" not found`);
    const json = await res.json();

    // convert API EV Profile to hashmap 
    const evProfile = {};
    json.stats.forEach(s => {
        // formats data to return snake_case
        const key = s.stat.name.replace(/-/g, '_');
        evProfile[key] = s.effort;
    });

    return evProfile;
}


server.listen(PORT, () => {
    console.log(`HTTP Server running at https://${HOST}:${PORT}`);
    console.log(`WebSocket Server running at wss://${HOST}:${PORT}`);
});

