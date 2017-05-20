define([
    'AbstractPlayer',
    'AbstractGame',
    'mustache.min'
], function (
    /** AbstractPlayer */ AbstractPlayer,
    /** AbstractGame */ AbstractGame,
    /** Mustache */Mustache
) {
    var rootTemplate = '<div class="board">\
        <div class="js-board__status"></div>\
        <div class="js-board__body"></div>\
        <div class="board__control">\
            <button class="js-board__leave">Выйти</button>\
        </div>\
    </div>';

    var boardTemplate = '<div class="board__cnt"> \
        {{#rows}} \
            <div class="board__cell{{^column}} board__cell_first{{/column}}" \
                data-column-index="{{column}}" \
                data-row-index="{{row}}">{{value}} \
            </div> \
        {{/rows}} \
    </div>';

    var messageTemplate = '<div class="status">{{message}}</div>';

    class PlayerVisual extends AbstractPlayer {

        constructor(name, renderNode) {
            super(name, renderNode);
            this.leaveCallback = () => {};
            this.createVisual();
            this.notify('Ожидание игроков...');
        }

        createVisual() {
            var tmpNode = document.createElement('div');
            tmpNode.innerHTML = Mustache.render(rootTemplate, {});

            this.rootNode = tmpNode.firstElementChild;
            tmpNode = null;

            this.statusNode = this.rootNode.querySelector('.js-board__status');
            this.boardNode = this.rootNode.querySelector('.js-board__body');
            this.leaveButton = this.rootNode.querySelector('.js-board__leave');

            this.leaveButton.addEventListener('click', this.leave.bind(this));

            this.renderNode.appendChild(this.rootNode);
        }

        validateClick(e) {
            var x = e.target.getAttribute('data-column-index');
            var y = e.target.getAttribute('data-row-index');

            if (x === undefined || y === undefined) {
                return false;
            }

            return {
                x: Number(x),
                y: Number(y)
            }
        }

        render(board) {
            var size = board.length;
            var data = {
                rows: new Array(size * size)
            };

            for (var rowIndex = 0; rowIndex < size; rowIndex++) {
                for (var columnIndex = 0; columnIndex < size; columnIndex++) {
                    data.rows[rowIndex * size + columnIndex] = {
                        row: rowIndex,
                        column: columnIndex,
                        value: board[columnIndex][rowIndex]
                    }
                }
            }

            this.boardNode.innerHTML = Mustache.render(boardTemplate, data);
        }

        leave() {
            this.leaveCallback();
            this.renderNode.removeChild(this.rootNode);
        }

        setLeaveCallback(callback) {
            this.leaveCallback = callback;
        }

        makeMove(token, board, callback) {
            var that = this;

            var handler = function handler(e) {
                var click = that.validateClick(e);

                if (click) {
                    that.boardNode.classList.remove('active');
                    that.boardNode.removeEventListener('click', handler);
                    callback(token, click.x, click.y);
                }
            };

            this.boardNode.classList.add('active');
            this.boardNode.addEventListener('click', handler);
        };

        notify(message, board) {
            if (message) {
                var resultMessage = message;
                if (typeof message !== 'string') {
                    var statusString = '';
                    var moveString = '';

                    switch (message.state) {
                        case AbstractGame.STATE.WAITING:
                            statusString = 'Игра еще не началась.';
                            break;
                        case AbstractGame.STATE.PROCESS:
                            statusString = 'Идет игра.';
                            moveString = 'Ходит ' + message.currentMove;
                            break;
                        case AbstractGame.STATE.FINISH:
                            statusString = 'Игра завершена.';
                            if (model.move !== null) {
                                moveString = 'Победил ' + message.currentMove;
                            } else {
                                moveString = 'Ничья';
                            }
                            break;
                    }

                    resultMessage = statusString + ' ' + moveString;
                }
                this.statusNode.innerHTML = Mustache.render(messageTemplate, {message: resultMessage});
            }
            if (board) {
                this.render(board);
            }
        };
    }

    return PlayerVisual;
});