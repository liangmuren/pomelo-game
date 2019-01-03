var pomelo = require('pomelo');
var utils = require('../../util/utils');
var Message = require('../../domain/common/message');
var logger = require('pomelo-logger').getLogger('CrazyZoo', __filename);
var messageDao = module.exports;

messageDao.createMessage = function (route, uid, rid, target, content, cb) {
    var sql = 'insert into message(route, uid, rid, target, content, action) values(?, ?, ?, ?, ?, ?)';
    var action = content.action || '';
    var args = [route, uid, rid, target, content, action];
    pomelo.app.get('dbclient').insert(sql, args, function (err, res) {
        if (!!err) {
            logger.error('create message for messageDao failed! ' + err.stack);
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {
            var message = new Message({
                id: res.insertId,
                route: route,
                action: action,
                uid: uid,
                rid: rid,
                content: content,
                tid: res.insertId
            });
            logger.info('end create message');
            utils.invokeCallback(cb, null, message);
        }
    });
};

messageDao.createMessageWithAction = function (route, uid, rid, target, content, action, cb) {
    var sql = 'insert into message(route, uid, rid, target, content, action) values(?, ?, ?, ?, ?, ?)';
    var args = [route, uid, rid, target, content, action];
    pomelo.app.get('dbclient').insert(sql, args, function (err, res) {
        if (!!err) {
            logger.error('create message for messageDao failed! ' + err.stack);
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {
            var message = new Message({
                id: res.insertId, route: route, uid: uid, rid: rid, target: target,
                content: content, action: action, tid: res.insertId
            });
            utils.invokeCallback(cb, null, message);
        }
    });
    logger.info('end create message');
};

messageDao.getLatestBroadcastMessage = function (route, uid, rid, cb) {
    var sql = "select * from message where id = (select max(id) from message where " +
        "  route = ? and uid = ? and rid = ? and target = '*' and (action != '' and action is not null))";
    var args = [route, uid, rid];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err || res == null || res.length == 0) {
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {
            var temp = res[0];
            var message = new Message({id: temp.id, tid: temp.id, uid: uid, rid: rid, route: temp.route,
                target: temp.target, content: temp.content, action: temp.action});
            utils.invokeCallback(cb, null, message);
        }
    });
};

messageDao.getLatestMessage = function (route, uid, rid, cb) {
    var sql = "select * from message where id = (select max(id) from message where " +
        "  route = ? and uid = ? and rid = ? and (target = '*' or target = ?) and (action != '' and action is not null))";
    var args = [route, uid, rid, uid];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err || res == null || res.length == 0) {
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {
            var temp = res[0];
            var message = new Message({id: temp.id, tid: temp.id, uid: uid, rid: rid, route: temp.route,
                target: temp.target, content: temp.content, action: temp.action});
            utils.invokeCallback(cb, null, message);
        }
    });
};

messageDao.getLatestMessageExcludeAction = function (route, uid, rid, action, cb) {
    var sql = "select * from message where id = (select max(id) from message where " +
        "  route = ? and uid = ? and rid = ? and (target = '*' or target = ?) and (action != '' and action is not null" +
        " and action != ?))";
    var args = [route, uid, rid, uid, action];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err || res == null || res.length == 0) {
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {
            var temp = res[0];
            var message = new Message({id: temp.id, tid: temp.id, uid: uid, rid: rid, route: temp.route,
                target: temp.target, content: temp.content, action: temp.action});
            utils.invokeCallback(cb, null, message);
        }
    });
};

messageDao.getLatestMessageEqualAction = function (route, uid, rid, action, cb) {
    var sql = "select * from message where id = (select max(id) from message where " +
        "  route = ? and uid = ? and rid = ? and (target = '*' or target = ?) and (action != '' and action is not null" +
        " and action = ?))";
    var args = [route, uid, rid, uid, action];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err || res == null || res.length == 0) {
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {
            var temp = res[0];
            var message = new Message({id: temp.id, tid: temp.id, uid: uid, rid: rid,
                target: temp.target, content: temp.content, action: temp.action, route: temp.route});
            utils.invokeCallback(cb, null, message);
        }
    });
};

messageDao.getMessagesAfterTid = function (uid, rid, tid, cb) {
    var sql = "select * from message where rid = ? and (target = '*' or target = ?) and id > ?";
    var args = [rid, uid, tid];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err || res == null) {
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {
            var messages = [];
            for (var i = 0; i < res.length; i++) {
                var temp = res[i];

                var message = new Message({id: temp.id, tid: temp.id, uid: uid, rid: rid, route: temp.route,
                    target: temp.target, content: temp.content, action: temp.action});
                messages.push(message);
            }
            utils.invokeCallback(cb, null, messages);
        }
    });
};