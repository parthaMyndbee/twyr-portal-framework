define(
	'twyr-webapp/components/horizontal-menu-manager-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/horizontal-menu-manager-widget');
		var HorizontalMenuManagerWidget = _baseWidget['default'].extend({
			'_availableMenus': null,
			'_dragula': null,

			'sortedMenuItems': _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) }),
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
					menuItems = _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A(menuItems.filterBy('parent.id', undefined)) });
					menuItems = _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A(menuItems.sortBy('displayOrder')) });

					var refresh = false;
					if(self.get('sortedMenuItems').get('length') != menuItems.get('length')) {
						refresh = true;
					}
					else {
						self.get('sortedMenuItems').forEach(function(sortedItem, index) {
							if(sortedItem.get('id') != menuItems.objectAt(index).get('id'))
								refresh = true;
						});
					}

					if(!refresh)
						return;

					_ember['default'].run.begin();
					self.get('sortedMenuItems').clear();
					self.get('sortedMenuItems').addObjects(menuItems);
					_ember['default'].run.end();
				})
				.catch(function(err) {
					self.get('sortedMenuItems').clear();
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
							parentId = ((droppedMenu.parents('li.open')[0]) ? window.$(droppedMenu.parents('li.open').children('a')[0]).attr('id') : undefined);

						if(element.attr('id') !== 'empty-menu-item') {
							componentMenuId = element.attr('id');
						}

						element.remove();
						self['add-menu-item']({
							'componentMenuId': componentMenuId,
							'parentId': parentId
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

					self['remove-menu-item']({
						'menuItem': menuItem,
						'source': source
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
					componentMenu = (data.componentMenuId ? self.get('store').peekRecord('component-menu', data.componentMenuId) : undefined),
					parentMenuItem = (data.parentId ? self.get('store').peekRecord('menu-item', data.parentId) : undefined),
					menuItem = self.get('store').createRecord('menu-item', {
						'id': _app['default'].UUID(),
						'menu': self.get('model'),
						'parent': parentMenuItem,
						'componentMenu': componentMenu
					});

				self.get('model').get('menuItems')
				.then(function(menuItems) {
					menuItem.set('displayOrder', menuItems.get('length'));
					menuItems.addObject(menuItem);
					return null;
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
					var menuItemRecord = self.get('store').peekRecord('menu-item', window.$(window.$(menuItem).children('a')[0]).attr('id'));
					if(menuItemRecord) menuItemRecord.set('displayOrder', index);
				});
				_ember['default'].run.end();
			},

			'remove-menu-item': function(data) {
				var self = this;

				self._removeMenuItemChildren(data.menuItem)
				.catch(function(err) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'_removeMenuItemChildren': function(parent) {
				var self = this;
				return new _ember['default'].RSVP.Promise(function(resolve, reject) {
					parent.get('children')
					.then(function(children) {
						var promiseResolutions = [];

						children.forEach(function(child) {
							promiseResolutions.push(self._removeMenuItemChildren(child));
						});

						return _ember['default'].RSVP.allSettled(promiseResolutions);
					})
					.then(function() {
						return parent.deleteRecord();
					})
					.then(function(status) {
						resolve(status);
						return null;
					})
					.catch(function(err) {
						console.error(err);
						reject(err);
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

			'attributeBindings': ['style'],
			'style': 'border-bottom:1px solid #eee; padding:5px 0px;',

			'isHorizontal': false,
			'isVertical': false,
			'caretClass': 'fa fa-caret-down',

			'sortedMenuItems': _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) }),
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
					menuItems = _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A(menuItems.sortBy('displayOrder')) });

					var refresh = false;
					if(self.get('sortedMenuItems').get('length') != menuItems.get('length')) {
						refresh = true;
					}
					else {
						self.get('sortedMenuItems').forEach(function(sortedItem, index) {
							if(sortedItem.get('id') != menuItems.objectAt(index).get('id'))
								refresh = true;
						});
					}

					if(!refresh)
						return;

					_ember['default'].run.begin();
					self.get('sortedMenuItems').clear();
					self.get('sortedMenuItems').addObjects(menuItems);
					_ember['default'].run.end();
				})
				.catch(function(err) {
					self.get('sortedMenuItems').clear();

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

define(
	'twyr-webapp/components/component-menu-item-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/component-menu-item-widget');
		var ComponentMenuItemWidget = _baseWidget['default'].extend({
			'tagName': 'li',

			'classNames': ['dropdown'],
			'classNameBindings': ['model.isExpanded:open'],

			'attributeBindings': ['style'],
			'style': 'border-bottom:1px solid #eee; padding:5px 0px;',

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

				this.get('model').set('isExpanded', !this.get('model').get('isExpanded'));
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

		exports['default'] = ComponentMenuItemWidget;
	}
);
