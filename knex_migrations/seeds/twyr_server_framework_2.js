
exports.seed = function(knex, Promise) {
	var portalId = null,
		componentId = null,
		loginWidgetId = null,
		logoutWidgetId = null;

	return knex.raw('SELECT id FROM modules WHERE name = ? AND parent IS NULL', ['twyr-portal'])
	.then(function(parentId) {
		if(!parentId.rows.length)
			return null;

		portalId = parentId.rows[0].id;
		return knex.raw('SELECT id FROM modules WHERE name = ? AND parent = ?', ['session', portalId]);
	})
	.then(function(existingComponentId) {
		if(existingComponentId.rows.length)
			return null;

		return knex("modules").insert({ 'parent': portalId, 'type': 'component', 'name': 'session', 'display_name': 'Session', 'description': 'The Twy\'r Portal Session Management Component' }).returning('id')
		.then(function(sessionComponentId) {
			componentId = sessionComponentId[0];
			return knex.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [portalId, 'public']);
		})
		.then(function(publicPermId) {
			publicPermId = publicPermId.rows[0].id;
			return knex("module_widgets").insert({ 'module': componentId, 'permission': publicPermId, 'ember_component': 'login-widget', 'display_name': 'Twy\'r Login', 'description': 'The Twy\'r Portal Login Widget' }).returning('id');
		})
		.then(function(loginComponentId) {
			loginWidgetId = loginComponentId[0];
			return knex.raw('SELECT id FROM module_template_positions WHERE template = (SELECT id FROM module_templates WHERE module = ? AND user_type = \'public\') AND name = \'right-sidebar\'', [portalId]);
		})
		.then(function(tmplPositionId) {
			tmplPositionId = tmplPositionId.rows[0].id;
			return knex("module_widget_module_template_positions").insert({ 'template_position': tmplPositionId, 'module_widget': loginWidgetId, 'display_order': 0 });
		})
		.then(function() {
			return knex.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [portalId, 'registered']);
		})
		.then(function(registeredPermId) {
			registeredPermId = registeredPermId.rows[0].id;
			return knex("module_widgets").insert({ 'module': componentId, 'permission': registeredPermId, 'ember_component': 'logout-widget', 'display_name': 'Twy\'r Logout', 'description': 'The Twy\'r Portal Logout Widget' }).returning('id');
		})
		.then(function(logoutComponentId) {
			logoutWidgetId = logoutComponentId[0];
			return knex.raw('SELECT id FROM module_template_positions WHERE template = (SELECT id FROM module_templates WHERE module = ? AND user_type = \'registered\') AND name = \'settings\'', [portalId]);
		})
		.then(function(tmplPositionId) {
			tmplPositionId = tmplPositionId.rows[0].id;
			return knex("module_widget_module_template_positions").insert({ 'template_position': tmplPositionId, 'module_widget': logoutWidgetId, 'display_order': 10000 });
		});
	});
};
