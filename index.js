const express = require("express");
const cors = require('cors');
const _ = require("lodash");

const gameApi = require("./src/Api/Game");
const RedisService = require("./src/RedisService");

let redisClient;
RedisService.getClient(async (err, client) => {
    if (err) console.log('Unable to get redis client', err);
    redisClient = client;
});


const app = express();
app.use(express.json());

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("dist"));
app.use(cors());

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (_, response) => {
  response.send('<h1>Monopoly Api</h1>');
});

app.get('/ping', function (_, response) {
  return response.send('pong');
});

// endpoint to get all the dreams in the database
// app.use('/game', gameRouter);

app.post('/game/create', async (_, response) => {    
    try {
        let game = await gameApi.createGame(redisClient);
        response.send(game);
    } catch(e) {
        response.status(400).send({error: e.message || 'Unable to create game'});
    }
});

app.get('/game/:gameKey/view', async (request, response) => {
    const gameKey = request.params.gameKey;
    
    let playerKey = request.query.playerKey; // ?playerKey=player_1

    try {
        let game = await gameApi.getGame(redisClient, gameKey, playerKey);
        response.send(game);
    } catch(e) {
        response.status(400).send({error: e.message || 'Unable to view game'});
    }
});

app.post('/game/:gameKey/player/create', async (request, response) => {
    const gameKey = request.params.gameKey;

    const data = _.get(request, 'body', {});

    try {
        let player = await gameApi.addPlayer(redisClient, gameKey, data['playerName']);
        response.send(player);
    } catch(e) {
        response.status(400).send({error: e.message || 'Unable to create player'});
    }
});

app.post('/game/:gameKey/start', async (request, response) => {
    const gameKey = request.params.gameKey;

    try {
        let game = await gameApi.startGame(redisClient, gameKey);
        response.send(game);
    } catch(e) {
        response.status(400).send({error: e.message || 'Unable to start game'});
    }
});

var listener = app.listen(process.env.PORT || 8080, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});