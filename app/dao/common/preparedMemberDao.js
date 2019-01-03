var pomelo = require('pomelo');
var utils = require('../../util/utils');
var PreparedMember = require('../../domain/common/preparedMember');
var preparedMemberDao = module.exports;

preparedMemberDao.createMember = function (name, rid, cb) {
    var sql = 'insert into prepared_room_member(name, rid) values(?, ?)';
    var args = [name, rid];
    pomelo.app.get('dbclient').insert(sql, args, function (err, res) {
        if (!!err) {
            console.error('create room failed! ' + err.stack);
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {
            var member = new PreparedMember({id: res.insertId, name: name, rid: rid});
            utils.invokeCallback(cb, null, member);
        }
    });
};

preparedMemberDao.updateMember = function (name, rid, state, cb) {
    var sql = 'update prepared_room_member set state = ? where name = ? and rid = ?';
    var args = [state, name, rid];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err) {
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
};

preparedMemberDao.getMember = function (name, rid, cb) {
    var sql = 'select * from prepared_room_member where name = ? and rid = ?';
    var args = [name, rid];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err) {
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {

            if (res.length > 0) {
                var dbMember = res[0];
                var member = new PreparedMember({
                    id: dbMember.id, name: dbMember.name, rid: rid,
                    state: dbMember.state
                });


                utils.invokeCallback(cb, null, member);
            } else {
                utils.invokeCallback(cb, null, {});
            }

        }
    });
};

preparedMemberDao.getMembers = function (rid, cb) {
    var sql = 'select * from prepared_room_member where rid = ?';
    var args = [rid];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err) {
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {
            var members = [];
            if (res.length > 0) {
                for (var i = 0; i < res.length; i++) {
                    var dbMember = res[i];
                    var member = new PreparedMember({
                        id: dbMember.id, name: dbMember.name, rid: rid
                    });
                    members.push(member);
                }
                utils.invokeCallback(cb, null, members);
            } else {
                utils.invokeCallback(cb, null, []);
            }

        }
    });
};

preparedMemberDao.getActiveMembers = function (rid, cb) {
    var sql = 'select * from prepared_room_member where rid = ? and state = ?';
    var args = [rid, PreparedMember.STATE.ACTIVE];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (!!err) {
            utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
        } else {
            var members = [];
            if (res.length > 0) {
                for (var i = 0; i < res.length; i++) {
                    var dbMember = res[i];
                    var member = new PreparedMember({
                        id: dbMember.id, name: dbMember.name, rid: rid
                    });
                    members.push(member);
                }
                utils.invokeCallback(cb, null, members);
            } else {
                utils.invokeCallback(cb, null, []);
            }

        }
    });
};