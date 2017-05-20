class AbstractPlayer {

    constructor(name, renderNode) {
        this.name = name;
        this.renderNode = renderNode;
    }

    makeMove(token, board, callback) {
        throw new Error('Abstract method');
    }

    notify(message) {
        throw new Error('Abstract method');
    }
}

module.exports = AbstractPlayer;