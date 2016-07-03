define(
	'twyr-webapp/models/module',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/module');
		var ModuleModel = _twyrBaseModel['default'].extend({
			'parent': _relationships.belongsTo('module', { 'inverse': 'children' }),
			'children': _relationships.hasMany('module', { 'inverse': 'parent' }),

			'name': _attr['default']('string'),
			'displayName': _attr['default']('string'),
			'description': _attr['default']('string'),

			'configuration': _attr['default']('string'),
			'metadata': _attr['default']('string'),

			'adminOnly': _attr['default']('boolean'),
			'enabled': _attr['default']('boolean'),

			'permissions': _relationships.hasMany('module-permission', { 'inverse': 'module' }),
			'widgets': _relationships.hasMany('module-widget', { 'inverse': 'module' }),
			'menus': _relationships.hasMany('module-menu', { 'inverse': 'module' }),

			'parsedConfiguration': _ember['default'].computed('configuration', {
				'get': function(key) {
					return JSON.parse(this.get('configuration'));
				},

				'set': function(key, newValue) {
					this.set('configuration', JSON.stringify(newValue));
					return newValue;
				}
			}),

			'parsedMetadata': _ember['default'].computed('metadata', {
				'get': function(key) {
					return JSON.parse(this.get('metadata'));
				}
			}).readOnly()
		});

		exports['default'] = ModuleModel;
	}
);

define(
	'twyr-webapp/adapters/module-permission',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/module-permission');

		var ModulePermissionAdapter = _appAdapter['default'].extend({
			'namespace': 'modules'
		});

		exports['default'] = ModulePermissionAdapter;
	}
);

define(
	'twyr-webapp/models/module-permission',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/module-permission');
		var PermissionModel = _twyrBaseModel['default'].extend({
			'module': _relationships.belongsTo('module', { 'inverse': 'permissions' }),

			'name': _attr['default']('string'),
			'displayName': _attr['default']('string'),
			'description': _attr['default']('string'),

			'widgets': _relationships.hasMany('module-widget', { 'inverse': 'permission' }),
			'menus': _relationships.hasMany('module-menu', { 'inverse': 'permission' })
		});

		exports['default'] = PermissionModel;
	}
);

define(
	'twyr-webapp/adapters/module-widget',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/module-widget');

		var ModuleWidgetAdapter = _appAdapter['default'].extend({
			'namespace': 'modules'
		});

		exports['default'] = ModuleWidgetAdapter;
	}
);

define(
	'twyr-webapp/models/module-widget',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/module-widget');
		var WidgetModel = _twyrBaseModel['default'].extend({
			'module': _relationships.belongsTo('module', { 'inverse': 'widgets' }),
			'permission': _relationships.belongsTo('module-permission', { 'inverse': 'widgets' }),

			'emberComponent': _attr['default']('string'),
			'displayName': _attr['default']('string'),
			'description': _attr['default']('string'),

			'metadata': _attr['default']('string')
		});

		exports['default'] = WidgetModel;
	}
);

define(
	'twyr-webapp/adapters/module-menu',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/module-menu');

		var ModuleMenuAdapter = _appAdapter['default'].extend({
			'namespace': 'modules'
		});

		exports['default'] = ModuleMenuAdapter;
	}
);

define(
	'twyr-webapp/models/module-menu',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/module-menu');
		var MenuModel = _twyrBaseModel['default'].extend({
			'parent': _relationships.belongsTo('module-menu', { 'inverse': 'children' }),
			'children': _relationships.hasMany('module-menu', { 'inverse': 'parent' }),

			'module': _relationships.belongsTo('module', { 'inverse': 'menus' }),
			'permission': _relationships.belongsTo('module-permission', { 'inverse': 'menus' }),

			'emberRoute': _attr['default']('string'),
			'iconClass': _attr['default']('string'),

			'displayName': _attr['default']('string'),
			'description': _attr['default']('string'),
			'tooltip': _attr['default']('string')
		});

		exports['default'] = MenuModel;
	}
);
