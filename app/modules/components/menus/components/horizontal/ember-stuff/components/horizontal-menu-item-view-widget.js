define(
	'twyr-webapp/components/horizontal-menu-item-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/horizontal-menu-item-view-widget');
		var HorizontalMenuItemViewerWidget = _baseWidget['default'].extend({
			'tagName': 'li',
			'classNames': ['dropdown'],

			'attributeBindings': ['style'],
			'style': _ember['default'].String.htmlSafe('border-bottom:1px solid #eee; padding:5px 0px;'),

			'isHorizontal': false,
			'isVertical': false,
			'caretClass': 'fa fa-caret-down',

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.set('isHorizontal', (self.get('orientation') == 'horizontal'));
				self.set('isVertical', (self.get('orientation') == 'vertical'));
			}
		});

		exports['default'] = HorizontalMenuItemViewerWidget;
	}
);

define(
	'twyr-webapp/components/horizontal-component-menu-item-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/horizontal-component-menu-item-view-widget');
		var HorizontalComponentMenuItemViewerWidget = _baseWidget['default'].extend({
			'tagName': 'li',

			'classNames': ['dropdown'],

			'attributeBindings': ['style'],
			'style': _ember['default'].String.htmlSafe('border-bottom:1px solid #eee; padding:5px 0px;'),

			'isHorizontal': false,
			'isVertical': false,
			'caretClass': 'fa fa-caret-down',

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.set('isHorizontal', (self.get('orientation') == 'horizontal'));
				self.set('isVertical', (self.get('orientation') == 'vertical'));
			}
		});

		exports['default'] = HorizontalComponentMenuItemViewerWidget;
	}
);
