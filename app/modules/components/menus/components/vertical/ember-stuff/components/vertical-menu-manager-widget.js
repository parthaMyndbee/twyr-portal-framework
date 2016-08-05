define(
	'twyr-webapp/components/vertical-menu-manager-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/vertical-menu-manager-widget');
		var VerticalMenuManagerWidget = _baseWidget['default'].extend({
			'_availableMenus': undefined,
			'_dragula': undefined,
			'_currentlyExpandedChild': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);
				self._uninitDragula();

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

			'onChildExpandedChanged': _ember['default'].observer('model.sortedMenuItems.@each.isExpanded', function() {
				var self = this,
					expandedChild = self.get('model').get('sortedMenuItems').filterBy('isExpanded', true);

				if(expandedChild.length <= 1) {
					self.set('_currentlyExpandedChild', undefined);
					self.set('_currentlyExpandedChild', expandedChild[0]);
					return;
				}

				if(self.get('_currentlyExpandedChild')) {
					self.get('_currentlyExpandedChild').set('isExpanded', false);
					self.set('_currentlyExpandedChild', undefined);
				}

				expandedChild = self.get('model').get('sortedMenuItems').filterBy('isExpanded', true);
				self.set('_currentlyExpandedChild', expandedChild[0]);
			}),

			'_initDragula': function() {
				var self = this;
				self._uninitDragula();

				var availableMenuContainer = self.$('div#vertical-menu-manager-widget-available-component-menus-' + self.get('model').get('id'))[0];

				self.set('_dragula', dragula([availableMenuContainer], {
					'copy': function(element, source) {
						return (source === availableMenuContainer);
					},

					'isContainer': function(element) {
						return (window.$(element).hasClass('dragula-container'));
					},

					'direction': 'vertical',
					'revertOnSpill': false,
					'removeOnSpill': true
				}));

				self.get('_dragula')
				.on('drop', function(element, target, source, sibling) {
					element = window.$(element);

					if(element.prop('tagName').toLowerCase() == 'div') {
						var droppedMenu = window.$(target),
							componentMenuId = null,
							parentId = ((droppedMenu.parents('li.open')[0]) ? window.$(window.$(droppedMenu.parents('li.open')[0]).children('a')[0]).attr('id') : undefined);

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
					parentMenuItem = (data.parentId ? self.get('store').peekRecord('menu-item', data.parentId) : undefined);

				self.get('store').createRecord('menu-item', {
					'id': _app['default'].UUID(),
					'menu': self.get('model'),
					'parent': parentMenuItem,
					'componentMenu': componentMenu,
					'displayOrder': (parentMenuItem ? parentMenuItem.get('sortedMenuItems').get('length') : self.get('model').get('sortedMenuItems').get('length'))
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

		exports['default'] = VerticalMenuManagerWidget;
	}
);

define(
	'twyr-webapp/components/vertical-menu-item-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/vertical-menu-item-widget');
		var VerticalMenuItemWidget = _baseWidget['default'].extend({
			'tagName': 'li',

			'classNames': ['dropdown'],
			'classNameBindings': ['model.isExpanded:open'],

			'attributeBindings': ['style'],
			'style': 'border-bottom:1px solid #eee; padding:5px 0px;',
			'caretClass': 'fa fa-caret-right',

			'_currentlyExpandedChild': undefined,

			'didInsertElement': function() {
				this._super(...arguments);
				this._setCaretClass();
			},

			'click': function(event) {
				event.stopPropagation();
				event.preventDefault();

				this.get('model').set('isExpanded', !this.get('model').get('isExpanded'));
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

			'expandedChanged': _ember['default'].observer('model.isExpanded', function() {
				this._setCaretClass();
			}),

			'onChildExpandedChanged': _ember['default'].observer('model.children.@each.isExpanded', function() {
				var self = this,
					expandedChild = self.get('model').get('sortedMenuItems').filterBy('isExpanded', true);

				if(expandedChild.length <= 1) {
					self.set('_currentlyExpandedChild', undefined);
					self.set('_currentlyExpandedChild', expandedChild[0]);
					return;
				}

				if(self.get('_currentlyExpandedChild')) {
					self.get('_currentlyExpandedChild').set('isExpanded', false);
					self.set('_currentlyExpandedChild', undefined);
				}

				expandedChild = self.get('model').get('sortedMenuItems').filterBy('isExpanded', true);
				self.set('_currentlyExpandedChild', expandedChild[0]);
			}),

			'_setCaretClass': function() {
				if(this.get('model').get('isExpanded'))
					this.set('caretClass', 'fa fa-caret-left');
				else
					this.set('caretClass', 'fa fa-caret-right');
			}
		});

		exports['default'] = VerticalMenuItemWidget;
	}
);

define(
	'twyr-webapp/components/vertical-component-menu-item-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/vertical-component-menu-item-widget');
		var VerticalComponentMenuItemWidget = _baseWidget['default'].extend({
			'tagName': 'li',

			'classNames': ['dropdown'],
			'classNameBindings': ['model.isExpanded:open'],

			'attributeBindings': ['style'],
			'style': 'border-bottom:1px solid #eee; padding:5px 0px;',
			'caretClass': 'fa fa-caret-right',

			'_currentlyExpandedChild': undefined,

			'didInsertElement': function() {
				this._super(...arguments);
				this._setCaretClass();
			},

			'click': function(event) {
				event.stopPropagation();
				event.preventDefault();

				this.get('model').set('isExpanded', !this.get('model').get('isExpanded'));
			},

			'expandedChanged': _ember['default'].observer('model.isExpanded', function() {
				this._setCaretClass();
			}),

			'onChildExpandedChanged': _ember['default'].observer('model.children.@each.isExpanded', function() {
				var self = this,
					expandedChild = self.get('model').get('sortedMenuItems').filterBy('isExpanded', true);

				if(expandedChild.length <= 1) {
					self.set('_currentlyExpandedChild', undefined);
					self.set('_currentlyExpandedChild', expandedChild[0]);
					return;
				}

				if(self.get('_currentlyExpandedChild')) {
					self.get('_currentlyExpandedChild').set('isExpanded', false);
					self.set('_currentlyExpandedChild', undefined);
				}

				expandedChild = self.get('model').get('sortedMenuItems').filterBy('isExpanded', true);
				self.set('_currentlyExpandedChild', expandedChild[0]);
			}),

			'_setCaretClass': function() {
				if(this.get('model').get('isExpanded'))
					this.set('caretClass', 'fa fa-caret-left');
				else
					this.set('caretClass', 'fa fa-caret-right');
			}
		});

		exports['default'] = VerticalComponentMenuItemWidget;
	}
);
