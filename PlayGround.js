define([
    'GameClient',
    'mustache.min',
    'PlayerVisual'
], function (
    /** GameClient */ GameClient,
    /** Mustache */ Mustache,
    /** PlayerVisual */PlayerVisual
) {

    let appTemplate = '\
        <div class="app__panel js-app__panel"></div> \
        <div class="app__board js-app__board"></div>';

    let panelTemplate = '\
        <div class="app__panel-games-list">\
            <form class="js-update-game-form">\
                <input type="submit" value="Обновить список игр" /> \
            </form>\
            <form class="js-join-game-form">\
                {{^hasGames}}\
                    <div class="games__item">\
                        Созданных игр еще нет\
                    </div>\
                {{/hasGames}}\
                {{#hasGames}}\
                    {{#games}}\
                        <div class="games__item">\
                            <label>\
                                Игра для {{maxPlayersCount}} игроков, в игре уже {{players}} <input type="radio" name="join" value="{{id}}">\
                            </label>\
                        </div>\
                    {{/games}}\
                    <button type="submit" {{^playerId}}disabled="disabled"{{/playerId}}>Войти в игру</button> \
                {{/hasGames}}\
            </form>\
        </div>\
        <div class="app__panel-create-game">\
            <form class="js-create-form"> \
                {{#playerId}}\
                    <div class="panel"> \
                        <div class="panel__item"> \
                            <label class="panel__title" for="sizeField">Размерность доски</label> \
                            <input type="number" class="panel__input js-first-input" name="size" id="sizeField" value="{{defaultSize}}" min="{{min}}" max="{{max}}" required/> \
                        </div> \
                        <div class="panel__item"> \
                            <label class="panel__title" for="playersCount">Количество игроков</label> \
                            <input type="number" class="panel__input" name="count" id="playersCount" value="{{defaultPlayersCount}}" min="2" required /> \
                        </div> \
                        <div class="panel__item"> \
                            <input type="submit" class="panel__submit" /> \
                        </div> \
                    </div> \
                {{/playerId}}\
            </form>\
        </div>\
        <div class="app__panel-login">\
            {{^playerId}}\
                <form class="js-login-form">\
                    <input type="text" name="playerName" value="" placeholder="Логин" required />\
                    <input type="submit" value="Войти" /> \
                </form>\
            {{/playerId}}\
            {{#playerId}}\
                <form class="js-logout-form">\
                    {{playerName}} <input type="submit" value="Выйти" /> \
                </form>\
            {{/playerId}}\
        </div>';

    class PlayGround {

        constructor() {
            this.element = document.querySelector('.app');
            this.player = null;
            this.boardRoot = null;
            this.loginForm = null;
            this.logoutForm = null;
            this.createForm = null;
            this.updateGameForm = null;
            this.joinGameForm = null;
            this.games = null;
            this.defaultData = {
                defaultSize: 3,
                defaultPlayersCount: 2,
                min: 3,
                max: 10
            };

            this.url = '127.0.0.1:3000/';
            this.host = 'http://' + this.url;
            this.reloginTimeout = null;

            this.createLayout();
            this.getGamesList();
        }

        createLayout() {
            this.element.innerHTML = Mustache.render(appTemplate, {});
            this.panelRoot = document.querySelector('.js-app__panel');
            this.boardRoot = document.querySelector('.js-app__board');
        }

        render() {
            let data = Object.assign({}, this.defaultData, {
                playerId: this.player ? this.player.id : null,
                playerName: this.player ? this.player.name : null
            }, {
                games: this.games,
                hasGames: !!this.games.length
            });

            this.panelRoot.innerHTML = Mustache.render(panelTemplate, data);
            this.activate();
        }

        activate() {
            this.loginForm = document.querySelector('.js-login-form');
            this.logoutForm = document.querySelector('.js-logout-form');
            this.createForm = document.querySelector('.js-create-form');
            this.updateGameForm = document.querySelector('.js-update-game-form');
            this.joinGameForm = document.querySelector('.js-join-game-form');

            if (this.loginForm) {
                this.loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.login(e.currentTarget.elements.playerName.value);
                });
            }

            if (this.logoutForm) {
                this.logoutForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }

            this.createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createGame(e.currentTarget.elements.size.value, e.currentTarget.elements.count.value);
            });

            this.updateGameForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.getGamesList();
            });

            this.joinGameForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let joinGameId = e.currentTarget.elements.join.value;
                if (joinGameId) {
                    this.joinGame(joinGameId);
                }
                this.getGamesList();
            });
        }

        login(playerName, playerId) {
            var xhr = new XMLHttpRequest();
            xhr.addEventListener("load", () => {
                let result = JSON.parse(xhr.responseText);
                if (result.status === 'success') {
                    this.player = {
                        id: result.data.id,
                        name: result.data.name
                    };

                    this.reloginTimeout = setTimeout(() => {
                        this.login(result.data.name, result.data.id);
                    }, (result.data.loginTimeout - 1000));

                    this.getGamesList();
                }
            });
            xhr.open("POST", this.host + "login");
            xhr.send(JSON.stringify({
                login: playerName,
                playerId: playerId
            }));
        }

        logout() {
            if (!this.player) {
                return;
            }

            var xhr = new XMLHttpRequest();
            xhr.addEventListener("load", () => {
                this.player = null;
                clearTimeout(this.reloginTimeout);
                this.getGamesList();
            });
            xhr.open("POST", this.host + "logout");
            xhr.send(JSON.stringify({
                playerId: this.player.id
            }));
        }

        getGamesList() {
            let xhr = new XMLHttpRequest();
            let playerId = this.player
                ? this.player.id
                : null;

            xhr.addEventListener("load", () => {
                let result = JSON.parse(xhr.responseText);
                if (result.status === 'success') {
                    this.games = result.data.games;
                }
                this.render();
            });
            xhr.open("GET", this.host + "games?playerId=" + playerId);
            xhr.send();
        }

        createGame(boardSize, playersCount) {
            if (!this.player) {
                return;
            }

            var xhr = new XMLHttpRequest();
            xhr.addEventListener("load", () => {
                let result = JSON.parse(xhr.responseText);
                if (result.status === 'success') {
                    this.joinGame(result.data.id);
                }
            });
            xhr.open("POST", this.host + "create");
            xhr.send(JSON.stringify({
                playerId: this.player.id,
                boardSize: boardSize,
                playersCount: playersCount
            }));
        }

        joinGame(gameId) {
            if (!this.player) {
                return;
            }

            new GameClient(gameId, this.url, this.player, new PlayerVisual(this.player.name, this.boardRoot));
        }
    }

    new PlayGround();
});