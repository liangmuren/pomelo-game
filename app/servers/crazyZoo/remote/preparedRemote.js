module.exports = function (app) {
    return new PreparedRemote(app);
};

var PreparedRemote = function (app) {
    this.app = app;
    this.channelService = app.get('channelService');
};

/**
 * Add user into chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 *
 */
PreparedRemote.prototype.add = function (uid, sid, name, flag, cb) {
    var channel = this.channelService.getChannel(name, flag);
    var username = uid.split('*')[0];
    var param = {
        route: 'onPrepared',
        msg: JSON.stringify({
            user: username,
            action: 'enter'
        })
    };

    if (!!channel) {
        channel.add(uid, sid);
    }

    channel.pushMessage(param);

    cb(this.get(name, flag));
};

/**
 * player reconnect
 * @param uid
 * @param sid
 * @param name
 * @param flag
 * @param cb
 */
PreparedRemote.prototype.reenter = function (uid, sid, name, flag, cb) {
    var channel = this.channelService.getChannel(name, flag);
    var username = uid.split('*')[0];
    var param = {
        route: 'onPrepared',
        msg: JSON.stringify({
            user: username,
            action: 'reenter'
        })
    };

    channel.pushMessage(param);

    cb(this.get(name, flag));
};

PreparedRemote.prototype.sendMessageWithAction = function (from, target, content, rid, route, action, cb) {
    var param = {
        route: route,
        msg: content,
        from: from,
        target: target
    };
    var channel = this.channelService.getChannel(rid, false);
    if (!channel) {
        console.error("room does not exist rid: " + rid);
        return;
    }
    // the target is all users
    if (target == '*') {
        channel.pushMessage(param);
    } else {
        // the target is specific user
        var tuid = target + '*' + rid;

        var tsid = channel.getMember(tuid)['sid'];

        this.channelService.pushMessageByUids(param, [{
            uid: tuid,
            sid: tsid
        }]);
    }
    cb();
};

/**
 * Get user from chat channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users uids in channel
 *
 */
PreparedRemote.prototype.get = function (name, flag) {
    var users = [];
    var channel = this.channelService.getChannel(name, flag);
    if (!!channel) {
        users = channel.getMembers();
    }
    for (var i = 0; i < users.length; i++) {
        users[i] = users[i].split('*')[0];
    }
    return users;
};

/**
 * Kick user out chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
PreparedRemote.prototype.kick = function (uid, sid, name, cb) {
    var channel = this.channelService.getChannel(name, false);
    var username = uid.split('*')[0];
    var param = {
        route: 'onPrepared',
        msg: JSON.stringify({
            user: username,
            action: 'leave'
        })
    };
    channel.pushMessage(param);

    // leave channel
    if (!!channel) {
        channel.leave(uid, sid);
    }
    cb();
};

/**
 * player offline
 * @param uid
 * @param sid
 * @param name
 * @param cb
 */
PreparedRemote.prototype.offline = function (uid, sid, name, cb) {
    var channel = this.channelService.getChannel(name, false);
    var username = uid.split('*')[0];
    var param = {
        route: 'onPrepared',
        msg: JSON.stringify({
            user: username,
            action: 'offline'
        })
    };
    channel.pushMessage(param);
    cb();
};
