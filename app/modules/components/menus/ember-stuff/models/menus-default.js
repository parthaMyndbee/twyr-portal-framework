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
