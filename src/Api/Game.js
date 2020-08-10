const _ = require("lodash");

const GAME_MODEL = require('./../Model/Game');
const PLAYER_MODEL = require('./../Model/Player');
const apiUtils = require('./utils');

async function createGame(client) {
    const gameKey = apiUtils.createRandomGameKey();

    if (await client.isLocked(gameKey)) {
        throw new Error(`game key ${gameKey} is locked!`);
    }

    const game = _.cloneDeep(GAME_MODEL);
    game.key = gameKey;

    try {
        await client.lock(gameKey);
        if (!await client.setnx(gameKey, JSON.stringify(game))) {
            throw new Error("Unable to set a new game, maybe try a different key");
        }
    } catch (e) {
        throw e;
    } finally {
        await client.unlock(gameKey);
    }

    return game;
}
exports.createGame = createGame;

async function getGame(client, gameKey, playerKey) {
    const rawGame = await client.get(gameKey);
    if (!rawGame) throw new Error(`Cannot start non existing game ${gameKey}`);

    const game = JSON.parse(rawGame);

    const players = game.players;
    
    game.deck = []; // remove deck
    game.players = []; // Remove players

    if (playerKey) {
        const player = _.find(players, {key: playerKey});
        if (!player) {
            throw new Error(`Player ${playerKey} does not belong to this game ${gameKey}`);
        }

        game.players.push(player);
    }

    return game;
}
exports.getGame = getGame;

/**
 * You can only start a game that is OPEN and that has at least 2 players
 * 
 * @param {*} client 
 * @param {*} gameKey 
 */
async function startGame(client, gameKey) {
    function validationFn(game) {
        if (game.state != "OPEN") {
            throw new Error(`Game ${gameKey} is not OPEN`);
        }

        if (game.players.length < 2) {
            throw new Error(`Game ${gameKey} does not have enough players to start`);
        }
    }

    function transformationFn(game) {
        if (game.state == "STARTED") {
            // if game is already started, don't do anything
            return game;    
        }

        game.state = "STARTED";

        // Create new shuffled deck
        game.deck = apiUtils.reshuffle(apiUtils.getInitialDeck());

        // Start game by dealing 5 cards to each player
        game.players.forEach(player => {
            apiUtils.dealCards(game, player, 5);
        });

        return game;
    }
    
    return await apiUtils.editGame(client, gameKey, validationFn, transformationFn);
}
exports.startGame = startGame;

async function endGame(client, gameKey) {
    function transformationFn(game) {
        game.state = "ENDED";
        return game;
    }
    return await apiUtils.editGame(client, gameKey, _.noop, transformationFn);
}
exports.endGame = endGame;

/**
 * Adds up to 5 players to a game that is OPEN.
 * Sets the first signup player as the starting player for now.
 */
async function addPlayer(client, gameKey, playerName) {
    function validationFn(game) {
        if (game.players.length >= 5) {
            throw new Error(`Game ${gameKey} has enough players`);
        }
        if (game.state != "OPEN") {
            throw new Error(`Game ${gameKey} does no longer accept new players`);
        }
    }

    // Create and append new player to game
    function transformationFn(game) {
        const newPlayer = _.cloneDeep(PLAYER_MODEL);
        newPlayer.key = _.uniqueId("player_");
        newPlayer.name = playerName;
        game.players.push(newPlayer);
        return game;
    }

    return await apiUtils.editGame(client, gameKey, validationFn, transformationFn);
}
exports.addPlayer = addPlayer;

/**
 * Could only shuffle when deck is empty and the game is STARTED
 * 
 * @param {*} client 
 * @param {*} gameKey 
 */
async function shuffle(client, gameKey) {
    function validationFn(game) {
        if (game.state != "STARTED") {
            throw new Error(`Game ${gameKey} is not started`);
        }
        if (game.deck.length != 0) {
            throw new Error(`Deck in game ${gameKey} is not empty`);
        }
    }

    function transformationFn(game) {
        const discard = game.discard;
        game.discard = [];
        game.deck = apiUtils.reshuffle(discard);
        return game;
    }

   return await apiUtils.editGame(client, gameKey, validationFn, transformationFn);
}
exports.shuffle = shuffle;

async function setNextPlayer(client, gameKey) {
    function validationFn(game) {
        if (game.state != "STARTED") {
            throw new Error(`Game ${gameKey} is not started`);
        }
    }

    function transformationFn(game) {
        // If no active player is set, just pick the first one
        if (!game.activePlayer) {
            game.activePlayer = game.players[0].key;
        } else {
            // Select Next Player
            const currentIdx = _.findIndex(game.players, {key: game.activePlayer});
            game.activePlayer = players[currentIdx + 1 % game.players.length].key;
        }
    }

    return await apiUtils.editGame(client, gameKey, validationFn, transformationFn);
}
exports.setNextPlayer = setNextPlayer;

// Probably don't need this anymore since redis is fast and we're mapping the whole session
// by one key
async function getGameVersion() {}