define(
	'twyr-webapp/adapters/menus-default',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/menus-default');

		var MenusDefaultAdapter = _appAdapter['default'].extend({
			'namespace': 'menus'
		});

		exports['default'] = MenusDefaultAdapter;
	}
);

define(
	'twyr-webapp/models/menus-default',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/menus-default');
		var MenuModel = _twyrBaseModel['default'].extend({
			'name': _attr['default']('string', { 'defaultValue': 'New Menu' }),

			'type': _attr['default']('string', { 'defaultValue': 'horizontal' }),
			'status': _attr['default']('string', { 'defaultValue': 'draft' }),
			'permission': _attr['default']('string'),

			'menuItems': _relationships.hasMany('menu-item', { 'inverse': 'menu', 'async': true }),

			'menuEditorWidget': _ember['default'].computed('type', {
				'get': function(key) {
					return this.get('type') + '-menu-manager-widget';
				}
			}).readOnly(),

			'displayType': _ember['default'].computed('status', {
				'get': function(key) {
					return _ember['default'].String.capitalize(this.get('type'));
				}
			}).readOnly(),

			'displayStatus': _ember['default'].computed('status', {
				'get': function(key) {
					return _ember['default'].String.capitalize(this.get('status'));
				}
			}).readOnly()
		});

		exports['default'] = MenuModel;
	}
);

define(
	'twyr-webapp/adapters/menu-item',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/menu-item');

		var MenuItemAdapter = _appAdapter['default'].extend({
			'namespace': 'menus'
		});

		exports['default'] = MenuItemAdapter;
	}
);

define(
	'twyr-webapp/models/menu-item',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/menu-item');
		var MenuItemModel = _twyrBaseModel['default'].extend({
			'menu': _relationships.belongsTo('menus-default', { 'inverse': 'menuItems', 'async': true }),

			'parent': _relationships.belongsTo('menu-item', {  'inverse': 'children', 'async': true  }),
			'children': _relationships.hasMany('menu-item', {  'inverse': 'parent', 'async': true  }),

			'componentMenu': _relationships.belongsTo('component-menu', {  'inverse': null, 'async': true  }),

			'iconClass': _attr['default']('string', { 'defaultValue': 'fa fa-bars' }),
			'displayName': _attr['default']('string', { 'defaultValue': 'New Menu Item' }),
			'description': _attr['default']('string', { 'defaultValue': '' }),
			'tooltip': _attr['default']('string', { 'defaultValue': '' }),

			'displayOrder': _attr['default']('number', { 'defaultValue': 0 })
		});

		exports['default'] = MenuItemModel;
	}
);

define(
	'twyr-webapp/adapters/component-menu',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/component-menu');

		var ComponentMenuAdapter = _appAdapter['default'].extend({
			'namespace': 'menus'
		});

		exports['default'] = ComponentMenuAdapter;
	}
);

define(
	'twyr-webapp/models/component-menu',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/component-menu');
		var ComponentMenuModel = _twyrBaseModel['default'].extend({
			'parent': _relationships.belongsTo('component-menu', {  'inverse': 'children', 'async': true  }),
			'children': _relationships.hasMany('component-menu', {  'inverse': 'parent', 'async': true  }),

			'emberRoute': _attr['default']('string'),
			'iconClass': _attr['default']('string'),
			'displayName': _attr['default']('string'),
			'description': _attr['default']('string'),
			'tooltip': _attr['default']('string')
		});

		exports['default'] = ComponentMenuModel;
	}
);
