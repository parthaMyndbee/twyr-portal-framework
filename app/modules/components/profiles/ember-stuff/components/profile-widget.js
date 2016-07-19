define(
	'twyr-webapp/components/profile-widget',
	['exports', 'ember', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/profile-widget');
		var ProfileWidget = _baseWidget['default'].extend({
		});

		exports['default'] = ProfileWidget;
	}
);
