const gameApi = require("./src/Api/Game");
const RedisService = require("./src/RedisService");

async function test() {
    RedisService.getClient(async (err, client) => {
        const key = 'a0002';
        await gameApi.createGame(client, key);
        console.log(await gameApi.getGame(client, key));
        console.log(await gameApi.startGame(client, key));
    })
    

    // console.log(await gameApi.getGame("Alex"));
    // console.log(await gameApi.getGame("Andres"));
}

test();

