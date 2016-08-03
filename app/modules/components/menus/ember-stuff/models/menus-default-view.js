define(
	'twyr-webapp/adapters/menus-default-view',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/menus-default-view');

		var MenusDefaultViewAdapter = _appAdapter['default'].extend({
			'namespace': 'menus'
		});

		exports['default'] = MenusDefaultViewAdapter;
	}
);

define(
	'twyr-webapp/models/menus-default-view',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/menus-default-view');
		var MenuViewModel = _twyrBaseModel['default'].extend({
			'name': _attr['default']('string', { 'defaultValue': 'New Menu' }),
			'menuItems': _relationships.hasMany('menu-item-view', { 'inverse': 'menu', 'async': true }),

			'shouldDisplay': _ember['default'].computed('menuItems.@each.shouldDisplay', {
				'get': function(key) {
					return !!this.get('menuItems').filterBy('shouldDisplay', true).length;
				}
			}).readOnly()
		});

		exports['default'] = MenuViewModel;
	}
);

define(
	'twyr-webapp/adapters/menu-item-view',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/menu-item-view');

		var MenuItemViewAdapter = _appAdapter['default'].extend({
			'namespace': 'menus'
		});

		exports['default'] = MenuItemViewAdapter;
	}
);

define(
	'twyr-webapp/models/menu-item-view',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/menu-item-view');
		var MenuItemViewModel = _twyrBaseModel['default'].extend({
			'menu': _relationships.belongsTo('menus-default-view', { 'inverse': 'menuItems', 'async': true }),

			'parent': _relationships.belongsTo('menu-item-view', {  'inverse': 'children', 'async': true  }),
			'children': _relationships.hasMany('menu-item-view', {  'inverse': 'parent', 'async': true  }),

			'componentMenu': _relationships.belongsTo('component-menu-view', {  'inverse': null, 'async': true  }),

			'iconClass': _attr['default']('string', { 'defaultValue': 'fa fa-bars' }),
			'displayName': _attr['default']('string', { 'defaultValue': 'New Menu Item' }),
			'tooltip': _attr['default']('string', { 'defaultValue': '' }),

			'displayOrder': _attr['default']('number', { 'defaultValue': 0 }),

			'shouldDisplay': _ember['default'].computed('componentMenu', 'children.@each.shouldDisplay', {
				'get': function(key) {
					if(this.get('componentMenu') && this.get('componentMenu').get('id')) {
						return true;
					}

					if(this.get('children').filterBy('shouldDisplay', true).length) {
						return true;
					}

					return false;
				}
			}).readOnly()
		});

		exports['default'] = MenuItemViewModel;
	}
);

define(
	'twyr-webapp/adapters/component-menu-view',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/component-menu-view');

		var ComponentMenuViewAdapter = _appAdapter['default'].extend({
			'namespace': 'menus'
		});

		exports['default'] = ComponentMenuViewAdapter;
	}
);

define(
	'twyr-webapp/models/component-menu-view',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/component-menu-view');
		var ComponentMenuViewModel = _twyrBaseModel['default'].extend({
			'parent': _relationships.belongsTo('component-menu-view', {  'inverse': 'children', 'async': true  }),
			'children': _relationships.hasMany('component-menu-view', {  'inverse': 'parent', 'async': true  }),

			'emberRoute': _attr['default']('string'),
			'iconClass': _attr['default']('string'),
			'displayName': _attr['default']('string'),
			'description': _attr['default']('string'),
			'tooltip': _attr['default']('string')
		});

		exports['default'] = ComponentMenuViewModel;
	}
);
