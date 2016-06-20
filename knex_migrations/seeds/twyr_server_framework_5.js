
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
		return knex.raw('SELECT id FROM modules WHERE name = ? AND parent = ?', ['pages', portalId]);
	})
	.then(function(existingComponentId) {
		if(existingComponentId.rows.length)
			return null;

		return knex("modules").insert({ 'parent': portalId, 'type': 'component', 'name': 'pages', 'display_name': 'Pages Manager', 'description': 'The Twy\'r Portal Pages Management Component' }).returning('id')
		.then(function(sessionComponentId) {
			componentId = sessionComponentId[0];
			return knex("module_templates").insert({ 'module': componentId, 'name': 'pages-default', 'description': 'The default Page Management Template', 'media_type': 'all', 'user_type': 'all', 'is_default': true }).returning('id');
		})
		.then(function() {
			return knex.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [portalId, 'public']);
		})
		.then(function(permId) {
			publicPermId = permId.rows[0].id;
			return knex("module_menus").insert({ 'parent': null, 'module': componentId, 'permission': publicPermId, 'ember_route': 'pages-default', 'icon_class': 'fa fa-html5', 'display_name': 'Page Manager', 'description': 'The default Pages Manager that ships with the Portal', 'tooltip': 'Default Page', 'is_default_home': false });
		});
	});
};
