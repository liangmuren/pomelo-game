var messageDao = require('../dao/common/messageDao');
var messageService = module.exports;

messageService.send = function (from, target, content, rid, route, app) {
    var self = this;
    messageDao.createMessage(route, from, rid, target, content, function (err, message) {
        if (!!err) {
            console.error("messageService create message failed: " + err);
            return;
        }
        var channelService = app.get('channelService');
        var param = {
            route: route,
            msg: content,
            from: from,
            target: target
        };
        var channel = channelService.getChannel(rid, false);

        // the target is all users
        if (target == '*') {
            channel.pushMessage(param);
        } else {
            // the target is specific user
            var tuid = target + '*' + rid;

            var tsid = channel.getMember(tuid)['sid'];

            channelService.pushMessageByUids(param, [{
                uid: tuid,
                sid: tsid
            }]);
        }
    });

};

messageService.sendMessageWithAction = function (from, target, content, rid, route, app, action) {
    messageDao.createMessageWithAction(route, from, rid, target, content, action, function (err, message) {
        if (!!err) {
            console.error("messageService create message failed: " + err);
            return;
        }
        var self = this;

        content = JSON.parse(content);
        content['tid'] = message.id;
        content = JSON.stringify(content);

        var channelService = app.get('channelService');

        var param = {
            route: route,
            msg: content,
            from: from,
            target: target
        };
        var channel = channelService.getChannel(rid, false);
        if (!channel) {
            console.error("channel for rid: " + rid + " not exists");
            return;
        }
        // the target is all users
        if (target == '*') {
            channel.pushMessage(param);
        } else {
            // the target is specific user
            var tuid = target + '*' + rid;

            var tsid = channel.getMember(tuid)['sid'];

            channelService.pushMessageByUids(param, [{
                uid: tuid,
                sid: tsid
            }]);
        }
    });

};

messageService.getLatestBroadcastMessage = function (route, uid, rid, cb) {
    messageDao.getLatestBroadcastMessage(route, uid, rid, cb);
};

messageService.getLatestMessage = function (route, uid, rid, cb) {
    messageDao.getLatestMessage(route, uid, rid, cb);
};

messageService.getLatestMessageExcludeAction = function (route, uid, rid, action, cb) {
    messageDao.getLatestMessageExcludeAction(route, uid, rid, action, cb);
};

messageService.getLatestMessageEqualAction = function (route, uid, rid, action, cb) {
    messageDao.getLatestMessageEqualAction(route, uid, rid, action, cb);
};

messageService.getMessagesAfterTid = function (uid, rid, tid, cb) {
    messageDao.getMessagesAfterTid(uid, rid, tid, cb);
};