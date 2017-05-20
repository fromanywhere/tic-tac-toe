class AbstractGame {

    static get STATE() {
        return  {
            WAITING: 'WAITING',
            PROCESS: 'PROCESS',
            FINISH: 'FINISH'
        }
    };

    static get SYMBOLS() {
        return ['X', '0', '#', '*'];
    }

    checkMove() {
        throw new Error();
    }

    getStatus() {
        throw new Error();
    }
}

module.exports = AbstractGame;