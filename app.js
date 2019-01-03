var pomelo = require('pomelo');
var routeUtil = require('./app/util/routeUtil');
var redis = require('redis');
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'Argar pomelo server');


// app configure
app.configure('production|development', function () {
    // route configures
    app.route('chat', routeUtil.chat);
    app.route('crazyZoo', routeUtil.crazyZoo);

    app.loadConfig('mysql', app.getBase() + '/config/mysql.json');
    app.loadConfig('mysqlForPublic', app.getBase() + '/config/mysqlForPublic.json');
    // filter configures
    app.filter(pomelo.timeout());
});

app.configure('production|development', 'connector|gate', function () {

    app.set('connectorConfig', {
        connector: pomelo.connectors.hybridconnector,
        heartbeat: 1,
        timeout: 4,
        useDict: true,
        useProtobuf: true
    });
});

app.configure('production|development', 'chat|gate|connector|crazyZoo', function () {
    var dbclient = require('./app/dao/mysql/mysql').init(app);
    app.set('dbclient', dbclient);

    var dbclientForPublic = require('./app/dao/mysql/mysqlForPublic').init(app);
    app.set('dbclientForPublic', dbclientForPublic);
});

// redis configuration
app.loadConfig('redis', app.getBase() + '/config/redis.json');
app.configure('production|development', function () {
    var redisConfig = app.get('redis');
    var redisClient = redis.createClient(redisConfig.RDS_PORT, redisConfig.RDS_HOST);
    redisClient.auth(redisConfig.RDS_PWD, function () {
        console.log("auth successfully");
        app.set('redisClient', redisClient);
    });
});

// Tencent Cloud
app.loadConfig('tencentSMS', app.getBase() + '/config/tencentSMS.json');

// start app
app.start();

process.on('uncaughtException', function (err) {
    console.error(' Caught exception: ' + err.stack);
});