define(
	'twyr-webapp/components/horizontal-menu-item-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/horizontal-menu-item-view-widget');
		var HorizontalMenuItemViewerWidget = _baseWidget['default'].extend({
			'tagName': 'li',

			'classNames': ['dropdown'],
			'classNameBindings': ['model.isExpanded:open'],

			'attributeBindings': ['style'],
			'style': 'border-bottom:1px solid #eee; padding:5px 0px;',

			'isHorizontal': false,
			'isVertical': false,
			'caretClass': 'fa fa-caret-down',

			'sortedMenuItems': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.set('isHorizontal', (self.get('orientation') == 'horizontal'));
				self.set('isVertical', (self.get('orientation') == 'vertical'));

				if(self.get('orientation') == 'vertical') {
					self.set('caretClass', 'fa fa-caret-down');
				}

				if(self.get('orientation') == 'horizontal') {
					self.set('caretClass', 'fa fa-caret-right');
				}

				self.get('model').get('children')
				.then(function(menuItems) {
					self.set('sortedMenuItems', menuItems.sortBy('displayOrder'));
				})
				.catch(function(err) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'click': function(event) {
				event.stopPropagation();
				event.preventDefault();

				var self = this;
				self.get('model').set('isExpanded', !self.get('model').get('isExpanded'));

				if(!self.get('model').get('isExpanded'))
					return;

				self.get('model').get('componentMenu')
				.then(function(componentMenu) {
					if(!componentMenu)
						return null;

					return componentMenu.get('children');
				})
				.then(function(componentMenuChildren) {
					if(!componentMenuChildren)
						return null;

					if(componentMenuChildren.get('length'))
						return null;

					return self.get('model').get('menu');
				})
				.then(function(menu) {
					if(!menu) return null;
					return menu.get('menuItems');
				})
				.then(function(menuItems) {
					if(!menuItems) return null;
					menuItems.invoke('set', 'isExpanded', false);
				})
				.catch(function(err) {
					console.error(err);
				});
			},

			'caretClassChanged': _ember['default'].observer('model.isExpanded', function() {
				if(this.get('orientation') == 'vertical') {
					if(this.get('model').get('isExpanded'))
						this.set('caretClass', 'fa fa-caret-up');
					else
						this.set('caretClass', 'fa fa-caret-down');
				}

				if(this.get('orientation') == 'horizontal') {
					if(this.get('model').get('isExpanded'))
						this.set('caretClass', 'fa fa-caret-left');
					else
						this.set('caretClass', 'fa fa-caret-right');
				}
			}),

		});

		exports['default'] = HorizontalMenuItemViewerWidget;
	}
);
