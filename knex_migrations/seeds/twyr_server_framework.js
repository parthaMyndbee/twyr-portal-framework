
exports.seed = function(knex, Promise) {
	var rootTenantId = null,
		rootUserId = null;

	return knex.raw('SELECT id FROM modules WHERE name = ? AND parent_id IS NULL', ['twyr-portal'])
	.then(function(portalId) {
		if(portalId.rows.length)
			return null;

		return knex("modules").insert({ 'name': 'twyr-portal', 'display_name': 'Twyr Portal', 'description': 'The Twy\'r Portal Module - the "Application Class" for the Portal' }).returning('id')
		.then(function(parentId) {
			parentId = parentId[0];
			return Promise.all([
				parentId,
				knex("modules").insert({ 'parent_id': parentId, 'type': 'service', 'name': 'logger-service', 'display_name': 'Logger Service', 'description': 'The Twy\'r Portal Logger Service' }),
				knex("modules").insert({ 'parent_id': parentId, 'type': 'service', 'name': 'cache-service', 'display_name': 'Cache Service', 'description': 'The Twy\'r Portal Cache Service - based on Redis' }),
				knex("modules").insert({ 'parent_id': parentId, 'type': 'service', 'name': 'pubsub-service', 'display_name': 'Publish/Subscribe Service', 'description': 'The Twy\'r Portal Publish/Subscribe Service - based on Ascoltatori' }),
				knex("modules").insert({ 'parent_id': parentId, 'type': 'service', 'name': 'api-service', 'display_name': 'API Service', 'description': 'The Twy\'r Portal API Service - allows modules to expose interfaces for use by other modules without direct references to each other' }),
				knex("modules").insert({ 'parent_id': parentId, 'type': 'service', 'name': 'database-service', 'display_name': 'Database Service', 'description': 'The Twy\'r Portal Database Service - built on top of Knex / Booksshelf and so supports MySQL, PostgreSQL, and a few others' }),
				knex("modules").insert({ 'parent_id': parentId, 'type': 'service', 'name': 'auth-service', 'display_name': 'Authentication Service', 'description': 'The Twy\'r Portal Authentication Service - based on Passport and its infinite strategies' }),
				knex("modules").insert({ 'parent_id': parentId, 'type': 'service', 'name': 'express-service', 'display_name': 'Express Service', 'description': 'The Twy\'r Portal Webserver Service - based on Express and node.js HTTP/HTTPS modules' }),
				knex("modules").insert({ 'parent_id': parentId, 'type': 'service', 'name': 'configuration-service', 'display_name': 'Configuration Service', 'description': 'The Twy\'r Portal Configuration Service' }).returning('id')
				.then(function(configSrvcId) {
					configSrvcId = configSrvcId[0];
					return Promise.all([
						knex("modules").insert({ 'parent_id': configSrvcId, 'type': 'service', 'name': 'file-configuration-service', 'display_name': 'File Configuration Service', 'description': 'The Twy\'r Portal Filesystem-based Configuration Service' }),
						knex("modules").insert({ 'parent_id': configSrvcId, 'type': 'service', 'name': 'database-configuration-service', 'display_name': 'Database Configuration Service', 'description': 'The Twy\'r Portal Database-based Configuration Service' })
					]);
				})
			]);
		})
		.then(function(parentId) {
			parentId = parentId[0];

			return Promise.all([
				knex("permissions").insert({ 'module_id': parentId, 'name': 'public', 'display_name': 'Public User Permissions', 'description': 'The Twy\'r Portal Permissions for non-logged-in Users' }),
				knex("permissions").insert({ 'module_id': parentId, 'name': 'registered', 'display_name': 'Registered User Permissions', 'description': 'The Twy\'r Portal Permissions for logged-in Users' }),
				knex("permissions").insert({ 'module_id': parentId, 'name': 'administrator', 'display_name': 'Administrator Permissions', 'description': 'The Twy\'r Portal Permissions for Administrators' }),
				knex("permissions").insert({ 'module_id': parentId, 'name': 'super-administrator', 'display_name': 'Super Administrator Permissions', 'description': 'The Twy\'r Portal Permissions for Super Administrators' })
			]);
		});
	})
	.then(function() {
		return knex.raw('SELECT id FROM tenants WHERE parent_id IS NULL');
	})
	.then(function(tenantid) {
		if(tenantid.rows.length) {
			return [ tenantid.rows[0]['id'] ];
		}

		return knex("tenants").insert({ 'name': 'Twy\'r Root' }).returning('id');
	})
	.then(function(tenantId) {
		rootTenantId = tenantId[0];
		return knex.raw('SELECT id FROM users WHERE email = \'root@twyr.com\'');
	})
	.then(function(userId) {
		if(userId.rows.length) {
			return [ userId.rows[0]['id'] ];
		}

		return knex("users").insert({ 'email': 'root@twyr.com', 'password': '', 'first_name': 'Root', 'last_name': 'Twyr', 'nickname': 'root' }).returning('id');
	})
	.then(function(userId) {
		rootUserId = userId[0];
		return knex.raw('SELECT id FROM tenants_users WHERE tenant_id = \'' + rootTenantId + '\' AND user_id = \'' + rootUserId + '\';');
	})
	.then(function(rootTenantUserId) {
		if(rootTenantUserId.rows.length) {
			return null;
		}

		return knex("tenants_users").insert({ 'tenant_id': rootTenantId, 'user_id': rootUserId });
	})
	.then(function() {
		return knex.raw('INSERT INTO tenant_user_groups (tenant_id, user_id, group_id) SELECT \'' + rootTenantId + '\', \'' + rootUserId + '\', id FROM groups WHERE tenant_id = \'' + rootTenantId + '\' AND parent_id IS NULL ON CONFLICT DO NOTHING;');
	})
	.then(function() {
		var superAdminGroupId = null,
			adminGroupId = null,
			registeredGroupId = null,
			publicGroupId = null;

		return knex.raw('SELECT id FROM groups WHERE tenant_id = \'' + rootTenantId + '\' AND parent_id IS NULL;')
		.then(function(groupId) {
			superAdminGroupId = groupId.rows[0]['id'];

			return knex('groups').where('id', '=', superAdminGroupId).update({ 'name': 'super-administators', 'display_name': 'Super Administrators', 'description': 'The Super Administrator Group for the root tenant' });
		})
		.then(function() {
			return knex.raw('SELECT id FROM groups WHERE tenant_id = \'' + rootTenantId + '\' AND parent_id = \'' + superAdminGroupId + '\';');
		})
		.then(function(groupId) {
			if(groupId.rows.length) {
				return [ groupId.rows[0]['id'] ];
			}

			return knex('groups').insert({ 'tenant_id': rootTenantId, 'parent_id': superAdminGroupId, 'name': 'administrators', 'display_name': 'Twy\'r Root Administrators', 'description': 'The Administrator Group for the root tenant' }).returning('id');
		})
		.then(function(groupId) {
			adminGroupId = groupId[0];
			return knex.raw('SELECT id FROM groups WHERE tenant_id = \'' + rootTenantId + '\' AND parent_id = \'' + adminGroupId + '\';');
		})
		.then(function(groupId) {
			if(groupId.rows.length) {
				return [ groupId.rows[0]['id'] ];
			}

			return knex('groups').insert({ 'tenant_id': rootTenantId, 'parent_id': adminGroupId, 'name': 'registered-users', 'display_name': 'Twy\'r Registered Users', 'description': 'The Registered User Group for the root tenant' }).returning('id');
		})
		.then(function(groupId) {
			registeredGroupId = groupId[0];
			return knex.raw('SELECT id FROM groups WHERE tenant_id = \'' + rootTenantId + '\' AND parent_id = \'' + registeredGroupId + '\';');
		})
		.then(function(groupId) {
			if(groupId.rows.length) {
				return [ groupId.rows[0]['id'] ];
			}

			return knex('groups').insert({ 'tenant_id': rootTenantId, 'parent_id': registeredGroupId, 'name': 'public', 'display_name': 'Twy\'r Public Users', 'description': 'The public, non-logged-in, Users' }).returning('id');
		})
		.then(function(groupId) {
			publicGroupId = groupId[0];
			return knex.raw('INSERT INTO group_permissions (tenant_id, group_id, module_id, permission_id) SELECT \'' + rootTenantId + '\', \'' + adminGroupId + '\', module_id, id FROM permissions WHERE name NOT IN (\'super-administrator\') ON CONFLICT DO NOTHING;');
		})
		.then(function() {
			return knex.raw('INSERT INTO group_permissions (tenant_id, group_id, module_id, permission_id) SELECT \'' + rootTenantId + '\', \'' + registeredGroupId + '\', module_id, id FROM permissions WHERE name NOT IN (\'super-administrator\', \'administrator\') ON CONFLICT DO NOTHING;');
		})
		.then(function() {
			return knex.raw('INSERT INTO group_permissions (tenant_id, group_id, module_id, permission_id) SELECT \'' + rootTenantId + '\', \'' + publicGroupId + '\', module_id, id FROM permissions WHERE name NOT IN (\'super-administrator\', \'administrator\', \'registered\') ON CONFLICT DO NOTHING;');
		});
	});
};
