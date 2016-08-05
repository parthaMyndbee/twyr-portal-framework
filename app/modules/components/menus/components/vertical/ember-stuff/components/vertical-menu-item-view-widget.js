define(
	'twyr-webapp/components/vertical-menu-item-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/vertical-menu-item-view-widget');
		var VerticalMenuItemViewerWidget = _baseWidget['default'].extend({
			'tagName': 'li',
			'classNames': ['dropdown'],

			'attributeBindings': ['style'],
			'style': 'border-bottom:1px solid #eee; padding:5px 0px;',
			'caretClass': 'fa fa-caret-right'
		});

		exports['default'] = VerticalMenuItemViewerWidget;
	}
);

define(
	'twyr-webapp/components/vertical-component-menu-item-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/vertical-component-menu-item-view-widget');
		var VerticalComponentMenuItemViewerWidget = _baseWidget['default'].extend({
			'tagName': 'li',
			'classNames': ['dropdown'],

			'attributeBindings': ['style'],
			'style': 'border-bottom:1px solid #eee; padding:5px 0px;',
			'caretClass': 'fa fa-caret-right'
		});

		exports['default'] = VerticalComponentMenuItemViewerWidget;
	}
);
