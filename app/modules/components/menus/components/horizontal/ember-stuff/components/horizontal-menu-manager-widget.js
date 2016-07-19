define(
	'twyr-webapp/components/horizontal-menu-manager-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/horizontal-menu-manager-widget');
		var HorizontalMenuManagerWidget = _baseWidget['default'].extend({
		});

		exports['default'] = HorizontalMenuManagerWidget;
	}
);
