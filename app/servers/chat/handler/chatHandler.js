var chatRemote = require('../remote/chatRemote');
var messageDao = require('../../../dao/common/messageDao');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

/**
 * Send messages to users
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param  {Function} next next stemp callback
 *
 */
handler.send = function (msg, session, next) {
    var rid = session.get('rid');
    var username = session.uid.split('*')[0];
    var channelService = this.app.get('channelService');
    var param = {
        route: 'onChat',
        msg: msg.content,
        from: username,
        target: msg.target
    };
    var channel = channelService.getChannel(rid, false);

    //the target is all users
    if (msg.target == '*') {
        channel.pushMessage(param);
    }
    // the target is specific user
    else {
        var tuid = msg.target + '*' + rid;
        var tsid = channel.getMember(tuid)['sid'];
        channelService.pushMessageByUids(param, [{
            uid: tuid,
            sid: tsid
        }]);
    }
    messageDao.createMessage('onChat', username, rid, msg.target, msg.content, function (err, message) {
        if (err != null) {
            console.log('create message fail');
        } else {
            console.log('create message success');
        }
    });
    next(null, {
        route: msg.route
    });
};