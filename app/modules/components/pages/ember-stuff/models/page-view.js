define(
	'twyr-portal/adapters/page-view',
	['exports', 'twyr-portal/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/adapters/page-view');

		var PageViewAdapter = _appAdapter['default'].extend({
			'namespace': 'pages'
		});

		exports['default'] = PageViewAdapter;
	}
);

define(
	'twyr-portal/models/page-view',
	['exports', 'twyr-portal/models/base', 'ember', 'ember-data/attr'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/models/page-view');
		var PageViewModel = _twyrBaseModel['default'].extend({
			'author': _attr['default']('string', { 'defaultValue': 'Anomymous' }),

			'title': _attr['default']('string', { 'defaultValue': 'New Page' }),
			'content': _attr['default']('string', { 'defaultValue': 'Enter content here' })
		});

		exports['default'] = PageViewModel;
	}
);
