// mysql CRUD
var sqlclient = module.exports;

var _pool;

var NND = {};

/*
 * Init sql connection pool
 * @param {Object} app The app for the server.
 */
NND.init = function (app) {
    _pool = require('./dao-pool').createMysqlPool(app);
};

/**
 * Excute sql statement
 * @param {String} sql Statement The sql need to excute.
 * @param {Object} args The args for the sql.
 * @param {fuction} cb Callback function.
 *
 */
NND.query = function (sql, args, cb) {

    _pool.getConnection(function (err, connection) {
        // Use the connection
        connection.query(sql, args, function (error, results, fields) {
            // And done with the connection.
            connection.release();

            // Handle error after the release.
            if (error) throw error;

            // Don't use the connection here, it has been returned to the pool.
            cb(error, results);
        });
    });
};

/**
 * Close connection pool.
 */
NND.shutdown = function () {
    _pool.drain().then(function () {
        _pool.clear();
    });
};

/**
 * init database
 */
sqlclient.init = function (app) {
    if (!!_pool) {
        return sqlclient;
    } else {
        NND.init(app);
        sqlclient.insert = NND.query;
        sqlclient.update = NND.query;
        sqlclient.delete = NND.query;
        sqlclient.query = NND.query;
        return sqlclient;
    }
};

/**
 * shutdown database
 */
sqlclient.shutdown = function (app) {
    NND.shutdown(app);
};






