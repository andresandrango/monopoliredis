const _ = require("lodash");
const CARD_MODEL = require('./../Model/Card');
const CARDSET_MODEL = require('./../Model/CardSet');

async function editGame(client, gameKey, validationFn, transformationFn) {
    if (await client.isLocked(gameKey)) {
        throw new Error(`game key ${gameKey} is locked!`);
    }

    let game;
    try {
        await client.lock(gameKey);

        const rawGame = await client.get(gameKey);
        if (!rawGame) throw Error(`Game does not exist ${gameKey}`);
        
        game = JSON.parse(rawGame);
        
        validationFn(game);

        game = transformationFn(game);

        if (!await client.set(gameKey, JSON.stringify(game))) {
            throw Error("Unable to update game");
        }
    } catch (e) {
        throw e;
    } finally {
        await client.unlock(gameKey);
    }

    return game;
}

function reshuffle(cards) {
    cards.sort(() => Math.random() - 0.5);
    return cards;
  }

function dealCards(game, player, nCards) {
    if (game.deck.length < nCards) throw Error(`game ${game.key} deck does not have enough cards`);

    for (let i = 0; i < nCards; i++) {
        const card = game.deck.pop();
        player.hand.push(card);
    }
}

function getInitialDeck() {
    const deck = [];
    for (let i = 0; i < 106; i++) {
        const card = _.cloneDeep(CARD_MODEL);
        card.id = i.toString();
        deck.push(card);
    }
    return deck;
}

function isPlayerAlreadyInGame(game, playerKey) {
    const currentIdx = _.findIndex(game.players, {key: playerKey});
    return currentIdx >= 0;
}

function isCardInPlayerHand(player, cardId) {
    const card = _.find(player.hand, {id: cardId});
    return !!card;
}

function isCardInPlayerBoard(player, cardId) {
    _.forEach(player.board, cardSet => {
        const card = _.find(cardSet, {id: cardId});
        if (card) return true;
    });
    return false;
}

function removeCardFromPlayerBoard(player, cardId) {
    let card;
    _.forEach(player.board, cardSet => {
        card = _.find(cardSet, {id: cardId});
        if (card) {
            _.remove(cardSet, {id: cardId});
            return card;
        }
    });
}

function insertCardToPlayerBoard(player, card, toSetId = null, positionInSet = null) {
    let cardSet;
    if (toSetId) {
        cardSet = _.find(player.board, {id: toSetId});
        if (positionInSet) {
            cardSet.cards.splice(positionInSet, 0, card);
        } else {
            cardSet.cards.push(card);
        }
    } else {
        cardSet = _.cloneDeep(CARDSET_MODEL);
        cardSet.id = _.uniqueId('card_set_'); // TODO Is this even necessary?
        cardSet.cards.push(card);
        player.board.push(cardSet);
    }
    return player;
}

function createRandomGameKey() {
    return (parseInt((Math.random()*0x6f90f|0).toString(26),36)+0x75292).toString(36);
}

module.exports = {
    editGame,
    reshuffle,
    dealCards,
    getInitialDeck,
    isPlayerAlreadyInGame,
    isCardInPlayerHand,
    removeCardFromPlayerBoard,
    isCardInPlayerBoard,
    insertCardToPlayerBoard,
    createRandomGameKey
}