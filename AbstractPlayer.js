define(function () {
    class AbstractPlayer {

        constructor(name, renderNode) {
            this.name = name;
            this.renderNode = renderNode;
        }

        makeMove(board, callback) {
            throw new Error('Abstract method');
        }

        notify(message, board) {
            throw new Error('Abstract method');
        }
    }

    return AbstractPlayer;
});