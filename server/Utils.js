function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function postParser(request, response, callback) {
    let queryString = '';
    let STATUS = {
        SUCCESS: 'success',
        FAIL: 'fail'
    };

    response.writeHead(200, {'Content-Type': 'text/plain; charset=utf8'});

    request.on("data", function (chunk){
        queryString += chunk.toString();
    });
    request.on("end", () => {
        let query;
        try {
            query = JSON.parse(queryString);
        } catch (e) {
            query = null;
        } finally {
            callback(query);
        }
    });
}

function generateQuickGuid() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

function log() {
    let args = Array.from(arguments);
    let result = '    ';

    args.forEach((value) => {
        if (typeof value !== 'object') {
            result += value + ' ';
        } else {
            result += JSON.stringify(value) + ' ';
        }
    });

    console.log(result);
}

function error() {
    log.apply(null, ['ERROR:'].concat(Array.from(arguments)));
    console.trace();
    console.log('');
}

module.exports = {
    generateQuickGuid: generateQuickGuid,
    postParser: postParser,
    isNumber: isNumber,
    log: log,
    error: error
};