var messageDao = require('../../../dao/common/messageDao');
module.exports = function (app) {
    return new EntryHandler(app);
};


var EntryHandler = function (app) {
    this.app = app;
};

var handler = EntryHandler.prototype;

handler.sendHiToServer = function (msg, session, next) {
    var route = 'onTest';
    var uid = msg.uid;
    var rid = 'testRoom';
    var target = 'server';
    var content = msg.content || {};
    content = JSON.stringify(msg.content);
    var action = 'test';
    if (!uid) {
        // 在这里做一下请求参数的检查
        next(null, {
            code: 400,
            msg: 'bad request'
        });
        return;
    }
    // 数据库操作，如果不是批量的，都按异步处理。批量处理可以参考剪羊毛的实现。
    messageDao.createMessage(route, uid, rid, target, content, function (err, message) {
        if (!!err) {
            // do something
        }
        // 注意msg字段的类型。现在是json对象。如果需要string，使用JSON.stringify转换。
        next(null, {code: 200, msg: message});
    });
};

