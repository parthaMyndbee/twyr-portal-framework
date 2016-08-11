define(
	'twyr-webapp/components/menu-manager-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/menu-manager-widget');
		var MenuManagerWidget = _baseWidget['default'].extend({
			'currentlyEditingMenuItem': undefined,

			'_menuListDataTable': null,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				if(self.get('_menuListDataTable'))
					return;

				self.set('_menuListDataTable', self.$('table#menus-default-menu-list').DataTable({
					'ajax': window.apiServer + 'menus/list',
					'rowId': 'id',

					'columns': [
						{ 'data': 'name' },
						{ 'data': 'type' },
						{ 'data': 'status' },
						{ 'data': 'permission' },
						{ 'data': 'created' },
						{ 'data': 'updated' }
					],

					'columnDefs': [{
						'targets': [6],
						'sortable': false,
						'searchable': false,

						'render': function(whatever, type, row) {
							return '<div class="menu-row-operations" id="' + row.id + '" style="width:100%; text-align:right;" />';
						}
					}],

					'order': [
						[ 0, 'asc' ]
					]
				}));

				var addMenuButton = self.$('<button type="button" class="btn btn-flat btn-sm btn-success" style="margin-left:5px;" />');
				addMenuButton.html('<span class="fa fa-plus" style="margin-right:3px;" />New Menu');
				addMenuButton.click(self.addMenu.bind(self));
				self.$('div.dataTables_filter').append(addMenuButton);

				self.get('_menuListDataTable').on('draw.dt', self._setupRowOperations.bind(self));
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				var menus = self.get('store').peekAll('menus-default');
				menus.forEach(function(menu) {
					menu.set('isEditing', false);
					self._removeMenuObservers(menu);
				});

				if(self.get('_menuListDataTable')) {
					self.get('_menuListDataTable').destroy();
					self.set('_menuListDataTable', null);
				}
			},

			'_addMenuObservers': function(menu) {
				var self = this;
				if(!self.get('shouldEnableSaveObserver')) {
					self.set('shouldEnableSaveObserver', (function(menuRecord) {
						var newName = menuRecord.get('name');
						var newType = _ember['default'].String.capitalize(menuRecord.get('type'));
						var newStatus = _ember['default'].String.capitalize(menuRecord.get('status'));

						if(menuRecord.get('shouldEnableSave'))
							newName += ' *';

						var tblRow = self.get('_menuListDataTable').row('tr#' + menuRecord.get('id'));
						self.get('_menuListDataTable').cell(tblRow.index(), 0).data(newName);
						self.get('_menuListDataTable').cell(tblRow.index(), 1).data(newType);
						self.get('_menuListDataTable').cell(tblRow.index(), 2).data(newStatus);

						var permission = self.get('store').peekRecord('module-permission', menuRecord.get('permission'));
						if(permission) {
							self.get('_menuListDataTable').cell(tblRow.index(), 3).data(permission.get('displayName'));
							return;
						}

						self.get('store').findRecord('module-permission', menuRecord.get('permission'))
						.then(function(permission) {
							self.get('_menuListDataTable').cell(tblRow.index(), 3).data(permission.get('displayName'));
						})
						.catch(function(err) {
							console.error(err);
						});
					}).bind(self));
				}

				if(!self.get('nameObserver')) {
					self.set('nameObserver', (function(menuRecord) {
						var newName = menuRecord.get('name');
						if(menuRecord.get('shouldEnableSave'))
							newName += ' *';

						var tblRow = self.get('_menuListDataTable').row('tr#' + menuRecord.get('id'));
						self.get('_menuListDataTable').cell(tblRow.index(), 0).data(newName);
					}).bind(self));
				}

				if(!self.get('typeObserver')) {
					self.set('typeObserver', (function(menuRecord) {
						var newType = _ember['default'].String.capitalize(menuRecord.get('type'));

						var tblRow = self.get('_menuListDataTable').row('tr#' + menuRecord.get('id'));
						self.get('_menuListDataTable').cell(tblRow.index(), 1).data(newType);
					}).bind(self));
				}

				if(!self.get('statusObserver')) {
					self.set('statusObserver', (function(menuRecord) {
						var newStatus = _ember['default'].String.capitalize(menuRecord.get('status'));

						var tblRow = self.get('_menuListDataTable').row('tr#' + menuRecord.get('id'));
						self.get('_menuListDataTable').cell(tblRow.index(), 2).data(newStatus);
					}).bind(self));
				}

				if(!self.get('permissionObserver')) {
					self.set('permissionObserver', (function(menuRecord) {
						var permission = self.get('store').peekRecord('module-permission', menuRecord.get('permission'));
						if(permission) {
							var tblRow = self.get('_menuListDataTable').row('tr#' + menuRecord.get('id'));
							self.get('_menuListDataTable').cell(tblRow.index(), 3).data(permission.get('displayName'));

							return;
						}

						self.get('store').findRecord('module-permission', menuRecord.get('permission'))
						.then(function(permission) {
							var tblRow = self.get('_menuListDataTable').row('tr#' + menuRecord.get('id'));
							self.get('_menuListDataTable').cell(tblRow.index(), 3).data(permission.get('displayName'));
						})
						.catch(function(err) {
							console.error(err);
						});
					}).bind(self));
				}

				menu.addObserver('shouldEnableSave', self.get('shouldEnableSaveObserver'));
				menu.addObserver('name', self.get('nameObserver'));
				menu.addObserver('type', self.get('typeObserver'));
				menu.addObserver('status', self.get('statusObserver'));
				menu.addObserver('permission', self.get('permissionObserver'));
			},

			'_removeMenuObservers': function(menuRecord) {
				var self = this;

				menuRecord.removeObserver('shouldEnableSave', self.get('shouldEnableSaveObserver'));
				menuRecord.removeObserver('name', self.get('nameObserver'));
				menuRecord.removeObserver('type', self.get('typeObserver'));
				menuRecord.removeObserver('status', self.get('statusObserver'));
				menuRecord.removeObserver('permission', self.get('permissionObserver'));
			},

			'_setupRowOperations': function() {
				var self = this;
				window.$.each(self.$('div.menu-row-operations'), function(index, divElem) {
					divElem = window.$(divElem);
					divElem.html('');

					var editMenuButton = self.$('<button type="button" class="btn btn-flat btn-sm btn-primary" />');
					editMenuButton.html('<span class="fa fa-edit" style="margin-right:3px;" />Edit');
					editMenuButton.click(self.editMenu.bind(self, divElem.prop('id')));

					var deleteMenuButton = self.$('<button type="button" class="btn btn-flat btn-sm btn-danger" style="margin-left:5px;" />');
					deleteMenuButton.html('<span class="fa fa-trash-o" style="margin-right:3px;" />Delete');
					deleteMenuButton.click(self.deleteMenu.bind(self, divElem.prop('id')));

					divElem.append(editMenuButton);
					divElem.append(deleteMenuButton);
				});
			},

			'anyMenusEditing': _ember['default'].computed('model.@each.isEditing', function() {
				return !!(this.get('model').filterBy('isEditing', true).get('length'));
			}),

			'addMenu': function(event) {
				event.stopPropagation();
				event.preventDefault();

				var self = this,
					newMenu = null;

				newMenu = this.get('store').createRecord('menus-default', {
					'id': _app['default'].UUID()
				});

				self.get('_menuListDataTable').row.add({
					'id': newMenu.get('id'),
					'name': newMenu.get('name'),
					'type': _ember['default'].String.capitalize(newMenu.get('type')),
					'status': _ember['default'].String.capitalize(newMenu.get('status')),
					'permission': '',
					'created': newMenu.get('formattedCreatedAt'),
					'updated': newMenu.get('formattedUpdatedAt')
				}).draw();

				newMenu.set('isEditing', true);
				self._addMenuObservers(newMenu);

				_ember['default'].run.scheduleOnce('afterRender', function() {
					self.$('li#menu-manager-widget-list-' + newMenu.get('id') + '-link a').click();
				});
			},

			'editMenu': function(menuId, event) {
				var self = this;

				if(event) {
					event.stopPropagation();
					event.preventDefault();
				}

				var menu = self.get('store').peekRecord('menus-default', menuId);
				if(menu) {
					menu.set('isEditing', true);
					self._addMenuObservers(menu);

					_ember['default'].run.scheduleOnce('afterRender', function() {
						self.$('li#menu-manager-widget-list-' + menu.get('id') + '-link a').click();
					});

					return;
				}

				self.get('store').findRecord('menus-default', menuId)
				.then(function(menu) {
					menu.set('isEditing', true);
					self._addMenuObservers(menu);

					_ember['default'].run.scheduleOnce('afterRender', function() {
						self.$('li#menu-manager-widget-list-' + menu.get('id') + '-link a').click();
					});
				})
				.catch(function(err) {
					console.error(err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'stopEditMenu': function(menu) {
				var self = this,
					isNew = menu.get('isNew'),
					menuId = menu.get('id'),
					confirmFn = function() {
						self._removeMenuObservers(menu);
						menu.set('isEditing', false);

						if(isNew) {
							self.get('_menuListDataTable').row('tr#' + menuId).remove().draw();
						}

						menu.get('menuItems')
						.then(function(menuItems) {
							var menuItemsIds = _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) });
							menuItems.forEach(function(menuItem) {
								menuItemsIds.addObject(menuItem.get('id'));
							});

							menuItemsIds.forEach(function(menuItemId) {
								var menuItem = self.get('store').peekRecord('menu-item', menuItemId);
								menuItem.rollbackAttributes();
							});

							menu.rollbackAttributes();

							_ember['default'].run.scheduleOnce('afterRender', function() {
								if(!self.$('li.menu-manager-widget-list-tab a').length)
									return;

								(self.$('li.menu-manager-widget-list-tab a')[0]).click();
							});
						})
						.catch(function(err) {
							console.error(err);
							self.sendAction('controller-action', 'display-status-message', {
								'type': 'danger',
								'message': err.message
							});
						});
					};

				if(!menu.get('shouldEnableSave')) {
					confirmFn();
					return;
				}

				window.$.confirm({
					'title': 'Unsaved Changes',
					'text': 'Are you sure you want to stop editing "' + (menu.get('name') || 'New Menu') + '"?<br />You will lose all unsaved changes!',

					'confirmButtonClass': 'btn btn-flat btn-danger',
					'cancelButtonClass': 'btn btn-flat btn-primary',

					'confirm': confirmFn,
					'cancel': function() {}
				});
			},

			'saveMenu': function(menu) {
				var self = this;

				menu.save()
				.then(function() {
					return menu.get('menuItems');
				})
				.then(function(menuItems) {
					var rootMenuItems = _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A(menuItems.filterBy('parent.id', undefined)) }),
						promiseResolutions = [];

					promiseResolutions.push(rootMenuItems);
					rootMenuItems.forEach(function(rootMenuItem) {
						promiseResolutions.push(rootMenuItem.save());
					});

					return _ember['default'].RSVP.allSettled(promiseResolutions);
				})
				.then(function() {
					return menu.get('menuItems');
				})
				.then(function(menuItems) {
					var rootMenuItems = _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A(menuItems.filterBy('parent.id', undefined)) }),
						promiseResolutions = [];

					rootMenuItems.forEach(function(rootMenuItem) {
						promiseResolutions.push(self._saveChildrenMenuItems(rootMenuItem));
					});

					return _ember['default'].RSVP.allSettled(promiseResolutions);
				})
				.then(function() {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': menu.get('name') + ' saved succesfully'
					});
				})
				.catch(function(err) {
					console.error(err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'ember-error',
						'errorModel': menu
					});
				});
			},

			'deleteMenu': function(menuId, event) {
				var self = this;

				if(event) {
					event.stopPropagation();
					event.preventDefault();
				}

				window.$.confirm({
					'title': 'Delete Menu',
					'text': 'Are you sure you want to delete this menu?',

					'confirmButtonClass': 'btn btn-flat btn-danger',
					'cancelButtonClass': 'btn btn-flat btn-primary',

					'confirm': function() {
						var menu = self.get('store').peekRecord('menus-default', menuId);
						if(menu) {
							self._removeMenuObservers(menu);
							menu.destroyRecord()
							.then(function() {
								_ember['default'].run.scheduleOnce('afterRender', function() {
									if(!self.$('li.menu-manager-widget-list-tab a').length)
										return;

									(self.$('li.menu-manager-widget-list-tab a')[0]).click();
								});

								self.sendAction('controller-action', 'display-status-message', {
									'type': 'success',
									'message': 'Menu deleted succesfully'
								});
							})
							.catch(function(err) {
								self.sendAction('controller-action', 'display-status-message', {
									'type': 'danger',
									'message': err.message
								});
							})
							.finally(function() {
								self.get('_menuListDataTable').row('tr#' + menuId).remove().draw();
							});

							return;
						}

						_ember['default'].RSVP.allSettled([
							_ember['default'].$.ajax({
								'method': 'DELETE',
								'url': window.apiServer + 'menus/menus-defaults/' + menuId,
								'dataType': 'json',
								'cache': false
							})
						])
						.then(function() {
							_ember['default'].run.scheduleOnce('afterRender', function() {
								if(!self.$('li.menu-manager-widget-list-tab a').length)
									return;

								(self.$('li.menu-manager-widget-list-tab a')[0]).click();
							});

							self.sendAction('controller-action', 'display-status-message', {
								'type': 'success',
								'message': 'Menu deleted succesfully'
							});
						})
						.catch(function(err) {
							self.sendAction('controller-action', 'display-status-message', {
								'type': 'danger',
								'message': err.message
							});
						})
						.finally(function() {
							self.get('_menuListDataTable').row('tr#' + menuId).remove().draw();
						});
					},

					'cancel': function() {}
				});
			},

			'editMenuItem': function(menuItem) {
				this.stopEditMenuItem();

				this.set('currentlyEditingMenuItem', menuItem);
				this.$('div#menu-manager-widget-dialog-menu-item-editor').modal({
					'backdrop': 'static',
					'keyboard': false
				});
			},

			'stopEditMenuItem': function(menuItem) {
				if(!menuItem) {
					return;
				}

				this.$('div#menu-manager-widget-dialog-menu-item-editor').modal('hide');
				this.set('currentlyEditingMenuItem', null);
			},

			'_saveChildrenMenuItems': function(parent) {
				var self = this;

				return new _ember['default'].RSVP.Promise(function(resolve, reject) {
					parent.get('children')
					.then(function(menuItems) {
						var promiseResolutions = [];
						promiseResolutions.push(menuItems);

						menuItems.forEach(function(menuItem) {
							promiseResolutions.push(menuItem.save());
						});

						return _ember['default'].RSVP.allSettled(promiseResolutions);
					})
					.then(function() {
						return parent.get('children');
					})
					.then(function(menuItems) {
						var promiseResolutions = [];
						menuItems.forEach(function(menuItem) {
							promiseResolutions.push(self._saveChildrenMenuItems(menuItem));
						});

						return _ember['default'].RSVP.allSettled(promiseResolutions);
					})
					.then(function(saves) {
						resolve(saves);
						return null;
					})
					.catch(function(err) {
						console.error(err);
						reject(err);
					});
				});
			}
		});

		exports['default'] = MenuManagerWidget;
	}
);
