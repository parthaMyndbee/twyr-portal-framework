define(
	'twyr-portal/routes/profile',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: eronkanPortal/routes/profile');
		var ManageProfileRoute = _ember['default'].Route.extend({
//			'model': function() {
//				return this.store.find('profile', '<%= userId %>');
//			},
		});

		exports['default'] = ManageProfileRoute;
	}
);