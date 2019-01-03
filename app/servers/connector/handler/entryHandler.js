var pomelo = require('pomelo');
var zooRedisKeyService = require('../../../services/crazyzoo/zooRedisKeyService');
var preparedRoomDao = require('../../../dao/common/preparedRoomDao');
var consts = require('../../../util/consts');
module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function (msg, session, next) {
    var self = this;
    var rid = msg.rid;
    var uid = msg.username + '*' + rid;
    var sessionService = self.app.get('sessionService');
    //duplicate log in
    if (!!sessionService.getByUid(uid)) {
        next(null, {
            code: 500,
            error: true
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
    self.app.rpc.crazyZoo.chatRemote.add(session, uid, self.app.get('serverId'), rid, true, function (users) {
        next(null, {
            code: 200,
            users: users
        });
    });
};

handler.reenter = function (msg, session, next) {
    var self = this;
    var username = msg.username;
    var rid = msg.rid;
    var uid = msg.username + '*' + rid;
    var sessionService = self.app.get('sessionService');
    //duplicate log in
    if (!!sessionService.getByUid(uid)) {
        next(null, {
            code: 500,
            error: true
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

    self.app.rpc.crazyZoo.chatRemote.add(session, uid, self.app.get('serverId'), rid, true, function (users) {
        next(null, {
            code: 200,
            users: users
        });
    });
}


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
    app.rpc.crazyZoo.chatRemote.kick(session, session.uid, app.get('serverId'), session.get('rid'), null);

};

handler.getUserState = function (msg, session, next) {
    var username = msg.username;
    var redisClient = pomelo.app.get('redisClient');
    redisClient.get(zooRedisKeyService.userGameRid(username), function (err, reply) {
        if (err) {
            next(null, { code: 500 });
        } else if (!reply) {
            next(null, { code: 200, state: consts.UserState.NONE })
        } else {
            var replyList = reply.split('*');
            var rid = replyList[0];
            var type = replyList[1];
            if (type == 'game') {
                next(null, { code: 200, state: consts.UserState.IN_GAME, rid: rid });
            } else if (type == 'room') {
                preparedRoomDao.getRoom(rid, function (err, room) {
                    if (err||!room) {
                        next(null, { code: 500 });
                    } else {
                        next(null, {
                            code: 200,
                            state: consts.UserState.IN_PRPAREDROOM,
                            rid: rid,
                            isMaster: (username == room.owner),
                            roomNumber: room.name,
                            password: room.password
                        })
                    }
                })
            }
        }
    })
}