define(
	'twyr-portal/models/base',
	['exports', 'ember', 'ember-data/model', 'ember-data/attr'],
	function(exports, _ember, _model, _attr) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/models/base');
		var TwyrBaseModel = _model['default'].extend({
			'createdAt': _attr['default']('date', { 'defaultValue': new Date() }),
			'updatedAt': _attr['default']('date', { 'defaultValue': new Date() }),

			'formattedCreatedAt': _ember['default'].computed('createdAt', {
				'get': function(key) {
					return window.moment(this.get('createdAt')).format('DD/MMM/YYYY hh:mm A');
				}
			}).readOnly(),

			'formattedUpdatedAt': _ember['default'].computed('updatedAt', {
				'get': function(key) {
					return window.moment(this.get('updatedAt')).format('DD/MMM/YYYY hh:mm A');
				}
			}).readOnly()
		});

		exports['default'] = TwyrBaseModel;
	}
);
