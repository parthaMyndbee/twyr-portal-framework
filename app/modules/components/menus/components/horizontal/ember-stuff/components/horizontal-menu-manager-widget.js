define(
	'twyr-webapp/components/horizontal-menu-manager-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/horizontal-menu-manager-widget');
		var HorizontalMenuManagerWidget = _baseWidget['default'].extend({
			'_availableMenus': null,
			'_dragula': null,

			'sortedMenuItems': undefined,
			'_currentlyExpandedChild': undefined,

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

			'onMenuItemsChanged': _ember['default'].observer('model.menuItems.[]', 'model.menuItems.@each.displayOrder', function() {
				var self = this;

				self.get('model').get('menuItems')
				.then(function(menuItems) {
					var children = _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A(menuItems.filterBy('parent.id', undefined)) });
					children = _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A(children.sortBy('displayOrder')) });

					if(!self.get('sortedMenuItems')) {
						self.set('sortedMenuItems', _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A(children.sortBy('displayOrder')) }));
						return;
					}

					var refresh = false;
					if(children.get('length') != self.get('sortedMenuItems').get('length')) {
						refresh = true;
					}
					else {
						children.forEach(function(child, index) {
							if(child.get('id') != self.get('sortedMenuItems').objectAt(index).get('id'))
								refresh = true;
						});
					}

					if(!refresh) return;
					self.set('sortedMenuItems', _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A(children.sortBy('displayOrder')) }));
				})
				.catch(function(err) {
					self.set('sortedMenuItems', undefined);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			}),

			'onChildExpandedChanged': _ember['default'].observer('sortedMenuItems.@each.isExpanded', function() {
				var self = this;
				if(self.get('_currentlyExpandedChild')) {
					self.get('_currentlyExpandedChild').set('isExpanded', false);
					self.set('_currentlyExpandedChild', undefined);
				}

				if(self.get('sortedMenuItems')) {
					self.get('sortedMenuItems').forEach(function(child) {
						if(!child.get('isExpanded'))
							return;

						self.set('_currentlyExpandedChild', child);
					});
				}
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

						if(!parentId) {
							self.set('sortedMenuItems', undefined);
							_ember['default'].run.scheduleOnce('afterRender', function() {
								self['add-menu-item']({
									'componentMenuId': componentMenuId,
									'parentId': parentId
								});
							});
						}
						else {
							self['add-menu-item']({
								'componentMenuId': componentMenuId,
								'parentId': parentId
							});
						}

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

					menuItem.get('parent')
					.then(function(parent) {
						if(!parent) {
							self.set('sortedMenuItems', undefined);
							_ember['default'].run.scheduleOnce('afterRender', function() {
								self['remove-menu-item']({
									'menuItem': menuItem,
									'source': source
								});
							});
						}
						else {
							self['remove-menu-item']({
								'menuItem': menuItem,
								'source': source
							});
						}

						return null;
					})
					.catch(function(err) {
						self.sendAction('controller-action', 'display-status-message', {
							'type': 'danger',
							'message': err.message
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
			'classNameBindings': ['model.isExpanded:open'],

			'isHorizontal': false,
			'isVertical': false,
			'caretClass': 'fa fa-caret-down',

			'sortedMenuItems': undefined,
			'_currentlyExpandedChild': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.get('model').get('children')
				.then(function(menuItems) {
					self.set('sortedMenuItems', menuItems.sortBy('displayOrder'));
					self.set('isHorizontal', (self.get('orientation') == 'horizontal'));
					self.set('isVertical', (self.get('orientation') == 'vertical'));

					if(self.get('orientation') == 'vertical') {
						self.set('caretClass', 'fa fa-caret-down');
					}

					if(self.get('orientation') == 'horizontal') {
						self.set('caretClass', 'fa fa-caret-right');
					}
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
				self.get('model').set('isExpanded', !self.get('model').get('isExpanded'));

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

			'doubleClick': function(event) {
				event.stopPropagation();
				event.preventDefault();

				var self = this;
				self.get('model').get('componentMenu')
				.then(function(componentMenu) {
					if(componentMenu) {
						return null;
					}

					self.sendAction('controller-action', 'editMenuItem', self.get('model'));
				})
				.catch(function(err) {
					console.error(err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
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

			'onMenuItemsChanged': _ember['default'].observer('model.children.[]', 'model.children.@each.displayOrder', function() {
				var self = this;

				self.get('model').get('children')
				.then(function(menuItems) {
					if(!self.get('sortedMenuItems')) {
						self.set('sortedMenuItems', _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A(menuItems.sortBy('displayOrder')) }));
						return;
					}

					var refresh = false;
					if(menuItems.get('length') != self.get('sortedMenuItems').get('length')) {
						refresh = true;
					}
					else {
						menuItems.forEach(function(child, index) {
							if(child.get('id') != self.get('sortedMenuItems').objectAt(index).get('id'))
								refresh = true;
						});
					}

					if(!refresh) return;
					self.set('sortedMenuItems', _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A(menuItems.sortBy('displayOrder')) }));
				})
				.catch(function(err) {
					self.set('sortedMenuItems', undefined);

					console.err(err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			}),

			'onChildExpandedChanged': _ember['default'].observer('model.children.@each.isExpanded', function() {
				var self = this;
				if(self.get('_currentlyExpandedChild')) {
					self.get('_currentlyExpandedChild').set('isExpanded', false);
					self.set('_currentlyExpandedChild', undefined);
				}

				self.get('model').get('children')
				.then(function(children) {
					children.forEach(function(child) {
						if(!child.get('isExpanded'))
							return;

						self.set('_currentlyExpandedChild', child);
					});
				})
				.catch(function(err) {
					self.set('_currentlyExpandedChild', undefined);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			})
		});

		exports['default'] = HorizontalMenuItemWidget;
	}
);
