define(
	'twyr-portal/models/profile',
	['exports', 'twyr-portal/models/base', 'ember-data/attr'],
	function(exports, _twyrBaseModel, _attr) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/models/profile');
		var ProfileModel = _twyrBaseModel['default'].extend({
			'firstName': _attr['default']('string'),
			'middleNames': _attr['default']('string'),
			'lastName': _attr['default']('string'),
			'gender': _attr['default']('string'),
			'dob': _attr['default']('date'),
			'email': _attr['default']('string'),
			'defaultHome': _attr['default']('string')
		});

		exports['default'] = ProfileModel;
	}
);
