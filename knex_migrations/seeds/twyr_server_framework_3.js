
exports.seed = function(knex, Promise) {
	var portalId = null,
		componentId = null,
		registeredPermId = null,
		widgetId = null;

	return knex.raw('SELECT id FROM modules WHERE name = ? AND parent IS NULL', ['twyr-portal'])
	.then(function(parentId) {
		if(!parentId.rows.length)
			return null;

		portalId = parentId.rows[0].id;
		return knex.raw('SELECT id FROM modules WHERE name = ? AND parent = ?', ['profiles', portalId]);
	})
	.then(function(existingComponentId) {
		if(existingComponentId.rows.length)
			return null;

		return knex("modules").insert({ 'parent': portalId, 'type': 'component', 'name': 'profiles', 'display_name': 'Profile Manager', 'description': 'The Twy\'r Portal User Profile Management Component' }).returning('id')
		.then(function(sessionComponentId) {
			componentId = sessionComponentId[0];
			return knex("module_templates").insert({ 'module': componentId, 'name': 'default', 'description': 'The default Profile Management Template', 'media_type': 'all', 'user_type': 'registered', 'is_default': true }).returning('id');
		})
		.then(function(templateId) {
			templateId = templateId[0];
			return knex("module_template_positions").insert({ 'template': templateId, 'name': 'module' });
		})
		.then(function() {
			return knex.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [portalId, 'registered']);
		})
		.then(function(permId) {
			registeredPermId = permId.rows[0].id;
			return knex("module_widgets").insert({ 'module': componentId, 'permission': registeredPermId, 'ember_component': 'profile-widget', 'display_name': 'Profile', 'description': 'The Twy\'r Portal Profile Management Widget' }).returning('id');
		})
		.then(function(profileWidgetId) {
			widgetId = profileWidgetId[0];
			return knex.raw('SELECT id FROM module_template_positions WHERE template = (SELECT id FROM module_templates WHERE module = ? AND user_type = \'registered\') AND name = \'settings\'', [portalId]);
		})
		.then(function(tmplPositionId) {
			tmplPositionId = tmplPositionId.rows[0].id;
			return knex("module_widget_module_template_positions").insert({ 'template_position': tmplPositionId, 'module_widget': widgetId, 'display_order': 9999 });
		})
		.then(function() {
			return knex("module_menus").insert({ 'parent': null, 'module': componentId, 'permission': registeredPermId, 'ember_route': 'profile', 'icon_class': 'fa fa-user', 'display_name': 'Profile Manager', 'description': 'The Profile Management Menu', 'tooltip': 'Profile Manager', 'is_default_home': false });
		});
	});
};
