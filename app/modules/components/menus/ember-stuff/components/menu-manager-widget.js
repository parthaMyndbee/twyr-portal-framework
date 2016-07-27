define(
	'twyr-webapp/components/menu-manager-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/menu-manager-widget');
		var MenuManagerWidget = _baseWidget['default'].extend({
			'_menuListDataTable': null,
			'currentlyEditingMenuItem': undefined,

			'_menuCache': _ember['default'].ObjectProxy.create({ 'content': _ember['default'].Object.create({}) }),

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
						{ 'data': 'component' },
						{ 'data': 'created' },
						{ 'data': 'updated' }
					],

					'columnDefs': [{
						'targets': [0],

						'render': function(data, type, row) {
							var menu = self.get('_menuCache').get(row.id);
							if(!menu) {
								self.get('store').findRecord('menus-default', row.id)
								.then(function(menuRecord) {
									menuRecord.addObserver('shouldEnableSave', function() {
										var newName = menuRecord.get('name');
										if(menuRecord.get('shouldEnableSave'))
											newName += ' *';

										var tblRow = self.get('_menuListDataTable').row(menuRecord.get('id'));
										self.get('_menuListDataTable').cell(tblRow.index(), 0).data(newName);
									});

									menuRecord.addObserver('name', function() {
										var newName = menuRecord.get('name');
										if(menuRecord.get('shouldEnableSave'))
											newName += ' *';

										var tblRow = self.get('_menuListDataTable').row(menuRecord.get('id'));
										self.get('_menuListDataTable').cell(tblRow.index(), 0).data(newName);
									});

									self.get('_menuCache').set(row.id, menuRecord);
								})
								.catch(function(err) {
									console.error(err);
								});
							}

							return data;
						}
					}, {
						'targets': [4],
						'sortable': false,
						'searchable': false,

						'render': function(whatever, type, row) {
							return '<div class="menu-row-operations" id="' + row.id + '" style="width:100%; text-align:right;" />';
						}
					}],

					'order': [
						[ 1, 'asc' ]
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

				if(self.get('_menuListDataTable')) {
					self.get('_menuListDataTable').destroy();
					self.set('_menuListDataTable', null);
				}
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

				newMenu.set('isEditing', true);
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

				self.get('store').findRecord('menus-default', menuId)
				.then(function(menu) {
					menu.set('isEditing', true);
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
					confirmFn = function() {
						menu.get('menuItems')
						.then(function(menuItems) {
							var menuItemsIds = _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) });
							menuItems.forEach(function(menuItem) {
								menuItemsIds.addObject(menuItem.get('id'));
							});

							menu.rollbackAttributes();
							menuItemsIds.forEach(function(menuItemId) {
								var menuItem = self.get('store').peekRecord('menu-item', menuItemId);
								menuItem.rollbackAttributes();
							});

							return null;
						})
						.then(function() {
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
						})
						.finally(function() {
							menu.set('isEditing', false);
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
					return menuItems.save();
				})
				.then(function() {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': menu.get('name') + ' saved succesfully'
					});
				})
				.catch(function(err) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'ember-error',
						'errorModel': menu
					});
				})
				.finally(function() {
					self.set('_menuCache', _ember['default'].ObjectProxy.create({ 'content': _ember['default'].Object.create({}) }));
					self.get('_menuListDataTable').ajax.reload(null, false);
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
						self.get('store').findRecord('menus-default', menuId)
						.then(function(menu) {
							menu.set('isEditing', false);
							_ember['default'].run.scheduleOnce('afterRender', function() {
								if(!self.$('li.menu-manager-widget-list-tab a').length)
									return;

								(self.$('li.menu-manager-widget-list-tab a')[0]).click();
							});

							return menu.destroyRecord();
						})
						.then(function() {
							self.set('_menuCache', _ember['default'].ObjectProxy.create({ 'content': _ember['default'].Object.create({}) }));
							return self.get('_menuListDataTable').ajax.reload(null, false);
						})
						.then(function() {
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

				if(menuItem.get('isNew') || !menuItem.get('hasDirtyAttributes')) {
					this.$('div#menu-manager-widget-dialog-menu-item-editor').modal('hide');
					this.set('currentlyEditingMenuItem', null);
					return;
				}

				var self = this;
				window.$.confirm({
					'title': 'Cancel Menu Item changes?',
					'text': 'Are you sure you want to stop editing this menu item? You will lose any changes you have already made',

					'confirmButtonClass': 'btn btn-flat btn-danger',
					'cancelButtonClass': 'btn btn-flat btn-primary',

					'confirm': function() {
						self.$('div#menu-manager-widget-dialog-menu-item-editor').modal('hide');

						self.get('currentlyEditingMenuItem').rollbackAttributes();
						self.set('currentlyEditingMenuItem', null);
					},

					'cancel': function() {
					}
				});
			},
		});

		exports['default'] = MenuManagerWidget;
	}
);
