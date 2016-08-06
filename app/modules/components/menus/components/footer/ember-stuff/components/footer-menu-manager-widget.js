define(
	'twyr-webapp/components/footer-menu-manager-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/footer-menu-manager-widget');
		var FooterMenuManagerWidget = _baseWidget['default'].extend({
			'_availableMenus': undefined,
			'_dragula': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);
				self._uninitDragula();

				self.get('store')
				.findAll('component-menu')
				.then(function(componentMenus) {
					var categorizedMenus = _ember['default'].Object.create({});

					componentMenus.forEach(function(componentMenu) {
						var componentMenuList = categorizedMenus.get(componentMenu.get('category'));
						if(componentMenuList) {
							componentMenuList.addObject(componentMenu);
							return;
						}

						categorizedMenus.set(componentMenu.get('category'), _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) }));
						componentMenuList = categorizedMenus.get(componentMenu.get('category'));
						componentMenuList.addObject(componentMenu);
					});

					self.set('_availableMenus', categorizedMenus);
					_ember['default'].run.scheduleOnce('afterRender', function() {
						self._initDragula();
					});
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

			'_initDragula': function() {
				var self = this;
				self._uninitDragula();

				var availableMenuContainers = [];
				window.$.each(self.$('div.panel-body'), function(index, item) {
					availableMenuContainers.push(item);
				});

				self.set('_dragula', dragula(availableMenuContainers, {
					'copy': function(element, source) {
						return ((availableMenuContainers.indexOf(source) >= 0) && window.$(element).hasClass('info-box'));
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
							componentMenuId = element.attr('id'),
							parentId = ((droppedMenu.parents('li.open')[0]) ? window.$(window.$(droppedMenu.parents('li.open')[0]).children('a')[0]).attr('id') : undefined);

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

		exports['default'] = FooterMenuManagerWidget;
	}
);

define(
	'twyr-webapp/components/footer-menu-item-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/footer-menu-item-widget');
		var FooterMenuItemWidget = _baseWidget['default'].extend({
			'tagName': 'li',
			'classNames': ['dropdown open'],

			'attributeBindings': ['style'],
			'style': _ember['default'].String.htmlSafe('margin:0px 10px; border-bottom:1px solid #eee; padding:5px 0px;'),
		});

		exports['default'] = FooterMenuItemWidget;
	}
);
