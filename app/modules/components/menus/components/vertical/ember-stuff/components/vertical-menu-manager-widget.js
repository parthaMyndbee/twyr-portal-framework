define(
	'twyr-webapp/components/vertical-menu-manager-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/vertical-menu-manager-widget');
		var VerticalMenuManagerWidget = _baseWidget['default'].extend({
		});

		exports['default'] = VerticalMenuManagerWidget;
	}
);
