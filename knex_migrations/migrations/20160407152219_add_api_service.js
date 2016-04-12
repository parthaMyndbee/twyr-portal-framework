
exports.up = function(knex, Promise) {
	return Promise.all([
		knex.raw('SELECT id FROM modules WHERE name = ? AND parent_id IS NULL', ['twyr-portal'])
		.then(function(twyrPortalId) {
			return knex("modules").insert({ 'parent_id': twyrPortalId.rows[0].id, 'type': 'service', 'name': 'api-service', 'display_name': 'API Service', 'description': 'The Twy\'r Portal API Service - allows modules to expose interfaces for use by other modules without direct references to each other' });
		})
	]);
};

exports.down = function(knex, Promise) {
	return Promise.all([]);
};
