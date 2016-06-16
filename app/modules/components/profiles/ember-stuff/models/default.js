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
			'homeModuleMenu': _attr['default']('string'),

			'profileContacts': _relationships.hasMany('profile-contact', { 'inverse': 'login', 'async': true }),
			'profileEmergencyContacts': _relationships.hasMany('profile-emergency-contact', { 'inverse': 'login', 'async': true }),
			'profileOthersEmergencyContacts': _relationships.hasMany('profile-others-emergency-contact', { 'inverse': 'contact', 'async': true }),

			'profileSocialLogins': _relationships.hasMany('profile-social-login', { 'inverse': 'login', 'async': true }),

			'formattedDOB': _ember['default'].computed('dob', {
				'get': function(key) {
					return window.moment(this.get('dob')).format('DD MMM YYYY');
				},

				'set': function(key, newValue) {
					this.set('dob', window.moment(newValue, 'DD MMM YYYY').add(12, 'hours').toDate());
					return newValue;
				}
			}),

			'fullName': _ember['default'].computed('firstName', 'lastName', {
				'get': function(key) {
					return this.get('firstName') + ' ' + this.get('lastName');
				}
			}).readOnly()
		});

		exports['default'] = ProfileModel;
	}
);

define(
	'twyr-portal/adapters/profile-contact',
	['exports', 'twyr-portal/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/adapters/profile-contact');

		var ProfileContactsAdapter = _appAdapter['default'].extend({
			'namespace': 'profiles'
		});

		exports['default'] = ProfileContactsAdapter;
	}
);

define(
	'twyr-portal/models/profile-contact',
	['exports', 'twyr-portal/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/models/profile-contact');
		var ProfileContactsModel = _twyrBaseModel['default'].extend({
			'contact': _attr['default']('string'),
			'type': _attr['default']('string', { 'defaultValue': 'other' }),

			'displayType': _ember['default'].computed('type', {
				'get': function(key) {
					return _ember['default'].String.capitalize(this.get('type'));
				}
			}).readOnly(),

			'login': _relationships.belongsTo('profile', { 'inverse': 'profileContacts' })
		});

		exports['default'] = ProfileContactsModel;
	}
);

define(
	'twyr-portal/adapters/profile-emergency-contact',
	['exports', 'twyr-portal/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/adapters/profile-emergency-contact');

		var ProfileEmergencyContactsAdapter = _appAdapter['default'].extend({
			'namespace': 'profiles'
		});

		exports['default'] = ProfileEmergencyContactsAdapter;
	}
);

define(
	'twyr-portal/models/profile-emergency-contact',
	['exports', 'twyr-portal/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/models/profile-emergency-contact');
		var ProfileEmergencyContactsModel = _twyrBaseModel['default'].extend({
			'login': _relationships.belongsTo('profile', { 'inverse': 'profileEmergencyContacts' }),
			'contact': _relationships.belongsTo('profile', { 'inverse': null }),

			'relationship': _attr['default']('string', { 'defaultValue': 'other' }),
			'displayRel': _ember['default'].computed('relationship', {
				'get': function(key) {
					return _ember['default'].String.capitalize(this.get('relationship'));
				}
			}).readOnly(),
		});

		exports['default'] = ProfileEmergencyContactsModel;
	}
);

define(
	'twyr-portal/adapters/profile-others-emergency-contact',
	['exports', 'twyr-portal/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/adapters/profile-others-emergency-contact');

		var ProfileOthersEmergencyContactsAdapter = _appAdapter['default'].extend({
			'namespace': 'profiles'
		});

		exports['default'] = ProfileOthersEmergencyContactsAdapter;
	}
);

define(
	'twyr-portal/models/profile-others-emergency-contact',
	['exports', 'twyr-portal/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/models/profile-others-emergency-contact');
		var ProfileOthersEmergencyContactsModel = _twyrBaseModel['default'].extend({
			'login': _relationships.belongsTo('profile', { 'inverse': null }),
			'contact': _relationships.belongsTo('profile', { 'inverse': 'profileOthersEmergencyContacts' }),

			'relationship': _attr['default']('string', { 'defaultValue': 'other' }),
			'displayRel': _ember['default'].computed('relationship', {
				'get': function(key) {
					return _ember['default'].String.capitalize(this.get('relationship'));
				}
			}).readOnly(),
		});

		exports['default'] = ProfileOthersEmergencyContactsModel;
	}
);

define(
	'twyr-portal/adapters/profile-social-login',
	['exports', 'twyr-portal/adapters/application'],
	function(exports, _appAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/adapters/profile-social-login');

		var ProfileSocialLoginAdapter = _appAdapter['default'].extend({
			'namespace': 'profiles'
		});

		exports['default'] = ProfileSocialLoginAdapter;
	}
);

define(
	'twyr-portal/models/profile-social-login',
	['exports', 'twyr-portal/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/models/profile-social-login');
		var ProfileSocialLoginModel = _twyrBaseModel['default'].extend({
			'provider': _attr['default']('string'),
			'providerUid': _attr['default']('string'),
			'displayName': _attr['default']('string'),

			'login': _relationships.belongsTo('profile', { 'inverse': 'profileSocialLogins' })
		});

		exports['default'] = ProfileSocialLoginModel;
	}
);
