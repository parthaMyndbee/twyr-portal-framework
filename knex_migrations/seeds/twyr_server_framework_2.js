
exports.seed = function(knex, Promise) {
	var portalId = null,
		componentId = null,
		loginWidgetId = null,
		logoutWidgetId = null;

	return knex.raw('SELECT id FROM modules WHERE name = ? AND parent_id IS NULL', ['twyr-portal'])
	.then(function(parentId) {
		if(!parentId.rows.length)
			return null;

		portalId = parentId.rows[0].id;
		return knex.raw('SELECT id FROM modules WHERE name = ? AND parent_id = ?', ['session', portalId]);
	})
	.then(function(existingComponentId) {
		if(existingComponentId.rows.length)
			return null;

		return knex("modules").insert({ 'parent_id': portalId, 'type': 'component', 'name': 'session', 'display_name': 'Session', 'description': 'The Twy\'r Portal Session Management Component' }).returning('id')
		.then(function(sessionComponentId) {
			componentId = sessionComponentId[0];
			return knex.raw('SELECT id FROM permissions WHERE module_id = ? AND name = ?', [portalId, 'public']);
		})
		.then(function(publicPermId) {
			publicPermId = publicPermId.rows[0].id;
			return knex("module_widgets").insert({ 'module_id': componentId, 'permission_id': publicPermId, 'ember_component': 'login-widget', 'display_name': 'Twy\'r Login', 'description': 'The Twy\'r Portal Login Widget' }).returning('id');
		})
		.then(function(loginComponentId) {
			loginWidgetId = loginComponentId[0];
			return knex.raw('SELECT id FROM template_positions WHERE template_id = (SELECT id FROM module_templates WHERE module_id = ? AND user_type = \'public\') AND name = \'right-sidebar\'', [portalId]);
		})
		.then(function(tmplPositionId) {
			tmplPositionId = tmplPositionId.rows[0].id;
			return knex("widget_template_position").insert({ 'template_position_id': tmplPositionId, 'module_widget_id': loginWidgetId, 'display_order': 0 });
		})
		.then(function() {
			return knex.raw('SELECT id FROM permissions WHERE module_id = ? AND name = ?', [portalId, 'registered']);
		})
		.then(function(registeredPermId) {
			registeredPermId = registeredPermId.rows[0].id;
			return knex("module_widgets").insert({ 'module_id': componentId, 'permission_id': registeredPermId, 'ember_component': 'logout-widget', 'display_name': 'Twy\'r Logout', 'description': 'The Twy\'r Portal Logout Widget' }).returning('id');
		})
		.then(function(logoutComponentId) {
			logoutWidgetId = logoutComponentId[0];
			return knex.raw('SELECT id FROM template_positions WHERE template_id = (SELECT id FROM module_templates WHERE module_id = ? AND user_type = \'registered\') AND name = \'settings\'', [portalId]);
		})
		.then(function(tmplPositionId) {
			tmplPositionId = tmplPositionId.rows[0].id;
			return knex("widget_template_position").insert({ 'template_position_id': tmplPositionId, 'module_widget_id': logoutWidgetId, 'display_order': 0 });
		});
	});
};
