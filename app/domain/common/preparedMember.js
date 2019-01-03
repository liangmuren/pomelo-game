var PreparedMember = function (opts) {
    this.id = opts.id || 0;
    this.rid = opts.rid || '';
    this.created_at = opts.created_at;
    this.updated_at = opts.updated_at;
    this.name = opts.name || '';
    this.state = opts.state || PreparedMember.STATE.ACTIVE;
};
PreparedMember.STATE = {
    ACTIVE: 1,
    DEACTIVE: 2,
    END: 3
};
module.exports = PreparedMember;