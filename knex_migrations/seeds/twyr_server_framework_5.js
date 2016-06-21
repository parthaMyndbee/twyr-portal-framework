
exports.seed = function(knex, Promise) {
	var portalId = null,
		componentId = null,
		authorPermId = null;

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

		return knex("modules").insert({ 'parent': portalId, 'type': 'component', 'name': 'pages', 'display_name': 'Pages Manager', 'description': 'The Twy\'r Portal Pages Management Component', 'admin_only': true }).returning('id')
		.then(function(pagesComponentId) {
			componentId = pagesComponentId[0];
			return Promise.all([
				knex("module_templates").insert({ 'module': componentId, 'name': 'pages-default', 'description': 'The default Page Management Template', 'media_type': 'all', 'user_type': 'all', 'is_default': true }),
				knex("module_templates").insert({ 'module': componentId, 'name': 'page-view', 'description': 'The default Page View Template', 'media_type': 'all', 'user_type': 'all', 'is_default': true })
			]);
		})
		.then(function() {
			return knex("module_permissions").insert({ 'module': componentId, 'name': 'page-author', 'display_name': 'Page Author Permission', 'description': 'Allows the User to create / edit / remove PAges in the Portal' }).returning('id');
		})
		.then(function(permId) {
			authorPermId = permId[0];
			return knex("module_menus").insert({ 'parent': null, 'module': componentId, 'permission': authorPermId, 'ember_route': 'pages-default', 'icon_class': 'fa fa-html5', 'display_name': 'Page Manager', 'description': 'The default Pages Manager that ships with the Portal', 'tooltip': 'Default Page', 'is_default_home': false });
		});
	});
};
