var userDao = require('../../../dao/common/userDao');
var statusCode = require('../../../util/statusCode');
var secret = require('../../../../config/session').secret;
var Token = require('../../../util/token');
var utils = require('../../../util/utils');
var callback = require('../../../util/callback');
var consts = require('../../../util/consts');
var redisDB = require('../../../util/redisDB');
var sender = require('../../../util/smsSender');
var async = require('async');
var pomelo = require('pomelo');
var validator = require('validator');
var Chance = require('chance');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.login = function (msg, session, next) {
    var account = msg.account;
    if (utils.isEmptyString(account)) {
        callback.cbArgError(next, 'account');
        return;
    }
    var password = msg.password;
    if (utils.isEmptyString(password)) {
        callback.cbArgError(next, 'password');
        return;
    }
    userDao.getUserInfo(account, function (err, res) {
        if (!!err) {
            callback.cbInternalError(next, err);
        } else if (res === null) {
            callback.cbByCode(next, null, statusCode.NO_USER);
        } else if (password !== res.password) {
            callback.cbByCode(next, null, statusCode.WRONG_PASSWORD);
        } else {
            var token = Token.create(res.userId, Date.now(), secret);
            callback.cbOKWithRes(next, {
                token: token
            });
        }
    });
};

/**
 *
 * @param msg {account:'xxx', password: 'xxx', sex: 'xxx', url: 'xxx'}
 * @param session
 * @param next
 */
handler.register = function (msg, session, next) {
    var account = msg.account;
    if (utils.isEmptyString(account)) {
        callback.cbArgError(next, 'account');
        return;
    }
    if (!validator.isMobilePhone(account, 'zh-CN')) {
        callback.cbArgError(next, 'account is not a valid phone number');
        return;
    }
    var password = msg.password;
    if (utils.isEmptyString(password)) {
        callback.cbArgError(next, 'password');
        return;
    }
    var sex = msg.sex || '';
    var url = msg.url || '';
    userDao.getUserInfo(account, function (err, res) {
        if (!!err) {
            callback.cbInternalError(next, err);
            return;
        }
        if (res) {
            callback.cbByCode(next, null, statusCode.EXISTED_USER);
            return;
        }
        var redisClient = pomelo.app.get('redisClient');
        redisClient.select(redisDB.USER, function (error) {
            if (error) {
                callback.cbInternalError(next, error);
                return;
            }
            var time = Date.now().toLocaleString();
            var verificationCode = sender.generateVerificationCode();
            var info = {
                operationType: consts.USER_OPERATION_TYPE.REGISTER,
                password: password,
                sex: sex,
                url: url,
                requestTime: time,
                verificationCode: verificationCode
            };
            redisClient.hmset(account, info, function (error) {
                if (error) {
                    callback.cbInternalError(next, error);
                } else {
                    sender.sendVerificationCodeMessage(account, verificationCode, next);
                }
            });
        });
    });
};

handler.resendCode = function (msg, session, next) {
    var account = msg.account;
    if (utils.isEmptyString(account)) {
        callback.cbArgError(next, 'account');
        return;
    }
    if (!validator.isMobilePhone(account, 'zh-CN')) {
        callback.cbArgError(next, 'account is not a valid phone number');
        return;
    }
    userDao.getUserInfo(account, function (err, user) {
        if (!!err) {
            callback.cbInternalError(next, err);
            return;
        }
        if (user) {
            callback.cbByCode(next, null, statusCode.EXISTED_USER);
            return;
        }
        var redisClient = pomelo.app.get('redisClient');
        redisClient.select(redisDB.USER, function (error) {
            if (error) {
                callback.cbInternalError(next, error);
                return;
            }
            redisClient.hgetall(account, function (error, res) {
                if (error) {
                    callback.cbInternalError(next, error);
                    return;
                }
                if (!res) {
                    callback.cbArgError(next, 'That user is not in register session');
                    return;
                }
                var lastSendCodeDate = new Date(res.requestTime);
                if (Date.now() - lastSendCodeDate <= 60) {
                    callback.cbArgError(next, 'You request the code again' +
                        ' within 1 minute');
                    return;
                }
                var time = Date.now().toLocaleString();
                var chance = new Chance(Date.now() + Math.random());
                var verificationCode = chance.string(consts.REGISTER_CHECK_CODE);
                var info = {
                    requestTime: time,
                    verificationCode: verificationCode
                };
                redisClient.hmset(account, info, function (error) {
                    if (error) {
                        callback.cbInternalError(next, error);
                    } else {
                        sender.sendVerificationCodeMessage(account, verificationCode, next);
                    }
                });
            });
        });
    });
};

handler.verifyCode = function (msg, session, next) {
    var account = msg.account;
    if (utils.isEmptyString(account)) {
        callback.cbArgError(next, 'account');
        return;
    }
    if (!validator.isMobilePhone(account, 'zh-CN')) {
        callback.cbArgError(next, 'account is not a valid phone number');
        return;
    }
    var verifyCode = msg.verifyCode;
    if (utils.isEmptyString(verifyCode)) {
        callback.cbArgError(next, 'verifyCode');
        return;
    }
    var redisClient = pomelo.app.get('redisClient');
    redisClient.select(redisDB.USER, function (error) {
        if (error) {
            callback.cbInternalError(next, error);
            return;
        }
        redisClient.hgetall(account, function (error, res) {
            if (error) {
                callback.cbInternalError(next, error);
                return;
            }
            if (!res) {
                callback.cbArgError(next, 'That user is not in user operation session');
                return;
            }
            var lastSendCodeDate = new Date(res.requestTime);
            if (Date.now() - lastSendCodeDate >= 1 * 60) {
                callback.cbArgError(next, 'The code has expired.' +
                    ' Please request the code again');
                return;
            }
            if (res.verificationCode !== verifyCode) {
                callback.cbArgError(next, 'Wrong verification code');
                return;
            }
            switch (parseInt(res.operationType)) {
                case consts.USER_OPERATION_TYPE.REGISTER:
                    userDao.getUserInfo(account, function (err, user) {
                        if (!!err) {
                            callback.cbInternalError(next, err);
                            return;
                        }
                        if (user) {
                            callback.cbByCode(next, null, statusCode.EXISTED_USER);
                            return;
                        }
                        userDao.createUser(account, res.password, res.sex, res.url, function (err, result) {
                            if (err || !result) {
                                callback.cbInternalError(next, err);
                            } else {
                                redisClient.del(account);
                                callback.cbOK(next);
                            }
                        });
                    });
                    break;
                case consts.USER_OPERATION_TYPE.RESET_PASSWORD:
                    var info = {
                        verified: 1
                    };
                    redisClient.hmset(account, info, function (error) {
                        if (error) {
                            callback.cbInternalError(next, error);
                        } else {
                            callback.cbOK(next);
                        }
                    });
                    break;
                default:
                    callback.cbInternalError(next, new Error('Wrong user operation type'));
            }
        });
    });
};

handler.updateNickname = function (msg, session, next) {
    var ownerId = session.get('userId');
    if (utils.isEmptyString(ownerId)) {
        callback.cbSessionError(next, 'userId');
        return;
    }
    var nickname = msg.nickname;
    if (utils.isEmptyString(nickname)) {
        callback.cbArgError(next, 'nickname');
        return;
    }
    async.waterfall([
        function (cb) {
            userDao.updateNickname(userId, nickname, cb);
        }, function (res, cb) {
            if (!res) {
                callback.cbInternalError(next, new Error('no result'));
                return;
            }
            session.set('nickName', nickname);
            session.pushAll(cb);
        }
    ], function (err) {
        if (err) {
            callback.cbInternalError(next, err);
        } else {
            callback.cbOK(next);
        }
    });
};

handler.resetPasswordRequest = function (msg, session, next) {
    var account = msg.account;
    if (utils.isEmptyString(account)) {
        callback.cbArgError(next, 'account');
        return;
    }
    var redisClient = pomelo.app.get('redisClient');
    redisClient.select(redisDB.USER, function (error) {
        if (error) {
            callback.cbInternalError(next, error);
            return;
        }
        var time = Date.now().toLocaleString();
        var verificationCode = sender.generateVerificationCode();
        var info = {
            operationType: consts.USER_OPERATION_TYPE.RESET_PASSWORD,
            verified: 0,
            requestTime: time,
            verificationCode: verificationCode
        };
        redisClient.hmset(account, info, function (error) {
            if (error) {
                callback.cbInternalError(next, error);
            } else {
                sender.sendReVerificationCodeMessage(account, verificationCode, next);
            }
        });
    });
};

handler.resetPassword = function (msg, session, next) {
    var account = msg.account;
    if (utils.isEmptyString(account)) {
        callback.cbArgError(next, 'account');
        return;
    }
    var newPassword = msg.password;
    if (utils.isEmptyString(newPassword)) {
        callback.cbArgError(next, 'newPassword');
        return;
    }
    var redisClient = pomelo.app.get('redisClient');
    redisClient.select(redisDB.USER, function (error) {
        if (error) {
            callback.cbInternalError(next, error);
            return;
        }
        redisClient.hgetall(account, function (error, res) {
            if (error) {
                callback.cbInternalError(next, error);
                return;
            }
            if (!res) {
                callback.cbArgError(next, 'That user is not in reset password session');
                return;
            }
            if (parseInt(res.operationType) !== consts.USER_OPERATION_TYPE.RESET_PASSWORD) {
                callback.cbArgError(next, 'You are not resetting password');
                return;
            }
            if (parseInt(res.verified) !== 1) {
                callback.cbArgError(next, 'You have not passed the verification');
                return;
            }
            userDao.updatePassword(account, newPassword, function (err, res) {
                if (err || !res) {
                    callback.cbInternalError(next, err);
                } else {
                    redisClient.del(account);
                    callback.cbOK(next);
                }
            });
        });
    });
};

handler.viewUserProfile = function (msg, session, next) {
    var account = msg.account;
    if (utils.isEmptyString(account)) {
        callback.cbArgError(next, 'account');
        return;
    }
    userDao.getUserByAccount(account, function (err, res) {
        if (err || !res) {
            callback.cbInternalError(next, err);
        } else {
            callback.cbOKWithRes(next, res);
        }
    });
};
