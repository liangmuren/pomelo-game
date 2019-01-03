var daoUtils = require('../../util/daoUtils');
var userDao = module.exports;


// 新建用户
userDao.createUser = function (account, password, sex, avatar, cb) {
    var sql = 'insert into user (account, password, sex, url, nickname) values (?, ?, ?, ?, ?)';
    var args = [account, password, sex, avatar, account];
    daoUtils.daoQuery(sql, args, cb);
};

// 重置用户密码
userDao.updatePassword = function (account, newpassword, cb) {
    var sql = 'update user set password = ? where account = ?';
    var args = [newpassword, account];
    daoUtils.daoQuery(sql, args, cb);
};


// 通过UserId查询一个玩家的全部信息
userDao.getUserById = function (userId, cb) {
    var sql = 'select * from user where userId = ?';
    var args = [userId];
    daoUtils.daoQueryResLengthGreaterThanZeroRequireFirst(sql, args, cb);
};

// 通过account获取用户全部信息
userDao.getUserInfo = function (account, cb) {
    var sql = 'select * from user where account = ? ';
    var args = [account];
    daoUtils.daoQueryRequireOnlyResult(sql, args, cb);
};

// 通过account获取用户id
userDao.getUserIdByAccount = function (account, cb) {
    var sql = 'select userId from user where account = ? ';
    var args = [account];
    daoUtils.daoQueryRequireOnlyResult(sql, args, cb);
};


// 通过account查询一个玩家的部分信息  返回account   wool   sex url nickName
userDao.getUserByAccount = function (account, cb) {
    var sql = 'select account, sex, url, nickName from user where account = ?';
    var args = [account];
    daoUtils.daoQueryResLengthGreaterThanZeroRequireFirst(sql, args, cb);
};

// 通过UserId查询一个玩家所有好友的Id
userDao.getFriendsById = function (userId, cb) {
    var sql = 'select * from friend where userId = ?';
    var args = [userId];
    daoUtils.daoQueryReturnEmptyArrayWhenZero(sql, args, cb);
};

// 通过UserId查询一个玩家所有好友的Id
userDao.updateNickname = function (userId, nickname, cb) {
    var sql = 'update user set nickname = ? where userId = ?';
    var args = [nickname, userId];
    daoUtils.daoQuery(sql, args, cb);
};


userDao.uploadAvatar = function (userId, avatar, cb) {
    var sql = 'update user set avatar = ? where userId = ?';
    var args = [avatar, userId];
    daoUtils.daoQuery(sql, args, cb);
};
