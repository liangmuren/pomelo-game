var Consts = require('../../../util/consts');
var crazyZooRoomDao = require('../../../dao/crazyZoo/crazyZooRoomDao');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.createRoom = function(msg,session,next){
    var rid = msg.rid;
    var usernames = msg.usernames || "[]";
    var master = msg.master;
    var self = this;
    crazyZooRoomDao.getRoom(rid, function (err, room) {
        if(err){
            next(null, {code: 400, msg: 'connect mysql error'});
            return;
        }
        if (room && room.id) {
            next(null, {code: 400, msg: 'room already exists'});
            return;
        }
        var userList = JSON.parse(usernames);
        crazyZooRoomDao.createRoom(master, rid, userList, function (err, room) {
            if (room) {
                next(null, {code: 200});
            } else {
                next(null, {code: 400});
            }
        });
    });
}
