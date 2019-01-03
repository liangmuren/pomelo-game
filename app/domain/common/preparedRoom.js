var PreparedRoom = function (opts) {
    this.id = opts.id || 0;
    this.name = opts.name || '';
    this.user_limit = opts.user_limit || '';
    this.hash_name = opts.hash_name || '';
    this.password = opts.password || '';
    this.owner = opts.owner || '';
    this.state = opts.state || this.STATE.OPEN;
};

PreparedRoom.prototype.STATE = {
    OPEN: 1,
    IN_GAME: 2,
    CLOSED: 3
};

module.exports = PreparedRoom;