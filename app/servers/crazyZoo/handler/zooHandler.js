var zooRedisKeyService = require('../../../services/crazyzoo/zooRedisKeyService');
var zooService = require('../../../services/crazyzoo/zooService');
var consts = require('../../../util/consts');
var messageService = require('../../../services/messageService');
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

var pomelo = require('pomelo')
module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var handler = Handler.prototype;

handler.startGame = function (msg, session, next) {
    var self = this;
    var rid = session.get('rid');
    var username = msg.username;
    var longitude = msg.longitude;
    var latitude = msg.latitude;
    var usernames = JSON.parse(msg.usernames) || [];
    var time = msg.time || 5;
    var gps = {
        longitude: longitude,
        latitude: latitude
    }
    var radius = msg.radius || consts.CrazyZooConsts.DEFAULT_RADIUS;
    //计算monsterList
    var monsterList = zooService.DistributionFunc(gps, radius);
    //储存monstelist 
    var redisClient = pomelo.app.get('redisClient');
    monsterList.forEach(element => {
        redisClient.hset(zooRedisKeyService.channelKey(rid), element.monsterID, JSON.stringify(element))
    });
    redisClient.set(zooRedisKeyService.leftMonsterNumKey(rid), monsterList.length);
    var startTime = Date.now();
    redisClient.set(zooRedisKeyService.startTimelKey(rid), startTime+'*'+time);
    // 所有人初始分数设为0并储存
    var usernamesWithScores = [];
    for (var i = 0; i < usernames.length; i++) {
        usernamesWithScores.push(0);
        usernamesWithScores.push(usernames[i]);
    }
    redisClient.zadd(zooRedisKeyService.rankKey(rid), usernamesWithScores);
    //储存用户当前的状态
    usernames.forEach(element => {
        redisClient.setex(zooRedisKeyService.userGameRid(element), 60 * time, rid + '*game');
    })
    // 定时结束游戏并广播
    setTimeoutPromise(time * 60 * 1000).then((value) => {
        redisClient.get(zooRedisKeyService.leftMonsterNumKey(rid), function (err, leftMonsterNum) {
            if (leftMonsterNum > 0) {
                redisClient.zrevrange(zooRedisKeyService.rankKey(rid), 0, -1, 'WITHSCORES', function (err, reply) {
                    var endGameParam;
                    if (err) {
                        endGameParam = {
                            route: consts.GameRoute.ZOO_GAME,
                            msg: {
                                action: consts.CrazyZooAction.END_GAME,
                                // 解析得到的成绩
                                rank: null,
                                err: true
                            },
                            from: '',
                            target: '*'
                        }
                    } else {
                        endGameParam = {
                            route: consts.GameRoute.ZOO_GAME,
                            msg: {
                                action: consts.CrazyZooAction.END_GAME,
                                // 解析得到的成绩
                                rank: parseScores(reply)
                            },
                            from: '',
                            target: '*'
                        }
                    }
                    var channelService = self.app.get('channelService');
                    var channel = channelService.getChannel(rid, false);
                    channel.pushMessage(endGameParam);
                    // 删除redis中数据
                    usernames.forEach(element => {
                        redisClient.del(zooRedisKeyService.userGameRid(element));
                    })
                    redisClient.del(zooRedisKeyService.plyaerLockMonsterKey(rid));
                    redisClient.del(zooRedisKeyService.rankKey(rid));
                    redisClient.del(zooRedisKeyService.leftMonsterNumKey(rid));
                    redisClient.del(zooRedisKeyService.startTimelKey(rid));
                })
            }
        })
    });
    //群发开始游戏通知 monsterList
    var param = {
        route: consts.GameRoute.ZOO_GAME,
        msg: {
            action: consts.CrazyZooAction.START_GAME,
            monsterList: monsterList,
            startTime: startTime
        },
        from: username,
        target: '*'
    };
    var channelService = self.app.get('channelService');
    var channel = channelService.getChannel(rid, false);
    channel.pushMessage(param);
    next(null, {
        code: 200
    });
}

handler.getMonsterList = function (msg, session, next) {
    var rid = session.get('rid');
    var username = msg.username;
    var channelService = this.app.get('channelService');
    var channel = channelService.getChannel(rid, false);
    var monsterList = [];
    //通过channel获取monsterList和time再返回
    var redisClient = pomelo.app.get('redisClient');
    redisClient.hgetall(zooRedisKeyService.channelKey(rid), function (err, monsters) {
        if (err || !monsters) {
            next(null, {
                code: 500,
            });
        } else {
            monsterList = Object.values(monsters);
            var resultMonsterList = [];
            monsterList.forEach((element) => {
                resultMonsterList.push(JSON.parse(element))
            });
            redisClient.get(zooRedisKeyService.startTimelKey(rid), function (err, reply) {
                var replyList = reply.split('*');
                if (err) {
                    next(null, {
                        code: 500,
                    });
                } else {
                    next(null, {
                        code: 200,
                        monsterList: resultMonsterList,
                        leftTime: replyList[1]*60*1000 - (Date.now() - replyList[0])
                    });
                }
            })
        }
    });
}

handler.lock = function (msg, session, next) {
    var self = this;
    var rid = session.get('rid');
    var username = msg.username;
    var monsterID = msg.monsterID;
    var longitude = msg.longitude;
    var latitude = msg.latitude;
    var gps = {
        longitude: longitude,
        latitude: latitude
    }
    var distance1 = msg.distance || consts.CrazyZooConsts.DETECTIVE_DISTANCE;
    var redisClient = pomelo.app.get('redisClient');
    redisClient.hget(zooRedisKeyService.channelKey(rid), monsterID, function (err, Monster) {
        if (err || !Monster) {
            next(null, {
                code: 500,
                lockResult: consts.code.FAIL
            })
        } else {
            var monster = JSON.parse(Monster);
            //检查怪物是否被锁或者已经死亡 检查玩家与怪物之间的距离，是不是小于怪物发现距离
            if (monster.isLocked || monster.isDead || !zooService.isDetectived(gps, monster.location, distance1)) {
                next(null, {
                    code: 500,
                    lockResult: consts.code.FAIL,
                    monster: monster
                })
            } else {
                //锁定怪物
                monster.isLocked = true;
                redisClient.hset(zooRedisKeyService.channelKey(rid), monsterID, JSON.stringify(monster), function (err, reply) {
                    if (err) {
                        next(null, {
                            code: 500,
                            lockResult: consts.code.FAIL,
                            monster: monster
                        })
                    } else {
                        redisClient.hset(zooRedisKeyService.plyaerLockMonsterKey(rid), username, monsterID);
                        //群发消息
                        var param = {
                            route: consts.GameRoute.ZOO_GAME,
                            msg: {
                                action: consts.CrazyZooAction.LOCK_MONSTER,
                                monsterID: monsterID,
                                username: username
                            },
                            from: username,
                            target: '*'
                        };
                        var channelService = self.app.get('channelService');
                        var channel = channelService.getChannel(rid, false);
                        channel.pushMessage(param);
                        next(null, {
                            code: 200,
                            lockResult: consts.code.SUCCESS
                        })
                    }
                });
            }
        }
    });
}

handler.attack = function (msg, session, next) {
    var self = this;
    var rid = session.get('rid');
    var username = msg.username;
    var monsterID = msg.monsterID;
    var compassAngle = msg.compassAngle;
    var monster;
    var escapeDistance = msg.escapeDistance || consts.CrazyZooConsts.ESCAPE_DISTANCE;
    var redisClient = pomelo.app.get('redisClient');
    var channelService = self.app.get('channelService');
    var channel = channelService.getChannel(rid, false);
    redisClient.hget(zooRedisKeyService.channelKey(rid), monsterID, function (err, reply) {
        if (err) {
            next(null, {
                code: 500,
            })
        } else {
            monster = JSON.parse(reply);
            if (monster.isDead || monster.HP <= 0 || !monster.isLocked) {
                next(null, {
                    code: 500,
                    msg: "can't attack"
                });
            } else {
                //成功攻击
                monster.attackList.push(username);
                monster.isLocked = false;
                monster.HP -= 1;
                if (monster.HP == 0) {
                    monster.isDead = true;
                    // 群发消息
                    var param = {
                        route: consts.GameRoute.ZOO_GAME,
                        msg: {
                            action: consts.CrazyZooAction.ATTACK_MONSTER,
                            monster: monster,
                            username: username,
                        },
                        from: username,
                        target: '*'
                    };
                    channel.pushMessage(param);
                    // 记一次得分 剩余怪物数量减一 怪物数量为0后广播游戏结束
                    redisClient.zincrby(zooRedisKeyService.rankKey(rid), 1, username);
                    redisClient.hset(zooRedisKeyService.channelKey(rid), monsterID, JSON.stringify(monster));
                    redisClient.incrby(zooRedisKeyService.leftMonsterNumKey(rid), -1, function (err, leftMonsterNum) {
                        if (leftMonsterNum == 0) {
                            redisClient.zrevrange(zooRedisKeyService.rankKey(rid), 0, -1, 'WITHSCORES', function (err, reply) {
                                if (err) {
                                    next(null, {
                                        code: 500,
                                        msg: "monster already dead"
                                    });
                                } else {
                                    var rank = parseScores(reply);
                                    var endGameParam = {
                                        route: consts.GameRoute.ZOO_GAME,
                                        msg: {
                                            action: consts.CrazyZooAction.END_GAME,
                                            // 解析得到的成绩
                                            rank: rank
                                        },
                                        from: '',
                                        target: '*'
                                    }
                                    channel.pushMessage(endGameParam);
                                    // 删除redis数据
                                    rank.forEach(element => {
                                        redisClient.del(zooRedisKeyService.userGameRid(element.username));
                                    })
                                    redisClient.del(zooRedisKeyService.plyaerLockMonsterKey(rid));
                                    redisClient.del(zooRedisKeyService.rankKey(rid));
                                    redisClient.del(zooRedisKeyService.startTimelKey(rid));
                                    redisClient.del(zooRedisKeyService.leftMonsterNumKey(rid));
                                }
                            })
                        }
                    });
                    next(null, {
                        code: 200,
                    })
                } else {
                    // 群发消息
                    var param = {
                        route: consts.GameRoute.ZOO_GAME,
                        msg: {
                            action: consts.CrazyZooAction.ATTACK_MONSTER,
                            monster: monster,
                            username: username,
                        },
                        from: username,
                        target: '*'
                    };
                    channel.pushMessage(param);
                    monster.location = zooService.CaculateFacingLocation(monster.location, escapeDistance, compassAngle);
                    redisClient.hdel(zooRedisKeyService.plyaerLockMonsterKey(rid), username);
                    redisClient.hset(zooRedisKeyService.channelKey(rid), monsterID, JSON.stringify(monster));
                    next(null, {
                        code: 200,
                    })
                }
            }
        }
    })
}

handler.getLockedMonster = function (msg, session, next) {
    var rid = session.get('rid');
    var username = msg.username;
    var redisClient = pomelo.app.get('redisClient');
    redisClient.hget(zooRedisKeyService.plyaerLockMonsterKey(rid), username, function (err, reply) {
        if (err) {
            next(null, {
                code: 500,
                err: err
            })
        } else if (!reply) {
            next(null, {
                code: 200,
                monsterID: 'none'
            })
        } else {
            next(null, {
                code: 200,
                monsterID: reply
            })
        }
    })
}

// 解析获取的成绩
function parseScores(leaderboard) {
    return chunk(leaderboard, 2).map(function (item, index) {
        return {
            username: item[0],
            score: parseInt(item[1])
        };
    });
}

// 将 array 中每 size 个元素包装为一个数组
function chunk(array, size) {
    return array.reduce(function (res, item, index) {
        if (index % size === 0) {
            res.push([]);
        }
        res[res.length - 1].push(item);
        return res;
    }, []);
}


handler.leaveGame = function (msg, session, next) {
    var username = msg.username;
    var redisClient = pomelo.app.get('redisClient');
    redisClient.del(zooRedisKeyService.userGameRid(username), function (err, reply) {
        if (err) {
            next(null, {
                code: 500
            });
        } else {
            next(null, {
                code: 200
            });
        }
    })
}