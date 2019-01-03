var preparedRoomDao = require('../../../dao/common/preparedRoomDao');
var preparedMemberDao = require('../../../dao/common/preparedMemberDao');
var preparedRoom = require('../../../domain/common/preparedRoom');
var preparedMember = require('../../../domain/common/preparedMember');
var sender = require('../../../util/smsSender');
var utils = require('../../../util/utils');
var consts = require('../../../util/consts');
var async = require('async');
var messageService = require('../../../services/messageService');
var Chance = require('chance');
var uuid = require('uuid');
var zooRedisKeyService = require('../../../services/crazyzoo/zooRedisKeyService');
var pomelo = require('pomelo');
module.exports = function (app) {
    return new GameHandler(app);
};


var GameHandler = function (app) {
    this.app = app;
};
var handler = GameHandler.prototype;

/**
 * used to create room for prepared players
 * @param msg
 * @param session
 * @param next
 */
handler.createPreparedRoom = function (msg, session, next) {
    var self = this;
    var owner = msg.owner;
    var password = msg.password;
    var hashName = uuid.v1();

    self._generateRoomName(function (roomName) {
        preparedRoomDao.createRoom(owner, roomName, password, hashName, function (err, room) {
            if (err) {
                next(null, {code: 400, msg: err});
            } else {
                next(null, {code: 200, name: room.name, hashName: room.hash_name});
            }
        });
    });
};

handler.closePreparedRoom = function (msg, session, next) {
    var roomName = msg.rid;
    var password = msg.password;
    var self = this;
    preparedRoomDao.updateRoom(roomName, password, preparedRoom.prototype.STATE.CLOSED, function (err, room) {
        if (err) {
            next(null, {code: 400});
        } else {
            preparedMemberDao.getActiveMembers(roomName, function (err, members) {
                async.each(members, function (member, callback) {
                    var owner = room.owner;
                    self._sendMessage(owner, member.name, {
                        action: 'roomDismissed'
                    }, roomName, session);
                    callback();
                }, function (err) {
                    next(null, {code: 200});
                });

            });

        }
    });
};

handler.allLeavePreparedRoomToGame = function (msg, session, next) {
    var roomName = msg.rid;
    var hashName = msg.hashName;
    var owner = msg.owner;
    var password = msg.password;
    var self = this;

    preparedRoomDao.getRoom(roomName, function (err, room) {
        if (!room || !room.id) {
            next(null, {code: 401, msg: 'room does not exist'});
            return;
        }
        preparedRoomDao.updateRoom(roomName, password, preparedRoom.prototype.STATE.IN_GAME, function (err, newRoom) {
            if (err) {
                next(null, {code: 400});
            } else {
                console.log('hashName: ' + room.hash_name);
                preparedMemberDao.getActiveMembers(roomName, function (err, members) {
                    async.each(members, function (member, callback) {
                        var name = member.name;
                        self._sendMessage('backgroundAdmin', name, {
                            action: 'intoKillerGame',
                            hashName: room.hash_name
                        }, roomName, session);
                        callback();
                    }, function (err) {
                        console.log('allLeavePreparedRoom: ' + err);
                        next(null, {code: 200});
                    });
                });

            }
        });
    });

};

handler._generateRoomName = function (cb) {
    var self = this;
    var name = self._generateVerificationCode();
    preparedRoomDao.getOpenRoom(name, function (err, room) {
        if (room && room.id) {
            return self._generateRoomName(cb);
        } else {
            return utils.invokeCallback(cb, name);
        }
    });
};

handler._generateVerificationCode = function () {
    var chance = new Chance(Date.now() + Math.random());
    return chance.string(consts.ROOM_GENERATOR_CODE);
};

handler.isRoomExist = function (msg, session, next) {
    var roomName = msg.roomName;
    preparedRoomDao.getRoom(roomName, function (err, room) {
        if (room && room.id) {
            next(null, {code: 200, exist: true});
        } else {
            next(null, {code: 200, exist: false});
        }
    });
};

handler.enterPreparedRoom = function (msg, session, next) {
    var self = this;
    var name = msg.name;
    var password = msg.password;
    var rid = msg.rid;

    if (!rid || !name) {
        next(null, {code: 400, msg: 'param error'});
        return;
    }
    var redisClient = pomelo.app.get('redisClient');
    redisClient.set(zooRedisKeyService.userGameRid(name),rid+'*room');
    preparedRoomDao.getRoomUnderCheck(rid, password, function (err, room) {
        if (err || (!room || !room.id)) {
            next(null, {code: 402, msg: 'not permitted to this room'});
        } else if (room.state === preparedRoom.prototype.STATE.IN_GAME) {
            next(null, {code: 401, hashName: room.hash_name, msg: 'The game has already begun'});
        } else {

            preparedMemberDao.getMember(name, rid, function (err, member) {
                if (member && member.name) {
                    if (member.state === preparedMember.STATE.DEACTIVE) {
                        preparedMemberDao.updateMember(name, rid, preparedMember.STATE.ACTIVE,
                            function (err, member) {
                                self._addUserToChannel(name, rid, room.hash_name, session, next);
                            });

                    } else {
                        next(null, {code: 403, msg: 'user already in room'});
                    }
                } else {
                    preparedMemberDao.createMember(name, rid, function (err, member) {
                        if (err) {
                            next(null, {code: 410, msg: 'unknown error', err: err});
                        } else {
                            self._addUserToChannel(name, rid, room.hash_name, session, next);
                        }
                    });
                }
            });

        }
    });
};

handler.reenterPreparedRoom = function (msg, session, next) {
    var self = this;
    var name = msg.name;
    var password = msg.password;
    var rid = msg.rid;

    if (!rid || !name) {
        next(null, {code: 400});
        return;
    }

    preparedRoomDao.getRoomUnderCheck(rid, password, function (err, room) {
        if (err || (!room || !room.id)) {
            next(null, {code: 400, msg: 'not permitted to this room'});
        } else if (room.state === preparedRoom.prototype.STATE.IN_GAME) {
            next(null, {code: 401, hashName: room.hash_name, msg: 'The game has already begun'});
        } else {
            var uid = name + '*' + rid;
            var sessionService = self.app.get('sessionService');
            if (!!sessionService.getByUid(uid)) {
                // old session can be reused
                next(null, {code: 200, hashName: room.hash_name, msg: 'reenter successfully'});
            } else {
                // set user information for new session
                session.bind(uid);
                session.set('rid', rid);
                session.push('rid', function (err) {
                    if (err) {
                        console.error('set rid for session service failed! error is : %j', err.stack);
                    }
                });
                session.on('closed', onUserLeave.bind(null, self.app));

                self.app.rpc.crazyZoo.preparedRemote.reenter(session, uid, self.app.get('serverId'),
                    rid, true, function (users) {
                        next(null, {
                            code: 200,
                            hashName: room.hash_name,
                            msg: 'reenter successfully',
                            users: users
                        });
                    });
            }
        }
    });
};

handler._addUserToChannel = function (name, rid, hashName, session, next) {
    var self = this;
    var uid = name + '*' + rid;
    var sessionService = self.app.get('sessionService');

    // duplicate log in
    if (!!sessionService.getByUid(uid)) {
        next(null, {
            code: 400,
            msg: 'user already in broadcast channel'
        });
        return;
    }

    session.bind(uid);
    session.set('rid', rid);
    session.push('rid', function (err) {
        if (err) {
            console.error('set rid for session service failed! error is : %j', err.stack);
        }
    });
    session.on('closed', onUserLeave.bind(null, self.app));

    // put user into channel
    self.app.rpc.crazyZoo.preparedRemote.add(session, uid, self.app.get('serverId'),
        rid, true, function (users) {
            next(null, {
                code: 200,
                hashName: hashName,
                users: users
            });
        });
};

handler.leavePreparedRoom = function (msg, session, next) {
    var name = msg.name;
    var rid = msg.rid;
    var self = this;
    preparedMemberDao.updateMember(name, rid, preparedMember.STATE.DEACTIVE, function (err, member) {
        if (err) {
            next(null, {code: 400, err: err});
        } else {
            var uid = name + '*' + rid;
            session.unbind(uid);
            self.app.rpc.crazyZoo.preparedRemote.kick(session, uid,
                self.app.get('serverId'), session.get('rid'), null);

            next(null, {code: 200});


        }
    });
};

handler.getPreparedMembers = function (msg, session, next) {
    var rid = msg.rid;
    var password = msg.password;
    var name = msg.name;

    preparedRoomDao.getRoomUnderCheck(name, password, function (err, room) {
        if (err || !room) {
            next(null, {code: 400, msg: 'not permitted to this room'});
        } else {
            preparedMemberDao.getActiveMembers(rid, function (err, members) {
                next(null, {code: 200, members: JSON.stringify(members)});
            });
        }
    });
};

handler.pingWithDelay = function (msg, session, next) {

    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + 10000) ;

    next(null, {code: 200, msg: 'pong'});

};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function (app, session) {
    if (!session || !session.uid) {
        return;
    }
    app.rpc.crazyZoo.preparedRemote.offline(session, session.uid, app.get('serverId'), session.get('rid'), null);
};

handler._sendMessage = function (from, target, content, rid, session) {
    var self = this;
    var action = content.action || '';
    var str = JSON.stringify(content);
    self.app.rpc.crazyZoo.preparedRemote.sendMessageWithAction(session, from, target, str, rid,
        consts.GameRoute.PREPARED, content.action, null);
};