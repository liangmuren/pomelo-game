var exp = module.exports;
var dispatcher = require('./dispatcher');

exp.chat = function(session, msg, app, cb) {
	var chatServers = app.getServersByType('chat');

	if(!chatServers || chatServers.length === 0) {
		cb(new Error('can not find chat servers.'));
		return;
	}

	var res = dispatcher.dispatch(session.get('rid') || 'admin', chatServers);

	cb(null, res.id);
};

exp.crazyZoo = function(session, msg, app, cb) {
	var killerServers = app.getServersByType('crazyZoo');

	if (!killerServers || killerServers.length === 0) {
		cb(new Error('can not find killer servers.'));
		return;
	}
	var res = dispatcher.dispatch(session.get('rid') || 'admin', killerServers);
	cb(null, res.id);
};