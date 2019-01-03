var zooService = module.exports;

/// 怪物初始分布算法，均匀分布，在一个圆形区域内每隔十米放置一个怪物
/// circle 区域中心坐标
/// radius 区域半径
zooService.DistributionFunc = function (circle, radius) {
    var resultList = [];
    const length = 10;
    const latitudeScale = 111000;
    var longitudeScale = 111000 * Math.cos(circle.longitude * Math.PI / 180);
    var longitude, latitude, location;
    var i = 1;
    for (var m = 0; m < radius * 2 / length; m++) {
        for (var n = 0; n < radius * 2 / length; n++) {
            //左上角的点  圆心-radius/10*10
            if ((m - radius / length) * (m - radius / length) * length * length + (n - radius / length) * (n - radius / length) * length * length < radius * radius) {
                longitude = circle.longitude + (m - radius / length) * length / longitudeScale;
                latitude = circle.latitude + (n - radius / length) * length / latitudeScale;
                location = {
                    longitude: longitude.toFixed(6),
                    latitude: latitude.toFixed(6)
                }
                resultList.push(createMonster(i,location));
                i++;
            }
            //double longitude = circle.longitude//需要加距离转换成经纬度的
            //double latitude = r * System.Math.Sin(2 * System.Math.PI * theta) + circle.latitude;
        }
    }
    return resultList;
}

// 根据当前GPS位置，以及设定的移动距离，获取手机当前的指南针朝向，计算怪物逃跑之后的Gps坐标
// loc 当前位置
// distance 移动距离
// compassAngle 指南针角度
zooService.CaculateFacingLocation = function (loc, distance, compassAngle) {
    var x = Math.cos((compassAngle / 180) * Math.PI);
    var y = Math.sin((compassAngle / 180) * Math.PI);
    var longitudeScale = 111000 * Math.cos(loc.longitude * Math.PI / 180);
    var latitudeScale = 111000;
    var rs = new Object();
    rs.latitude = (Number(loc.latitude) + (x * distance) / latitudeScale).toFixed(6);
    rs.longitude = (Number(loc.longitude) + (y * distance) / longitudeScale).toFixed(6);//latitudeScale,longtude是比例尺换算的数字
    return rs;
}

// 判断怪物能否被发现
// currentGps 玩家当前的gps
// monsterGps  怪物的GPS
// distance 距离 单位：米
zooService.isDetectived = function (currentGps, monsterGps, distance1) {
    var longitudeScale = 111000 * Math.cos(currentGps.longitude * Math.PI / 180);
    var latitudeScale = 111000;
    var x = currentGps.latitude - monsterGps.latitude;
    var y = currentGps.longitude - monsterGps.longitude;
    var distance2 = Math.pow(Math.pow(x * longitudeScale, 2) + Math.pow(y * latitudeScale, 2), 0.5);
    return distance1 >= distance2;
}


var createMonster = function (monsterID, location) {
    return {
        monsterID: monsterID,//怪物Id
        HP: 3,//怪物总血量
        location: location,//怪物当前gps
        // prefabName: prefabName,//怪物所用模型名称
        attackList: [],//攻击过该怪物的玩家列表
        isLocked: false,//怪物是否已经被发现
        isDead: false //怪物是否死亡
    }
}


// var circle = {
//     longitude : 30,
//     latitude :30
// }

// console.log(zooService.DistributionFunc(circle,30));

// var monsterList = zooService.DistributionFunc(circle,30);
// monsterList.forEach(element => {
//     console.dir(element);
// });