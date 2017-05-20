const AbstractGame = require('./AbstractGame');
const AbstractPlayer = require('./AbstractPlayer');
const utils = require('./Utils');

class GameServer extends AbstractGame {
    constructor(id, boardSize, playersCount) {
        super();

        if (!utils.isNumber(boardSize)) {
            throw new Error('Некорректные значения размера поля');
        }

        if (boardSize < 3 || boardSize > 9) {
            throw new Error('Размерность должна быть не меньше 3х3 и не больше 9х9');
        }

        if (!utils.isNumber(playersCount)) {
            throw new Error('Некорректное количество игроков');
        }

        if (playersCount < 2 || playersCount > 4) {
            throw new Error('Игроков может быть от 2 до 4');
        }

        this.id = id;
        this.token = null;
        this.board = GameServer.createBoard(boardSize);
        this.players =[];
        this.maxPlayersCount = Number(playersCount);
        this.move = null;
        this.step = 0;
        this.requestCounter = 0;
        this.requestLimit = 10;
        this.state = AbstractGame.STATE.WAITING;
    }

    static createBoard(boardSize) {
        let result = new Array(boardSize);
        let rowIndex;
        for (rowIndex = 0; rowIndex < boardSize; rowIndex++) {
            result[rowIndex] = new Array(boardSize);
        }

        for (let columnIndex = 0; columnIndex < boardSize; columnIndex++) {
            for (rowIndex = 0; rowIndex < boardSize; rowIndex++) {
                result[columnIndex][rowIndex] = '[' + columnIndex + ',' + rowIndex + ']';
            }
        }

        return result;
    }

    static validateMove(board, state, players, x, y) {
        let result = {
            status: false
        };

        if (!utils.isNumber(x) || !utils.isNumber(y)) {
            result.message = 'Некорректный параметр';
            return result;
        }

        if ((x < 0) || (x > board.length - 1) || (y < 0) || (y > board.length - 1)) {
            result.message = 'Ход за пределами поля';
            return result;
        }

        for (let playerId = 0; playerId < players.length; playerId++) {
            if (board[x][y] === AbstractGame.SYMBOLS[playerId]) {
                result.message = 'Клетка уже занята';
                return result;
            }
        }

        if (state !== AbstractGame.STATE.PROCESS) {
            result.message = 'Игра завершена';
            return result;
        }

        result.status = true;
        return result;
    }

    requestMove() {
        if (this.requestCounter > this.requestLimit) {
            require('./GamesManager').removeGame(this.id, 'Количество попыток походить превышено');
        }

        if (this.state === AbstractGame.STATE.PROCESS) {
            this.token = Math.random().toString(36).substring(7);
            this.players[this.move].makeMove(this.token, this.board);
        }
    }

    isAnybodyWin(x, y, board) {
        let winCount = board.length;
        let currentCounter;
        let indexes;
        let rowIndex;
        let columnIndex;

        function isWin(currentCounter) {
            return currentCounter === winCount;
        }

        // 1. По горизонтали
        currentCounter = 1;
        for (columnIndex = 1; columnIndex < board.length; columnIndex++) {
            if (board[columnIndex][y] === board[columnIndex - 1][y]) {
                currentCounter += 1;
            } else {
                currentCounter = 1;
            }
        }

        if (isWin(currentCounter)) {
            return true;
        }

        // 2. По вертикали
        currentCounter = 1;
        for (rowIndex = 1; rowIndex < board.length; rowIndex++) {
            if (board[x][rowIndex] === board[x][rowIndex - 1]) {
                currentCounter += 1;
            } else {
                currentCounter = 1;
            }
        }

        if (isWin(currentCounter)) {
            return true;
        }

        // 3. Главная диагональ
        currentCounter = 1;
        for (indexes = 1; indexes < board.length; indexes++) {
            if (board[indexes][indexes] === board[indexes-1][indexes - 1]) {
                currentCounter += 1;
            } else {
                currentCounter = 1;
            }
        }

        if (isWin(currentCounter)) {
            return true;
        }

        // 4. Побочная диагональ
        currentCounter = 1;
        for (indexes = 1; indexes < board.length; indexes++) {
            if (board[board.length - indexes - 1][indexes] === board[board.length - indexes][indexes - 1]) {
                currentCounter += 1;
            } else {
                currentCounter = 1;
            }
        }

        if (isWin(currentCounter)) {
            return true;
        }
    }

    joinPlayer(player) {
        if (this.players.length >= this.maxPlayersCount) {
            throw new Error("Игра уже набрала нужное количество игроков");
        }

        if (!(player instanceof AbstractPlayer)) {
            throw new Error("Некорректный тип игрока");
        }

        if (this.state !== AbstractGame.STATE.WAITING) {
            throw new Error("Игра уже началась или уже закончилась");
        }

        this.players.push(player);
        this.move = 0;

        if (this.players.length === this.maxPlayersCount) {
            this.state = AbstractGame.STATE.PROCESS;

            this.players.forEach(function (player) {
                player.notify('Игра начата! Ходит ' + this.players[this.move].name + ' (' + AbstractGame.SYMBOLS[this.move] + ')', this.board);
            }.bind(this));

            this.requestMove();
        }
    }


    static printResult(status) {
        return status
            ? "Победил " + status
            : "Ничья"
    }

    checkMove(token, x, y) {
        if (token === this.token) {
            let validateMove = GameServer.validateMove(this.board, this.state, this.players, x, y);
            if (!validateMove.status) {
                if(this.state === AbstractGame.STATE.PROCESS) {
                    this.players[this.move].notify(validateMove.message);
                    this.requestCounter += 1;
                    this.requestMove();
                }
                return;
            }
        } else {
            this.requestCounter += 1;
            this.requestMove();
            return;
        }

        this.board[x][y] = AbstractGame.SYMBOLS[this.move];
        this.step += 1;
        this.requestCounter = 0;

        if (this.isAnybodyWin(x, y, this.board)) {
            this.state = AbstractGame.STATE.FINISH;
            this.players.forEach(function (player) {
                player.notify(GameServer.printResult(this.getStatus().currentMove), this.board);
            }.bind(this));
        } else if ((this.step === (this.board.length * this.board.length))) {
            this.move = null;
            this.state = AbstractGame.STATE.FINISH;
            this.players.forEach(function (player) {
                player.notify(GameServer.printResult(false), this.board);
            }.bind(this));
        } else {
            this.move = (this.move + 1) % this.players.length;
            this.players.forEach(function (player) {
                player.notify(this.getStatus(), this.board);
            }.bind(this));
            this.requestMove();
        }
    }

    getStatus() {
        return {
            state: this.state,
            currentMove: this.move !== null
                ? this.players[this.move].name + ' (' + AbstractGame.SYMBOLS[this.move] + ')'
                : null
        }
    }

    destroy(reason) {
        if (!reason) {
            throw new Error('Причина удаления игры неизвестна');
        }
        this.players.forEach(function (player) {
            if(player.socket.readyState === 1) {
                player.notify(reason);
                player.socket.close(1001, reason); // 1001 — The endpoint is going away, either because of a server failure or because the browser is navigating away from the page that opened the connection.
            }
        });
    
        utils.log('Игра', this.id, 'завершена:', reason);
    }
}

module.exports = GameServer;