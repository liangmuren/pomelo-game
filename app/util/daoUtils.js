var daoUtils = module.exports;
var pomelo = require('pomelo');
var utils = require('./utils');

daoUtils.checkDaoQuery = function (sql, args) {
    if (utils.isEmptyString(sql)) {
        return 'sql query not exist';
    }
    if (typeof sql !== 'string') {
        return 'sql query is not string';
    }
    var paramCnt = 0;
    for (var i = 0, l = sql.length; i < l; i++) {
        if (sql[i] === '?') {
            paramCnt++;
        }
    }
    if (paramCnt > 0) {
        var argCnt = args.length;
        if (argCnt !== paramCnt) {
            return 'args count did not match required args count,' +
                ' required: ' + paramCnt + ', get: ' + argCnt;
        }
    }
    return '';
};

/**
 * Execute SQL Query with result length check, need greater than 0;
 * then return first result
 * @param sql   SQL query string
 * @param args  arguments in query string
 * @param cb    callback func
 */
daoUtils.daoQueryResLengthGreaterThanZeroRequireFirst = function (sql, args, cb) {
    var daoQueryCheckResult = daoUtils.checkDaoQuery(sql, args);
    if (daoQueryCheckResult) {
        utils.invokeCallback(cb, daoQueryCheckResult, null);
        return;
    }
    var dbClient = pomelo.app.get('dbclientForPublic');
    if (utils.isEmptyString(dbClient)) {
        utils.invokeCallback(cb, new Error('dbClient not exist'), null);
        return;
    }
    dbClient.query(sql, args, function (err, res) {
        if (!!err) {
            utils.invokeCallback(cb, err, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res[0]);
            } else {
                utils.invokeCallback(cb, null, null);
            }
        }
    });
};

/**
 * Execute SQL Query with result length check, need greater than 0
 * Otherwise return an empty array
 * @param sql   SQL query string
 * @param args  arguments in query string
 * @param cb    callback func
 */
daoUtils.daoQueryReturnEmptyArrayWhenZero = function (sql, args, cb) {
    var daoQueryCheckResult = daoUtils.checkDaoQuery(sql, args);
    if (daoQueryCheckResult) {
        utils.invokeCallback(cb, daoQueryCheckResult, null);
        return;
    }
    var dbClient = pomelo.app.get('dbclientForPublic');
    if (utils.isEmptyString(dbClient)) {
        utils.invokeCallback(cb, new Error('dbClient not exist'), null);
        return;
    }
    dbClient.query(sql, args, function (err, res) {
        if (!!err) {
            utils.invokeCallback(cb, err, null);
        } else {
            if (!!res && res.length <= 0) {
                utils.invokeCallback(cb, null, []);
            } else {
                utils.invokeCallback(cb, null, res);
            }
        }
    });
};

/**
 * Execute SQL Query with result length check, need greater than 0
 * @param sql   SQL query string
 * @param args  arguments in query string
 * @param cb    callback func
 */
daoUtils.daoQueryResLengthGreaterThanZero = function (sql, args, cb) {
    var daoQueryCheckResult = daoUtils.checkDaoQuery(sql, args);
    if (daoQueryCheckResult) {
        utils.invokeCallback(cb, daoQueryCheckResult, null);
        return;
    }
    var dbClient = pomelo.app.get('dbclientForPublic');
    if (utils.isEmptyString(dbClient)) {
        utils.invokeCallback(cb, new Error('dbClient not exist'), null);
        return;
    }
    dbClient.query(sql, args, function (err, res) {
        if (!!err) {
            utils.invokeCallback(cb, err, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, null);
            }
        }
    });
};

/**
 * Execute SQL Query with result length check, need equal to 1
 * @param sql   SQL query string
 * @param args  arguments in query string
 * @param cb    callback func
 */
daoUtils.daoQueryRequireOnlyResult = function (sql, args, cb) {
    var daoQueryCheckResult = daoUtils.checkDaoQuery(sql, args);
    if (daoQueryCheckResult) {
        utils.invokeCallback(cb, daoQueryCheckResult, null);
        return;
    }
    var dbClient = pomelo.app.get('dbclientForPublic');
    if (utils.isEmptyString(dbClient)) {
        utils.invokeCallback(cb, new Error('dbClient not exist'), null);
        return;
    }
    dbClient.query(sql, args, function (err, res) {
        if (!!err) {
            utils.invokeCallback(cb, err, null);
        } else {
            if (!!res && res.length === 1) {
                utils.invokeCallback(cb, null, res[0]);
            } else {
                utils.invokeCallback(cb, null, null);
            }
        }
    });
};

/**
 * Execute SQL Query
 * @param sql   SQL query string
 * @param args  arguments in query string
 * @param cb    callback func
 */
daoUtils.daoQuery = function (sql, args, cb) {
    var daoQueryCheckResult = daoUtils.checkDaoQuery(sql, args);
    if (daoQueryCheckResult) {
        utils.invokeCallback(cb, daoQueryCheckResult, null);
        return;
    }
    var dbClient = pomelo.app.get('dbclientForPublic');
    if (utils.isEmptyString(dbClient)) {
        utils.invokeCallback(cb, new Error('dbClient not exist'), null);
        return;
    }
    dbClient.query(sql, args, function (err, res) {
        if (!!err) {
            console.log(err);
            utils.invokeCallback(cb, err, null);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
};
