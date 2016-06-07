define(
	'twyr-portal/models/base',
	['exports', 'ember', 'ember-data/model', 'ember-data/attr'],
	function(exports, _ember, _model, _attr) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/models/base');
		var TwyrBaseModel = _model['default'].extend({
			'createdAt': _attr['default']('date'),
			'updatedAt': _attr['default']('date'),

			'formattedDOB': _ember['default'].computed('dob', {
				'get': function(key) {
					return window.moment(this.get('dob')).format('DD MMM YYYY');
				},

				'set': function(key, newValue) {
					this.set('dob', (new Date(newValue)));
				}
			}),

			'formattedCreatedOn': _ember['default'].computed('createdOn', {
				'get': function(key) {
					return window.moment(this.get('createdOn')).format('Do MMM YYYY');
				}
			}).readOnly(),

			'formattedUpdatedOn': _ember['default'].computed('updatedOn', {
				'get': function(key) {
					return window.moment(this.get('updatedOn')).format('Do MMM YYYY');
				}
			}).readOnly()
		});

		exports['default'] = TwyrBaseModel;
	}
);
