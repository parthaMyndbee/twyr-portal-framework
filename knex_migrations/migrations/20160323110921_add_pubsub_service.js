
exports.up = function(knex, Promise) {
	return Promise.all([
		knex.raw('SELECT id FROM modules WHERE name = ? AND parent_id IS NULL', ['twyr-portal'])
		.then(function(twyrPortalId) {
			return knex("modules").insert({ 'parent_id': twyrPortalId.rows[0].id, 'type': 'service', 'name': 'pubsub-service', 'display_name': 'Publish/Subscribe Service', 'description': 'The Twy\'r Portal Publish/Subscribe Service - based on Ascoltatori' });
		})
	]);
};

exports.down = function(knex, Promise) {
	return Promise.all([]);
};
