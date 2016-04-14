
exports.up = function(knex, Promise) {
	return Promise.all([
		knex.raw('SELECT id FROM modules WHERE name = ? AND parent_id IS NULL', ['twyr-portal'])
		.then(function(twyrPortalId) {
			return Promise.all([
				knex("modules").insert({ 'parent_id': twyrPortalId.rows[0].id, 'type': 'service', 'name': 'auth-service', 'display_name': 'Authentication Service', 'description': 'The Twy\'r Portal Authentication Service - based on Passport and its infinite strategies' }),
				knex("modules").insert({ 'parent_id': twyrPortalId.rows[0].id, 'type': 'service', 'name': 'express-service', 'display_name': 'Express Service', 'description': 'The Twy\'r Portal Webserver Service - based on Express and node.js HTTP/HTTPS modules' })
			]);
		})
	]);
};

exports.down = function(knex, Promise) {
	return Promise.all([]);
};
