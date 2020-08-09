const _ = require("lodash");

const apiUtils = require('./utils');

export async function dealCard(client, gameKey, playerKey) {
    function validationFn(game) {
        if (game.state != "STARTED") throw Error(`game ${gameKey} is not STARTED`);
        if (game.activePlayer != playerKey) throw Error(`player ${playerKey} is not the active player in game ${gameKey}`);
        if (game.deck.length == 0) throw Error(`game ${gameKey} deck is empty`); 
    }

    function transformFn(game) {
        // Expect player to exist at this point
        const player = _.find(game.players, {key: game.activePlayer});
        apiUtils.dealCards(game, player, 1);
        return game;
    }

    return await apiUtils.editGame(client, gameKey, validationFn, transformFn);
}
exports.dealCard = dealCard;

export async function playCardAsAction(client, gameKey, playerKey, cardId) {
    function validationFn(game) {
        if (game.state != "STARTED") throw Error(`game ${gameKey} is not STARTED`);

        // TODO Revisit this, however for now, you can play a card as an action even if you're not the active player e.g. say no card
        // if (game.activePlayer != playerKey) throw Error(`player ${playerKey} is not the active player in game ${gameKey}`);
        
        const player = _.find(game.players, {key: game.activePlayer});
        if (!apiUtils.isCardInPlayerHand(player, cardId)) throw Error(`player ${playerKey} does not own card ${cardId} in hand`);
    }

    function transformFn(game) {
        const player = _.find(game.players, {key: game.activePlayer});
        
        // Remove card from hand
        const card = _.remove(player.hand, {id: cardId})[0];
        // Add card to discard
        game.discard.push(card);

        return game;
    }

    return await apiUtils.editGame(client, gameKey, validationFn, transformFn);
}
exports.playCardAsAction = playCardAsAction;

export async function playCard(client, gameKey, playerKey, cardId, toSetId = null, positionInSet = null) {
    function validationFn(game) {
        if (game.state != "STARTED") throw Error(`game ${gameKey} is not STARTED`);
        if (game.activePlayer != playerKey) throw Error(`player ${playerKey} is not the active player in game ${gameKey}`);
        
        const activePlayer = _.find(game.players, {key: game.activePlayer});
        if (!apiUtils.isCardInPlayerHand(activePlayer, cardId)) throw Error(`active player ${playerKey} does not own card ${cardId} in hand`);
    }

    function transformFn(game) {
        const activePlayer = _.find(game.players, {key: game.activePlayer});
        
        // Remove card from hand
        const card = _.remove(player.hand, {id: cardId})[0];
        
        apiUtils.insertCardToPlayerBoard(activePlayer, card, toSetId, positionInSet);

        return game;
    }

    return await apiUtils.editGame(client, gameKey, validationFn, transformFn);
}
exports.playCard = playCard;

// Moves only public/board cards
export async function moveCard(client, gameKey, playerKey, fromPlayerKey, toPlayerKey, cardId, toSetId = null, positionInSet = null) {
    function validationFn(game) {
        if (game.state != "STARTED") throw Error(`game ${gameKey} is not STARTED`);
        if (game.activePlayer != playerKey) throw Error(`player ${playerKey} is not the active player in game ${gameKey}`);
        if (fromPlayerKey != playerKey && toPlayerKey != playerKey) throw Error(`player ${playerKey} is neither to/from player`);

        const fromPlayer = _.find(game.players, {key: fromPlayerKey});
        if (!apiUtils.isCardInPlayerBoard(fromPlayer, cardId)) throw Error(`card ${cardId} not in player ${fromPlayer} board`);
    }

    function transformFn(game) {
        const toPlayer = _.find(game.players, {key: toPlayerKey});
        const card = apiUtils.removeCardFromPlayerBoard(fromPlayer, cardId);
        apiUtils.insertCardToPlayerBoard(toPlayer, card, toSetId, positionInSet);
        return game;
    }

    return await apiUtils.editGame(client, gameKey, validationFn, transformFn);
}
exports.moveCard = moveCard;

export async function moveSet(client, gameKey, playerKey, fromPlayerKey, toPlayerKey, setId, positionInBoard = null) {
    function validationFn(game) {
        if (game.state != "STARTED") throw Error(`game ${gameKey} is not STARTED`);
        if (game.activePlayer != playerKey) throw Error(`player ${playerKey} is not the active player in game ${gameKey}`);
        if (fromPlayerKey != playerKey && toPlayerKey != playerKey) throw Error(`player ${playerKey} is neither to/from player`);

        const fromPlayer = _.find(game.players, {key: fromPlayerKey});
        const cardSet = _.find(fromPlayer.board, {id: setId});
        if (!cardSet) throw Error(`No cardset ${setId} in player ${fromPlayerKey} board`);
    }

    function transformFn(game) {
        const toPlayer = _.find(game.players, {key: toPlayerKey});

        const cardSet = _.remove(fromPlayer.board, {id: setId})[0];
        if (positionInBoard == null) {
            toPlayer.board.push(cardSet);
        } else {
            toPlayer.board.splice(positionInBoard, 0, cardSet);
        }
        return game;
    }

    return await apiUtils.editGame(client, gameKey, validationFn, transformFn);
}
exports.moveSet = moveSet;

export async function undoMove() {} // Experimental
// export async function createPlayer() {}