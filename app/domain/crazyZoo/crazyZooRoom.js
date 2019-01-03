/**
 * Initialize a new 'Message' with the given 'opts'.
 *
 * @param {Object} opts
 * @api public
 */

var crazyZooRoom = function (opts) {
    this.id = opts.id;
    this.rid = opts.rid;
    this.master = opts.master || '';
    this.userList = opts.userList || '[]';
    this.state = opts.state;
};

crazyZooRoom.STATE = {
    OPEN: 1,
    CLOSED: 0
};

/**
 * Expose 'Entity' constructor
 */

module.exports = crazyZooRoom;