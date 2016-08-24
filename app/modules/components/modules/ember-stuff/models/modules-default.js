define(
	'twyr-webapp/adapters/module',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/module');

		var ModulePermissionAdapter = _appAdapter['default'].extend({
		});

		exports['default'] = ModulePermissionAdapter;
	}
);

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

			'metadata': _attr['default']('string'),
			'configuration': _attr['default']('string'),
			'configurationSchema': _attr['default']('string'),

			'adminOnly': _attr['default']('boolean'),
			'enabled': _attr['default']('boolean'),

			'permissions': _relationships.hasMany('module-permission', { 'inverse': 'module' }),
			'widgets': _relationships.hasMany('module-widget', { 'inverse': 'module' }),
			'menus': _relationships.hasMany('module-menu', { 'inverse': 'module' }),
			'templates': _relationships.hasMany('module-template', { 'inverse': 'module' }),

			'parsedConfiguration': _ember['default'].computed('configuration', {
				'get': function(key) {
					return JSON.parse(this.get('configuration'));
				},

				'set': function(key, newValue) {
					this.set('configuration', JSON.stringify(newValue));
					return newValue;
				}
			}),

			'parsedConfigurationSchema': _ember['default'].computed('configurationSchema', {
				'get': function(key) {
					return JSON.parse(this.get('configurationSchema'));
				}
			}).readOnly(),

			'parsedMetadata': _ember['default'].computed('metadata', {
				'get': function(key) {
					return JSON.parse(this.get('metadata'));
				}
			}).readOnly(),

			'categorizedTemplates': _ember['default'].computed('templates.@each.permission', {
				'get': function(key) {
					var templates = this.get('templates'),
						categorizedTmpls = _ember['default'].Object.create({});

					templates.forEach(function(template) {
						var tmplPermission = template.get('permission');
						if(!tmplPermission) {
							return;
						}

						tmplPermission = tmplPermission.get('displayName');
						if(!tmplPermission) {
							return;
						}

						if(!categorizedTmpls.get(tmplPermission)) {
							categorizedTmpls.set(tmplPermission, _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) }));
						}

						categorizedTmpls.get(tmplPermission).addObject(template);
					});

					return categorizedTmpls;
				}
			}).readOnly(),

			'staticDataExists': _ember['default'].computed('permissions', 'widgets', 'menus', {
				'get': function(key) {
					return !!(this.get('permissions').get('length') || this.get('menus').get('length') || this.get('widgets').get('length'));
				}
			}).readOnly(),

			'templateExists': _ember['default'].computed('templates', {
				'get': function(key) {
					return !!(this.get('templates').get('length'));
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
			'menus': _relationships.hasMany('module-menu', { 'inverse': 'permission' }),
			'templates': _relationships.hasMany('module-template', { 'inverse': 'permission' })
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

			'metadata': _attr['default']('string'),

			'positions': _relationships.hasMany('template-position', { 'inverse': 'widgets' }),
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

define(
	'twyr-webapp/adapters/module-template',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/module-template');

		var ModuleTemplateAdapter = _appAdapter['default'].extend({
			'namespace': 'modules'
		});

		exports['default'] = ModuleTemplateAdapter;
	}
);

define(
	'twyr-webapp/models/module-template',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/module-template');
		var TemplateModel = _twyrBaseModel['default'].extend({
			'module': _relationships.belongsTo('module', { 'inverse': 'templates' }),
			'permission': _relationships.belongsTo('module-permission', { 'inverse': 'templates' }),

			'name': _attr['default']('string'),
			'description': _attr['default']('string'),

			'media': _attr['default']('string', { 'defaultValue': 'all' }),
			'isDefault': _attr['default']('boolean'),

			'metadata': _attr['default']('string'),
			'configuration': _attr['default']('string'),
			'configurationSchema': _attr['default']('string'),

			'positions': _relationships.hasMany('template-position', { 'inverse': 'template' }),

			'displayMedia': _ember['default'].computed('media', {
				'get': function(key) {
					return _ember['default'].String.capitalize(this.get('media'));
				}
			}).readOnly(),

			'parsedConfiguration': _ember['default'].computed('configuration', {
				'get': function(key) {
					return JSON.parse(this.get('configuration'));
				},

				'set': function(key, newValue) {
					this.set('configuration', JSON.stringify(newValue));
					return newValue;
				}
			}),

			'parsedConfigurationSchema': _ember['default'].computed('configurationSchema', {
				'get': function(key) {
					return JSON.parse(this.get('configurationSchema'));
				}
			}).readOnly(),

			'parsedMetadata': _ember['default'].computed('metadata', {
				'get': function(key) {
					return JSON.parse(this.get('metadata'));
				}
			}).readOnly()
		});

		exports['default'] = TemplateModel;
	}
);


define(
	'twyr-webapp/adapters/template-position',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/template-position');

		var TemplatePositionAdapter = _appAdapter['default'].extend({
			'namespace': 'modules'
		});

		exports['default'] = TemplatePositionAdapter;
	}
);


define(
	'twyr-webapp/models/template-position',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/template-position');
		var TemplateModel = _twyrBaseModel['default'].extend({
			'name': _attr['default']('string'),
			'template': _relationships.belongsTo('module-template', { 'inverse': 'positions' }),

			'widgets': _relationships.hasMany('module-widget', { 'inverse': 'positions' })
		});

		exports['default'] = TemplateModel;
	}
);
