define(
	'twyr-webapp/adapters/pages-default',
	['exports', 'twyr-webapp/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/pages-default');

		var PagesDefaultAdapter = _appAdapter['default'].extend({
			'namespace': 'pages'
		});

		exports['default'] = PagesDefaultAdapter;
	}
);

define(
	'twyr-webapp/models/pages-default',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/pages-default');
		var PageModel = _twyrBaseModel['default'].extend({
			'author': _relationships.belongsTo('profile'),

			'title': _attr['default']('string', { 'defaultValue': 'New Page' }),
			'content': _attr['default']('string', { 'defaultValue': 'Enter content here' }),

			'status': _attr['default']('string', { 'defaultValue': 'draft' }),
			'permission': _attr['default']('string'),

			'displayStatus': _ember['default'].computed('status', {
				'get': function(key) {
					return _ember['default'].String.capitalize(this.get('status'));
				}
			}).readOnly()
		});

		exports['default'] = PageModel;
	}
);
