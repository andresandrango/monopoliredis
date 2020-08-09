const asyncRedis = require("async-redis");

let CONNECTED_CLIENT = null;

module.exports = {
    getClient: (cb) => {
        
        if (CONNECTED_CLIENT) {
            cb(null, CONNECTED_CLIENT);
        }

        const client = asyncRedis.createClient({});

        client.on("error", function(error) {
            console.error(error);
            cb(error);
        });
        
        client.on('connect', function() {
            console.log('connected');

            client.isLocked = async (key) => {
                return await client.get(`${key}:lockingkey`) == "locked";
                
            }
            // Max expiration of 5 mins
            client.lock = async (key) => {
                await client.setex(`${key}:lockingkey`, 5 * 60, "locked");
            }
            client.unlock = async (key) => {
                await client.setex(`${key}:lockingkey`, 1, "unlocked");
                client.setnx
            }
            CONNECTED_CLIENT = client;
            cb(null, client);
        });
    }
}
// export default {
//     set: async (key, value, seconds) => await client.set(key, value, seconds),
//     setnx: async (key, value, seconds) => await client.setnx(key, value, seconds),
//     get: async (key) => {
//         const answer = await client.get(key);
//         return answer;
//     }
// };
