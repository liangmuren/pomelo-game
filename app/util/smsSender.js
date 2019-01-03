var smsUtils = require('./smsUtils');
var consts = require('../util/consts');
var callback = require('./callback');
var Chance = require('chance');
var smsSender = module.exports;

smsSender.generateVerificationCode = function () {
    var chance = new Chance(Date.now() + Math.random());
    return chance.string(consts.REGISTER_CHECK_CODE);
};

smsSender.sendVerificationCodeMessage = function (phone, verificationCode, next) {
    smsUtils.singleSmsSendWithParam('86', phone, 8698, [verificationCode, '1'], '', '', '', function (data) {
        var ret = JSON.parse(data);
        if (0 !== ret.result) {
            callback.cbInternalError(next, new Error('Require SMS Service failed, code: '
                + JSON.stringify(ret)));
        } else {
            callback.cbOK(next);
        }
    });
};

smsSender.sendReVerificationCodeMessage = function (phone, verificationCode, next) {
    smsUtils.singleSmsSendWithParam('86', phone, 28912, [verificationCode, '1'], '', '', '', function (data) {
        var ret = JSON.parse(data);
        if (0 !== ret.result) {
            callback.cbInternalError(next, new Error('Require SMS Service failed, code: '
                + JSON.stringify(ret)));
        } else {
            callback.cbOK(next);
        }
    });
};