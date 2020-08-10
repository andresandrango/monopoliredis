const gameApi = require("./src/Api/Game");
const RedisService = require("./src/RedisService");

async function test() {
    RedisService.getClient(async (err, client) => {
        
        try {
            let game = await gameApi.createGame(client);
            console.log('create game', game);
            const key = game.key;
            console.log('test getting game', await gameApi.getGame(client, key));
            console.log("add player", await gameApi.addPlayer(client, key, "andres"))
            console.log("add player", await gameApi.addPlayer(client, key, "alex"))
            console.log('start game', await gameApi.startGame(client, key));
        } catch(e) {
            console.log('ERROR FOUND', e);
        }
        
    })
    

    // console.log(await gameApi.getGame("Alex"));
    // console.log(await gameApi.getGame("Andres"));
}

test();