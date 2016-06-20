
exports.seed = function(knex, Promise) {
	var portalId = null,
		componentId = null,
		publicPermId = null,
		widgetId = null;

	return knex.raw('SELECT id FROM modules WHERE name = ? AND parent IS NULL', ['twyr-portal'])
	.then(function(parentId) {
		if(!parentId.rows.length)
			return null;

		portalId = parentId.rows[0].id;
		return knex.raw('SELECT id FROM modules WHERE name = ? AND parent = ?', ['homepage', portalId]);
	})
	.then(function(existingComponentId) {
		if(existingComponentId.rows.length)
			return null;

		return knex("modules").insert({ 'parent': portalId, 'type': 'component', 'name': 'homepage', 'display_name': 'Homepage Manager', 'description': 'The Twy\'r Portal Homepage Management Component' }).returning('id')
		.then(function(sessionComponentId) {
			componentId = sessionComponentId[0];
			return knex("module_templates").insert({ 'module': componentId, 'name': 'homepage-home', 'description': 'The default Homepage Management Template', 'media_type': 'all', 'user_type': 'all', 'is_default': true }).returning('id');
		})
		.then(function() {
			return knex.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [portalId, 'public']);
		})
		.then(function(permId) {
			publicPermId = permId.rows[0].id;
			return knex("module_menus").insert({ 'parent': null, 'module': componentId, 'permission': publicPermId, 'ember_route': 'homepage-home', 'icon_class': 'fa fa-home', 'display_name': 'Default Home', 'description': 'The default Home Menu that ships with the Portal', 'tooltip': 'Default Home', 'is_default_home': true });
		});
	});
};
