var zooRedisKeyService = module.exports;

zooRedisKeyService.channelKey = function (rid) {
    return 'zoo' + rid;
}

zooRedisKeyService.startTimelKey = function (rid) {
    return 'zoo' + rid + 'startTime';
}

zooRedisKeyService.plyaerLockMonsterKey = function (rid) {
    return 'zoo' + rid + 'lockMonster';
}

zooRedisKeyService.rankKey = function(rid){
    return 'zoo' + rid + 'rankKey';
}

zooRedisKeyService.leftMonsterNumKey = function(rid){
    return 'zoo' + rid + 'leftMonsterNum';
}

zooRedisKeyService.userGameRid = function(username){
    return 'zooUser' + username;
}