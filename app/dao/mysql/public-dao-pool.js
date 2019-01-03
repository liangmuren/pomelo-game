var mysql = require('mysql');
/*
 * Create mysql connection pool.
 */
var createMysqlPool = function (app) {
    var mysqlConfig = app.get('mysqlForPublic');

    return mysql.createPool({
        connectionLimit: 10,
        host: mysqlConfig.host,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
        database: mysqlConfig.database
    });
};

exports.createMysqlPool = createMysqlPool;
