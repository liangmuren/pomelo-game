module.exports = {
    MESSAGE: {
        OK: 200,
        NEW: 201,
        BAD: 400,
        FAIL: 500,
        PUSH: 600,
        SESSION_ERR: 700,
        ARG_ERR: 800
    },
    ENTRY: {
        FA_TOKEN_INVALID: 1001, // token错误
        FA_TOKEN_EXPIRE: 1002, // token过期
        FA_USER_NOT_EXIST: 1003 // 用户不存在
    },
    NO_USER: 101,		// 无用户
    WRONG_PASSWORD: 102,  // 密码错误
    EXISTED_USER: 103, // 用户已存在
    NOT_EXIST: 104 // 请求的对象不存在
};
