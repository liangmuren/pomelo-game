var pomelo = require('pomelo');
var utils = require('../../util/utils');
var PreparedRoom = require('../../domain/common/preparedRoom');
var STATE = PreparedRoom.prototype.STATE;
var preparedRoomDao = module.exports;

preparedRoomDao.createRoom = function (owner, name, password, hashName, cb) {
    var sql = 'insert into prepared_room(owner, name, password, hash_name, state) values(?, ?, ?, ?, ?)';
    var args = [owner, name, password, hashName, STATE.OPEN];
    pomelo.app.get('dbclient').insert(sql, args, function (err, res) {
        if (!!err) {
            console.error('create room failed! ' + err.stack);
            utils.invokeCallback(cb, { code: err.number, msg: err.message }, null);
        } else {
            var room = new PreparedRoom({ id: res.insertId, name: name, hash_name: hashName });

            utils.invokeCallback(cb, null, room);
        }
    });
};

preparedRoomDao.updateRoom = function (name, password, state, cb) {
    var sql = 'update prepared_room set state = ? where name = ? and password = ?';
    var args = [state, name, password];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err) {
            utils.invokeCallback(cb, { code: err.number, msg: err.message }, null);
        } else {
            var room = new PreparedRoom({
                id: res.id, name: res.name, owner: res.owner, state: res.state,
                hash_name: res.hash_name
            });
            utils.invokeCallback(cb, null, room);
        }
    });
};

preparedRoomDao.getRoom = function (name, cb) {
    var sql = 'select * from prepared_room where name = ?';
    var args = [name];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            utils.invokeCallback(cb, { code: err.number, msg: err.message }, null);
        } else {

            if (res.length > 0) {
                var row = res[0];
                var preparedRoom = new PreparedRoom({
                    id: row.id, name: row.name, owner: row.owner, state: row.state,
                    hash_name: row.hash_name, password: row.password
                });
                utils.invokeCallback(cb, null, preparedRoom);
            } else {
                utils.invokeCallback(cb, null, {});
            }
        }
    });
};

preparedRoomDao.getOpenRoom = function (name, cb) {
    var sql = 'select * from prepared_room where name = ? and state != ?';
    var args = [name, STATE.CLOSED];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            utils.invokeCallback(cb, { code: err.number, msg: err.message }, null);
        } else {

            if (res.length > 0) {
                var row = res[0];
                var preparedRoom = new PreparedRoom({
                    id: row.id, name: row.name, owner: row.owner, state: row.state,
                    hash_name: row.hash_name
                });
                utils.invokeCallback(cb, null, preparedRoom);
            } else {
                utils.invokeCallback(cb, null, {});
            }
        }
    });
};


preparedRoomDao.getRoomUnderCheck = function (name, password, cb) {
    var sql = 'select * from prepared_room where name = ? and password = ?';
    var args = [name, password];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            utils.invokeCallback(cb, { code: err.number, msg: err.message }, null);
        } else {

            if (res.length > 0) {
                var row = res[0];
                var preparedRoom = new PreparedRoom({
                    id: row.id, name: row.name, owner: row.owner, state: row.state,
                    hash_name: row.hash_name
                });
                utils.invokeCallback(cb, null, preparedRoom);
            } else {
                utils.invokeCallback(cb, null, {});
            }
        }
    });
};


preparedRoomDao.getValidRoomUnderCheck = function (name, password, cb) {
    var sql = 'select * from prepared_room where name = ? and password = ? and state = ?';
    var args = [name, password, PreparedRoom.prototype.STATE.OPEN];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            utils.invokeCallback(cb, { code: err.number, msg: err.message }, null);
        } else {

            if (res.length > 0) {
                var row = res[0];
                var preparedRoom = new PreparedRoom({
                    id: row.id, name: row.name, owner: row.owner, state: row.state,
                    hash_name: row.hash_name
                });
                utils.invokeCallback(cb, null, preparedRoom);
            } else {
                utils.invokeCallback(cb, null, {});
            }
        }
    });
};
