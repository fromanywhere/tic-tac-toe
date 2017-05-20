const connect = require('connect');
const http = require('http');
const WebSocketServer = new require('ws');
const url = require('url');

const utils = require('./Utils');
const AbstractGame = require('./AbstractGame');
const RemotePlayer = require('./RemotePlayer');
const userManager = require('./UserManager');
const gamesManager = require('./GamesManager');

const app = connect();
const server = http.createServer(app);

const webSocketServer = new WebSocketServer.Server({
    server: server
});

const STATUS = {
    SUCCESS: 'success',
    FAIL: 'fail'
};

webSocketServer.on('connection', function(ws) {

    let result = {
        status: STATUS.SUCCESS
    };
    
    try {
        let query = url.parse(ws.upgradeReq.url, true).query;    
        let playerId = query.playerId;
        let gameId = query.gameId;

        let gameItem = gamesManager.getGame(gameId);
        let player = new RemotePlayer(playerId, gameItem.game, ws);

        if (gameItem.players.indexOf(playerId) !== -1) {
            throw new Error('Игрок уже в игре');
        } else {
            gameItem.game.joinPlayer(player);
            gameItem.players.push(playerId);
            utils.log('Игрок', playerId, 'присоединился к', gameId);
        }
    } catch (e) {
        utils.error(e.message);
        result.message = e.message;
        result.status = STATUS.FAIL;
        ws.close(1003, JSON.stringify(result)); // 1003 — The connection is being terminated because the endpoint received data of a type it cannot accept
    }
});

// CORS
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use('/login', (req, res, next) => {
    utils.postParser(req, res, (query) => {
        let result = {
            status: STATUS.SUCCESS
        };

        try {
            if (!query) {
                throw new Error('Некорректные параметры POST-запроса');
            }
        
            let playerLogin = query.login;
            let playerId = query.playerId;
            result.data = userManager.login(playerLogin, playerId);
        } catch (e) {
            utils.error(e.message);
            result.message = e.message;
            result.status = STATUS.FAIL;
        }

        res.end(JSON.stringify(result));
        next();
    });
});

app.use('/logout', (req, res, next) => {
    utils.postParser(req, res, (query) => {
        let result = {
            status: STATUS.SUCCESS
        };

        try {
            if (!query) {
                throw new Error('Некорректные параметры POST-запроса');
            }

            userManager.logout(query.playerId);
        } catch (e) {
            utils.error(e.message);
            result.message = e.message;
            result.status = STATUS.FAIL;
        }

        res.end(JSON.stringify(result));
        next();
    });
});

app.use('/games', (req, res, next) =>  {
    res.writeHead(200, {'Content-Type': 'text/plain; charset=utf8'});

    let result = {
        status: STATUS.SUCCESS
    };

    try {
        let query = url.parse(req.url, true).query;
        let playerId = query.playerId;
        let gameList = gamesManager.getGameList(playerId);
        result.data = {
            games: gameList
        }
    } catch (e) {
        utils.error(e.message);
        result.message = e.message;
        result.status = STATUS.FAIL;
    }

    res.end(JSON.stringify(result));
    next();
});

app.use('/create', (req, res, next) => {
    utils.postParser(req, res, (query) => {
        let result = {
            status: STATUS.SUCCESS
        };

        try {
            if (!query) {
                throw new Error('Некорректные параметры POST-запроса');
            }

            let playerId = query.playerId;
            if (!userManager.userExist(playerId)) {
                throw new Error('Игрок с playerId ' + playerId + ' не существует');
            }

            let boardSize = query.boardSize;
            let playersCount = query.playersCount;

            let gameId = gamesManager.createGame(boardSize, playersCount);
            result.data = {
                id: gameId
            }
        } catch (e) {
            utils.error(e.message);
            result.message = e.message;
            result.status = STATUS.FAIL;
        }

        res.end(JSON.stringify(result));
        next();
    });
});

// respond to all requests
app.use(function(req, res){
    res.end();
});

//create node.js http server and listen on port
server.listen(3000);