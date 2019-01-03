/**
 * Initialize a new 'Message' with the given 'opts'.
 *
 * @param {Object} opts
 * @api public
 */

var Message = function (opts) {
    this.id = opts.id;
    this.route = opts.route || '';
    this.uid = opts.uid;
    this.rid = opts.rid;
    this.target = opts.target || '';
    this.action = opts.action || '';
    this.content = opts.content;
    this.tid = this.id;
};

/**
 * Expose 'Entity' constructor
 */

module.exports = Message;