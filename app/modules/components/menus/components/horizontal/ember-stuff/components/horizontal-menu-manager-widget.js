define(
	'twyr-webapp/components/horizontal-menu-manager-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/horizontal-menu-manager-widget');
		var HorizontalMenuManagerWidget = _baseWidget['default'].extend({
			'_availableMenus': null,
			'_dragula': null,

			'sortedMenuItems': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);
				self._uninitDragula();

				if(!self.get('model')) {
					return;
				}

				self.get('model').get('menuItems')
				.then(function(menuItems) {
					self.set('sortedMenuItems', menuItems.sortBy('displayOrder'));
				})
				.catch(function(err) {
					self.set('sortedMenuItems', undefined);
				});

				self.get('store')
				.findAll('component-menu')
				.then(function(allMenus) {
					self.set('_availableMenus', allMenus);
					self._initDragula();
				})
				.catch(function(err) {
					console.error(window.apiServer + 'menus/component-menus error:\n', arguments);
				});
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				self._uninitDragula();
			},

			'onMenuItemsChanged': _ember['default'].observer('model.menuItems.length', 'model.menuItems.@each.displayOrder', function() {
				var self = this;

				this.get('model').get('menuItems')
				.then(function(menuItems) {
					self.set('sortedMenuItems', menuItems.sortBy('displayOrder'));
				})
				.catch(function(err) {
					self.set('sortedMenuItems', undefined);
				});
			}),

			'_initDragula': function() {
				var self = this;
				self._uninitDragula();

				var availableMenuContainer = self.$('div#horizontal-menu-manager-widget-available-component-menus-' + self.get('model').get('id'))[0];

				self.set('_dragula', dragula([availableMenuContainer], {
					'copy': function(element, source) {
						return (source === availableMenuContainer);
					},

					'isContainer': function(element) {
						return (window.$(element).hasClass('dragula-container'));
					},

					'direction': 'horizontal',
					'revertOnSpill': false,
					'removeOnSpill': true
				}));

				self.get('_dragula')
				.on('drop', function(element, target, source, sibling) {
					element = window.$(element);

					if(element.prop('tagName').toLowerCase() == 'div') {
						var droppedMenu = window.$(target),
							componentMenuId = null,
							parentId = ((droppedMenu.parents('li.open')[0]) ? window.$(droppedMenu.parents('li.open').children('a')[0]).attr('id') : null);

						if(element.attr('id') !== 'empty-menu-item') {
							componentMenuId = element.attr('id');
						}

						element.remove();

						self.set('sortedMenuItems', undefined);
						_ember['default'].run.scheduleOnce('afterRender', function() {
							self['add-menu-item']({
								'componentMenuId': componentMenuId,
								'parentId': parentId
							});
						});

						return;
					}

					if(element.prop('tagName').toLowerCase() == 'li') {
						var droppedMenu = window.$(target);
						self['reorder-menu-item']({
							'parent': droppedMenu
						});
					}
				})
				.on('remove', function(element, container, source) {
					var menuItemId = window.$(window.$(element).children('a')[0]).attr('id'),
						menuItem = (self.get('store').peekAll('menu-item').filterBy('id', menuItemId))[0];

					self.set('sortedMenuItems', undefined);
					_ember['default'].run.scheduleOnce('afterRender', function() {
						self['remove-menu-item']({
							'menuItem': menuItem,
							'source': source
						});
					});
				});
			},

			'_uninitDragula': function() {
				var self = this;

				if(self.get('_dragula') && self.get('_dragula').destroy) {
					self.get('_dragula').destroy();
				}
			},

			'add-menu-item': function(data) {
				var self = this,
					componentMenu = (data.componentMenuId ? self.get('store').peekRecord('component-menu', data.componentMenuId) : null),
					parentMenuItem = (data.parentId ? self.get('store').peekRecord('menu-item', data.parentId) : null),
					menuItem = self.get('store').createRecord('menu-item', {
						'id': _app['default'].UUID(),
						'menu': self.get('model'),
						'parent': parentMenuItem,
						'componentMenu': componentMenu
					});

				self.get('model').get('menuItems')
				.then(function(menuItems) {
					menuItems.addObject(menuItem);
					if(!parentMenuItem) return null;

					return parentMenuItem.get('children');
				})
				.then(function(children) {
					if(!children) return null;
					children.addObject(menuItem);
				})
				.catch(function(err) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'reorder-menu-item': function(data) {
				var self = this,
					menuItems = data.parent.children('li');

				_ember['default'].run.begin();
				window.$.each(menuItems, function(index, menuItem) {
					if(window.$(menuItem).hasClass('divider'))
						return;

					var menuItemRecord = self.get('store').peekRecord('menu-item', window.$(window.$(menuItem).children('a')[0]).attr('id'));
					menuItemRecord.set('displayOrder', index);
				});
				_ember['default'].run.end();
			},

			'remove-menu-item': function(data) {
				var self = this;

				self.get('model').get('menuItems')
				.then(function(menuItems) {
					menuItems.removeObject(data.menuItem);
					return data.menuItem.get('parent');
				})
				.then(function(parent) {
					if(!parent) return null;
					return parent.get('children');
				})
				.then(function(children) {
					if(!children) return null;

					children.removeObject(data.menuItem);
					data.menuItem.deleteRecord();
					return null;
				})
				.catch(function(err) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			}
		});

		exports['default'] = HorizontalMenuManagerWidget;
	}
);

define(
	'twyr-webapp/components/horizontal-menu-item-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/horizontal-menu-item-widget');
		var HorizontalMenuItemWidget = _baseWidget['default'].extend({
			'tagName': 'li',
			'classNames': ['dropdown'],
			'classNameBindings': ['isExpanded:open'],
			'isExpanded': false,

			'sortedMenuItems': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.get('model').get('children')
				.then(function(menuItems) {
					self.set('sortedMenuItems', menuItems.sortBy('displayOrder'));
				})
				.catch(function(err) {
					self.set('sortedMenuItems', undefined);
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
				self.set('sortedMenuItems', undefined);
				self.set('isExpanded', !this.get('isExpanded'));

				_ember['default'].run.scheduleOnce('afterRender', function() {
					self.get('model').get('children')
					.then(function(menuItems) {
						self.set('sortedMenuItems', menuItems.sortBy('displayOrder'));
					})
					.catch(function(err) {
						self.set('sortedMenuItems', undefined);
						self.sendAction('controller-action', 'display-status-message', {
							'type': 'danger',
							'message': err.message
						});
					});
				});
			},

			'onMenuItemsChanged': _ember['default'].observer('model.children.length', 'model.children.@each.displayOrder', function() {
				var self = this;
				self.set('sortedMenuItems', undefined);

				_ember['default'].run.scheduleOnce('afterRender', function() {
					self.get('model').get('children')
					.then(function(menuItems) {
						self.set('sortedMenuItems', menuItems.sortBy('displayOrder'));
					})
					.catch(function(err) {
						self.set('sortedMenuItems', undefined);
						self.sendAction('controller-action', 'display-status-message', {
							'type': 'danger',
							'message': err.message
						});
					});
				});
			}),
		});

		exports['default'] = HorizontalMenuItemWidget;
	}
);
