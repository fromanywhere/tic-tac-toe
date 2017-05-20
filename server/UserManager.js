const utils = require('./Utils');
const gamesManager = require('./GamesManager');

class UserManager {
    constructor() {
        this.storage = {};
        this.cleanupInterval = 5000;
        this.logoutInterval = 1000 * 60 * 3;

        this.periodicCleanup();
    }

    login(playerLogin, playerId) {
        if (!playerLogin) {
            throw new Error('Некорректный логин');
        }
        let postfix = '';
        let extPlayerId = playerId || utils.generateQuickGuid();

        Object.keys(this.storage).forEach((value) => {
            if (this.storage[value].login === playerLogin) {

                if (value === extPlayerId) {
                    utils.log(playerLogin, 'продлевает', extPlayerId);
                    return;
                }
                postfix = Date.now();
            }
        });

        playerLogin = playerLogin + postfix;

        this.storage[extPlayerId] = {
            login: playerLogin,
            loginTime: Date.now()
        };

        utils.log(playerLogin, 'вошел как', extPlayerId);

        return {
            id: extPlayerId,
            name: playerLogin,
            loginTime: this.storage[extPlayerId].loginTime,
            loginTimeout: this.logoutInterval
        };
    }

    forceLogout(playerId) {
        gamesManager.cleanup(playerId);
        delete this.storage[playerId];
        utils.log(playerId, 'удален');
    }

    logout(playerId) {
        if (!playerId) {
            throw new Error('Неверный playerId');
        }

        if (!this.userExist(playerId)) {
            throw new Error('PlayerId не найден');
        }

        utils.log('Вышел', this.storage[playerId]);
        this.forceLogout(playerId);
    }

    userExist(playerId) {
        return !!this.storage[playerId];
    }

    getUserLogin(playerId) {
        if (!this.userExist(playerId)) {
            throw new Error('PlayerId не найден');
        }

        return this.storage[playerId].login;
    }
    
    cleanup() {
        let now = Date.now();
        Object.keys(this.storage).forEach((playerId) => {
            if (this.storage[playerId].loginTime + this.logoutInterval < now) {
                utils.log('Регулярная проверка удаляет по таймауту пользователя', playerId, this.storage[playerId]);
                this.forceLogout(playerId);
            }
        });
        utils.log('Сейчас играет человек:', Object.keys(this.storage).length);
    }

    periodicCleanup() {
        this.cleanup();
        setTimeout(this.periodicCleanup.bind(this), this.cleanupInterval);
    }
}

module.exports = new UserManager();