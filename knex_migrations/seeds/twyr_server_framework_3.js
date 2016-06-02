
exports.seed = function(knex, Promise) {
	var portalId = null,
		componentId = null,
		widgetId = null;

	return knex.raw('SELECT id FROM modules WHERE name = ? AND parent_id IS NULL', ['twyr-portal'])
	.then(function(parentId) {
		if(!parentId.rows.length)
			return null;

		portalId = parentId.rows[0].id;
		return knex.raw('SELECT id FROM modules WHERE name = ? AND parent_id = ?', ['profile', portalId]);
	})
	.then(function(existingComponentId) {
		if(existingComponentId.rows.length)
			return null;

		return knex("modules").insert({ 'parent_id': portalId, 'type': 'component', 'name': 'profile', 'display_name': 'Profile Manager', 'description': 'The Twy\'r Portal User Profile Management Component' }).returning('id')
		.then(function(sessionComponentId) {
			componentId = sessionComponentId[0];
			return knex("module_templates").insert({ 'module_id': componentId, 'name': 'default', 'description': 'The default Profile Management Template', 'media_type': 'all', 'user_type': 'registered', 'is_default': true }).returning('id');
		})
		.then(function(templateId) {
			templateId = templateId[0];
			return knex("template_positions").insert({ 'template_id': templateId, 'name': 'module' });
		})
		.then(function() {
			return knex.raw('SELECT id FROM permissions WHERE module_id = ? AND name = ?', [portalId, 'registered']);
		})
		.then(function(registeredPermId) {
			registeredPermId = registeredPermId.rows[0].id;
			return knex("module_widgets").insert({ 'module_id': componentId, 'permission_id': registeredPermId, 'ember_component': 'profile-widget', 'display_name': 'Profile', 'description': 'The Twy\'r Portal Profile Management Widget' }).returning('id');
		})
		.then(function(profileWidgetId) {
			widgetId = profileWidgetId[0];
			return knex.raw('SELECT id FROM template_positions WHERE template_id = (SELECT id FROM module_templates WHERE module_id = ? AND user_type = \'registered\') AND name = \'settings\'', [portalId]);
		})
		.then(function(tmplPositionId) {
			tmplPositionId = tmplPositionId.rows[0].id;
			return knex("widget_template_position").insert({ 'template_position_id': tmplPositionId, 'module_widget_id': widgetId, 'display_order': 9999 });
		});
	});
};
