var pomelo = require('pomelo');
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger('crazyZoo', __filename);
var crazyZooRoom = require('../../domain/crazyZoo/crazyZooRoom');
var roomDao = module.exports;

roomDao.creatRoom = function (master, rid, userList, cb) {
    var sql = 'replace into crazy_zoo_room(master, rid, userlist, state) values(?, ?, ?, ?)';
    var args = [master, rid, userList.join(','), crazyZooRoom.STATE.OPEN];
    pomelo.app.get('dbclient').insert(sql, args, function (err, res) {
        if (!!err) {
            logger.error('create room failed: %j', err.stack);
            utils.invokeCallback(cb, { code: err.number, msg: err.message }, null);
        } else {
            var room = new crazyZooRoom({ id: res.id, rid: rid, master: master, userList: userList });
            utils.invokeCallback(cb, null, room);
        }
    });
}

roomDao.getRoom = function (rid, cb) {
    var sql = 'select id, master, rid, userlist, state from crazy_zoo_room where rid = ?';
    var args = [rid];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err) {
            logger.error('get room failed: %j', err.stack);
            utils.invokeCallback(cb, { code: err.number, msg: err.message }, null);
        } else {
            if (res.length > 0) {
                var row = res[0];
                var room = new crazyZooRoom({
                    id: row.id, rid: row.rid, master: row.master, state: row.state,
                    userList: row.userlist.split(',')
                });
                utils.invokeCallback(cb, null, room);
            } else {
                utils.invokeCallback(cb, null, {});
            }
        }
    });
}

roomDao.closeRoom = function (rid, cb) {
    var sql = "update crazy_zoo_room set state = ?, updated_at = ? where rid = ?";
    var state = crazyZooRoom.STATE.CLOSED;
    var now = new Date();
    var dateString = now.toLocaleString();
    var args = [state, dateString, rid];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err) {
            utils.invokeCallback(cb, { code: err.number, msg: err.message }, null);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
}