const AbstractPlayer = require('./AbstractPlayer');
const userManager = require('./UserManager');
const gamesManager = require('./GamesManager');
const utils = require("./Utils");

class RemotePlayer extends AbstractPlayer {
    constructor(playerId, game, socket) {
        super(userManager.getUserLogin(playerId), null);
        this.game = game;
        this.socket = socket;
        this.token = null;
        this.playerId = playerId;

        this.activate();
    }

    activate() {
        let STATUS = {
            SUCCESS: 'success',
            FAIL: 'fail'
        };

        let result = {
            command: 'STATUS',
            status: STATUS.SUCCESS
        };

        this.socket.on('message', (msg) => {
            try {
                let message = JSON.parse(msg);
                switch (message.command) {
                    case 'CHECKMOVE':
                        this.game.checkMove(message.token, message.x, message.y);
                        break;
                    case 'GETSTATUS':
                        this.notify(JSON.stringify(this.game.getStatus()));
                        break;
                }

            } catch (e) {
                utils.error(e.message);
                result.status = STATUS.FAIL;
                this.sendMessage(JSON.stringify(result));
            }

        });

        this.socket.on('close', (msg) => {
            // Соединение разорвано, а не закрыто
            if (msg === 1006) { //1006 — Used to indicate that a connection was closed abnormally (that is, with no close frame being sent) when a status code is expected.
                userManager.forceLogout(this.playerId);
            } else {
                gamesManager.removeGame(this.game.id, 'Сервер закрыл соединение');
            }
        })
    }

    makeMove(token, board) {
        let message = {
            command: 'MAKEMOVE',
            token: token,
            board: board
        };

        this.sendMessage(JSON.stringify(message));
    }

    notify(message, board) {
        let msg = {
            command: 'NOTIFY',
            message: message,
            board: board
        };        
        
        this.sendMessage(JSON.stringify(msg));
    }

    sendMessage(message) {
        if(this.socket.readyState === 1) {
            this.socket.send(message);
        }
    }
}

module.exports = RemotePlayer;