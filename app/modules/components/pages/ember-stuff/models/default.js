define(
	'twyr-portal/models/page',
	['exports', 'twyr-portal/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/models/page');
		var PageModel = _twyrBaseModel['default'].extend({
			'author': _relationships.belongsTo('profile'),
			'title': _attr['default']('string'),
			'content': _attr['default']('string'),
			'status': _attr['default']('string'),

			'displayStatus': _ember['default'].computed('status', {
				'get': function(key) {
					return _ember['default'].String.capitalize(this.get('status'));
				}
			}).readOnly()
		});

		exports['default'] = PageModel;
	}
);
