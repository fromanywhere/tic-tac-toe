var utils = require('./Utils');
var GameServer = require('./GameServer');
var AbstractGame = require('./AbstractGame');

class GamesManager {
    constructor() {
        this.storage = {};
        this.createTimeout = 2000;
    }
    
    createGame(boardSize, playersCount) {
        let gameId = utils.generateQuickGuid();
        let game = new GameServer(gameId, boardSize, playersCount);
        this.storage[gameId] = {
            players: [],
            maxPlayersCount: playersCount,
            game: game,
            createTime: Date.now()
        };
        this.timeoutCheck(gameId);

        utils.log('Создана игра', gameId);

        return gameId;
    }

    removeGame(gameId, reason) {
        if (this.storage[gameId]) {
            this.storage[gameId].game.destroy(reason);
            delete this.storage[gameId];
            utils.log('Удалена игра', gameId);
        }
    }

    timeoutCheck(gameId) {
        setTimeout(() => {
            let game = this.getGame(gameId);
            if (!game.players.length) {
                this.removeGame(gameId, 'В игру так никто и не зашел');
            }
        }, this.createTimeout);
    }

    getGame(gameId) {
        if (!this.storage[gameId]) {
            throw new Error('Игра с id ' + gameId + ' не существует');
        }

        return this.storage[gameId];
    }

    getGameList(playerId) {
        let result = [];
        Object.keys(this.storage).forEach((gameId) => {
            let gameItem = this.storage[gameId];
            if (gameItem.game.state === AbstractGame.STATE.WAITING) {

                let playersInGame = gameItem.game.players.map((player) => {
                    return player.name;
                });

                if (gameItem.players.indexOf(playerId) === -1) {
                    result.push({
                        id: gameId,
                        players: playersInGame,
                        maxPlayersCount: gameItem.maxPlayersCount
                    })
                }
            }
        });

        result.sort((a, b) => {
            return a.createTime < b.createTime;
        });

        return result;
    }

    cleanup(playerId) {
        Object.keys(this.storage).forEach((gameId) => {
            let gamePlayers = this.storage[gameId].players;
            let playerIndex = gamePlayers.indexOf(playerId);

            if (playerIndex !== -1) {
                gamePlayers.splice(playerIndex, 1);
                this.removeGame(gameId, 'Один из игроков вышел из игры');
            }
        });
        utils.log('Сейчас игр на сервере:', Object.keys(this.storage).length);
    }
}

module.exports = new GamesManager();