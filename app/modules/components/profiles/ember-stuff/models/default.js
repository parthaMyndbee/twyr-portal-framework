define(
	'twyr-portal/models/profile',
	['exports', 'twyr-portal/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/models/profile');
		var ProfileModel = _twyrBaseModel['default'].extend({
			'firstName': _attr['default']('string'),
			'middleNames': _attr['default']('string'),
			'lastName': _attr['default']('string'),
			'gender': _attr['default']('string'),
			'dob': _attr['default']('date', { 'defaultValue': new Date() }),
			'email': _attr['default']('string'),
			'homeModuleMenuId': _attr['default']('string'),

			'contacts': _relationships.hasMany('contact'),

			'formattedDOB': _ember['default'].computed('dob', {
				'get': function(key) {
					return window.moment(this.get('dob')).format('DD MMM YYYY');
				},

				'set': function(key, newValue) {
					this.set('dob', window.moment(newValue, 'DD MMM YYYY').add(12, 'hours').toDate());
					return newValue;
				}
			})
		});

		exports['default'] = ProfileModel;
	}
);

define(
	'twyr-portal/models/contact',
	['exports', 'twyr-portal/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/models/contact');
		var ProfileContactsModel = _twyrBaseModel['default'].extend({
			'contact': _attr['default']('string'),
			'type': _attr['default']('string'),

			'profile': _relationships.belongsTo('profile')
		});

		exports['default'] = ProfileContactsModel;
	}
);
