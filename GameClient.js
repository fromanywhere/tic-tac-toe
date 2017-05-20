define([
    'AbstractPlayer',
    'AbstractGame'
], function (
    /** AbstractPlayer */ AbstractPlayer,
    /** AbstractGame */ AbstractGame
) {
    class GameClient extends AbstractGame {
        
        constructor(gameId, url, player, client) {
            super();

            this.gameId = gameId;
            this.player = player;
            this.client = client;
            this.socket = new WebSocket("ws://" + url + "/?gameId=" + gameId + "&playerId=" + player.id);
            this.client.setLeaveCallback(() => {
                this.socket.close(1000); //1000 Normal closure; the connection successfully completed whatever purpose for which it was created.
            });

            this.socket.onclose = (e) => {
                if (e.code === 1003) { // 1003 — The connection is being terminated because the endpoint received data of a type it cannot accept
                    this.client.notify("Невозможно войти в игру");
                } else {
                    this.client.notify("Сервер разорвал соединение");
                }
            };
            this.socket.onmessage = (e) => {
                let message = JSON.parse(e.data);
                switch(message.command) {
                    case 'NOTIFY':
                        this.client.notify(message.message, message.board);
                        break;
                    case 'MAKEMOVE':
                        this.client.makeMove(message.token, message.board, this.checkMove.bind(this));
                        break;
                }
            };
        }

        checkMove(token, x, y) {
            let message = JSON.stringify({
                command: 'CHECKMOVE',
                token: token,
                x: x,
                y: y
            });
            this.sendMessage(message);
        }

        getStatus() {
            let message = JSON.stringify({
                command: 'GETSTATUS'
            });
            this.sendMessage(message);
        }

        sendMessage(message) {
            if(this.socket.readyState === 1) {
                this.socket.send(message);
            }
        }
    }

    return GameClient;
});