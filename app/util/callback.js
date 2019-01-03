var statusCode = require('./statusCode');
var callback = module.exports;

callback.cbByCode = function (next, state, code) {
    next (state, {
        code: code
    });
};

callback.cbByCodeWithRes = function (next, state, code, res) {
    next (state, {
        code: code,
        result: res
    });
};

callback.cbSessionError = function (next, varName) {
    next(null, {
        code: statusCode.MESSAGE.SESSION_ERR,
        msg: varName
    });
};

callback.cbArgError = function (next, argName) {
    next(null, {
        code: statusCode.MESSAGE.ARG_ERR,
        msg: argName
    });
};

callback.cbInternalError = function (next, err) {
    next(err, {
        code: statusCode.MESSAGE.FAIL
    });
};

callback.cbOK = function (next) {
    next(null, {
        code: statusCode.MESSAGE.OK
    });
};

callback.cbOKWithState = function (next, state) {
    next(state, {
        code: statusCode.MESSAGE.OK
    });
};

callback.cbOKWithRes = function (next, res) {
    next(null, {
        code: statusCode.MESSAGE.OK,
        result: res
    });
};

callback.cbNew = function (next) {
    next(null, {
        code: statusCode.MESSAGE.NEW
    });
};