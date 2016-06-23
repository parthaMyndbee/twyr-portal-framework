define(
	'twyr-portal/components/page-manager-widget',
	['exports', 'ember', 'twyr-portal/application'],
	function(exports, _ember, _app) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/components/page-manager-widget');
		var PageManagerWidget = _ember['default'].Component.extend({
			'_pageListDataTable': null,

			'didRender': function() {
				var self = this;
				self._super(...arguments);

				if(self._pageListDataTable)
					return;

				self._pageListDataTable = self.$('table#pages-default-page-list').DataTable({
					'ajax': window.apiServer + 'pages/list',

					'columns': [
						{ 'data': 'id' },
						{ 'data': 'title' },
						{ 'data': 'author' },
						{ 'data': 'status' },
						{ 'data': 'created' }
					],

					'columnDefs': [{
						'targets': [0],
						'visible': false,
						'searchable': false
					}, {
						'targets': [5],
						'searchable': false,

						'render': function(whatever, type, row) {
							return '<div class="page-row-operations" id="' + row.id + '" style="width:100%; text-align:right;" />';
						}
					}],

					'order': [
						[ 1, 'asc' ]
					]
				});

				var addPageButton = self.$('<button type="button" class="btn btn-flat btn-sm btn-success" style="margin-left:5px;" />');
				addPageButton.html('<span class="fa fa-plus" style="margin-right:3px;" />New Page');
				addPageButton.click(self.addPage.bind(self));
				self.$('div.dataTables_filter').append(addPageButton);

				self._pageListDataTable.on('draw.dt', self._setupRowOperations.bind(self));
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				if(self._pageListDataTable) {
					self._pageListDataTable.destroy();
					self._pageListDataTable = null;
				}
			},

			'anyPagesEditing': _ember['default'].computed('model.@each.isEditing', function() {
				return !!(this.get('model').filterBy('isEditing', true).get('length'));
			}),

			'_setupRowOperations': function() {
				var self = this;
				window.$.each(self.$('div.page-row-operations'), function(index, divElem) {
					divElem = window.$(divElem);
					divElem.html('');

					var editPageButton = self.$('<button type="button" class="btn btn-flat btn-sm btn-primary" />');
					editPageButton.html('<span class="fa fa-edit" style="margin-right:3px;" />Edit');
					editPageButton.click(self.editPage.bind(self, divElem.prop('id')));

					var deletePageButton = self.$('<button type="button" class="btn btn-flat btn-sm btn-danger" style="margin-left:5px;" />');
					deletePageButton.html('<span class="fa fa-trash-o" style="margin-right:3px;" />Delete');
					deletePageButton.click(self.deletePage.bind(self, divElem.prop('id')));

					divElem.append(editPageButton);
					divElem.append(deletePageButton);
				});
			},

			'addPage': function(event) {
				event.stopPropagation();
				event.preventDefault();

				var self = this,
					newPage = null;

				self.get('model').store.findRecord('profile', window.twyrUserId)
				.then(function(profile) {
					newPage = self.get('model').store.createRecord('pages-default', {
						'id': _app['default'].UUID(),
						'author': profile
					});

					newPage.set('isEditing', true);
					_ember['default'].run.scheduleOnce('afterRender', function() {
						self.$('li#page-manager-widget-list-' + newPage.get('id') + '-link a').click();
					});
				})
				.catch(function(err) {
					newPage.destroyRecord();
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'editPage': function(pageId, event) {
				var self = this;

				if(event) {
					event.stopPropagation();
					event.preventDefault();
				}

				self.get('model').store.findRecord('pages-default', pageId)
				.then(function(page) {
					page.set('isEditing', true);
					_ember['default'].run.scheduleOnce('afterRender', function() {
						self.$('li#page-manager-widget-list-' + page.get('id') + '-link a').click();
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

			'stopEditPage': function(page) {
				var self = this,
					confirmFn = function() {
						page.set('isEditing', false);
						page.rollbackAttributes();

						_ember['default'].run.scheduleOnce('afterRender', function() {
							if(!self.$('li.page-manager-widget-list-tab a').length)
								return;

							(self.$('li.page-manager-widget-list-tab a')[0]).click();
						});
					};

				if(!page.get('hasDirtyAttributes')) {
					confirmFn();
					return;
				}

				window.$.confirm({
					'title': 'Unsaved Changes',
					'text': 'Are you sure you want to stop editing "' + (page.get('title') || 'New Page') + '"?<br />You will lose all unsaved changes!',

					'confirmButtonClass': 'btn btn-flat btn-danger',
					'cancelButtonClass': 'btn btn-flat btn-primary',

					'confirm': confirmFn,
					'cancel': function() {}
				});
			},

			'savePage': function(page) {
				var self = this;
				page.save()
				.then(function() {
					return self._pageListDataTable.ajax.reload(null, false);
				})
				.then(function() {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': page.get('title') + ' saved succesfully'
					});
				})
				.catch(function(err) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'ember-error',
						'errorModel': page
					});
				});
			},

			'deletePage': function(pageId, event) {
				var self = this;

				if(event) {
					event.stopPropagation();
					event.preventDefault();
				}

				window.$.confirm({
					'title': 'Delete Page',
					'text': 'Are you sure you want to delete this page?',

					'confirmButtonClass': 'btn btn-flat btn-danger',
					'cancelButtonClass': 'btn btn-flat btn-primary',

					'confirm': function() {
						self.get('model').store.findRecord('pages-default', pageId)
						.then(function(page) {
							return page.destroyRecord();
						})
						.then(function() {
							return self._pageListDataTable.ajax.reload(null, false);
						})
						.then(function() {
							self.sendAction('controller-action', 'display-status-message', {
								'type': 'success',
								'message': 'Page deleted succesfully'
							});
						})
						.catch(function(err) {
							self.sendAction('controller-action', 'display-status-message', {
								'type': 'danger',
								'message': err.message
							});
						});
					},

					'cancel': function() {
					}
				});
			},

			'actions': {
				'controller-action': function(action, data) {
					if(this[action])
						this[action](data);
					else
						this.sendAction('controller-action', action, data);
				}
			}
		});

		exports['default'] = PageManagerWidget;
	}
);

define(
	'twyr-portal/components/page-edit-widget',
	['exports', 'ember', 'twyr-portal/application'],
	function(exports, _ember, _app) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/components/page-edit-widget');
		var PageEditWidget = _ember['default'].Component.extend({
			'didRender': function() {
				var statusSelectElem = _ember['default'].$('select#page-edit-widget-select-status-' + this.get('model').get('id')),
					permissionSelectElem = _ember['default'].$('select#page-edit-widget-select-permission-' + this.get('model').get('id')),
					self = this;

				self._super(...arguments);

				statusSelectElem.select2({
					'minimumInputLength': 0,
					'minimumResultsForSearch': 10,

					'allowClear': true,
					'closeOnSelect': true,

					'placeholder': 'Publish Status'
				})
				.on('change', function() {
					self.get('model').set('status', statusSelectElem.val());
				});

				_ember['default'].$.ajax({
					'url': window.apiServer + 'pages/publish-status-list',
					'dataType': 'json',
					'cache': true
				})
				.done(function(data) {
					statusSelectElem.html('');
					_ember['default'].$.each(data, function(index, item) {
						var thisOption = new Option(_ember['default'].String.capitalize(item), item, false, false);
						statusSelectElem.append(thisOption);
					});

					statusSelectElem.val(self.get('model').get('status')).trigger('change');
				})
				.fail(function() {
					console.error(window.apiServer + 'pages/publish-status-list error:\n', arguments);
				});


				permissionSelectElem.select2({
					'minimumInputLength': 0,
					'minimumResultsForSearch': 10,

					'allowClear': true,
					'closeOnSelect': true,

					'placeholder': 'View Permission'
				})
				.on('change', function() {
					self.get('model').set('permission', permissionSelectElem.val());
				});

				_ember['default'].$.ajax({
					'url': window.apiServer + 'masterdata/server-permissions',
					'dataType': 'json',
					'cache': true
				})
				.done(function(data) {
					permissionSelectElem.html('');
					_ember['default'].$.each(data, function(index, item) {
						var thisOption = new Option(item.name, item.id, false, false);
						permissionSelectElem.append(thisOption);
					});

					if(self.get('model').get('permission'))
						permissionSelectElem.val(self.get('model').get('permission')).trigger('change');
					else
						permissionSelectElem.val(data[0].id).trigger('change');
				})
				.fail(function() {
					console.error(window.apiServer + 'masterdata/server-permissions error:\n', arguments);
				});
			},

			'actions': {
				'controller-action': function(action, data) {
					if(this[action])
						this[action](data);
					else
						this.sendAction('controller-action', action, data);
				}
			}
		});

		exports['default'] = PageEditWidget;
	}
);
