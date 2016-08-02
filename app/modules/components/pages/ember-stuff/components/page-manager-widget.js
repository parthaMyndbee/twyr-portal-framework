define(
	'twyr-webapp/components/page-manager-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/page-manager-widget');
		var PageManagerWidget = _baseWidget['default'].extend({
			'_pageListDataTable': null,
			'_pageCache': _ember['default'].ObjectProxy.create({ 'content': _ember['default'].Object.create({}) }),

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				if(self.get('_pageListDataTable'))
					return;

				self.set('_pageListDataTable', self.$('table#pages-default-page-list').DataTable({
					'ajax': window.apiServer + 'pages/list',
					'rowId': 'id',

					'columns': [
						{ 'data': 'title' },
						{ 'data': 'author' },
						{ 'data': 'status' },
						{ 'data': 'permission' },
						{ 'data': 'created' },
						{ 'data': 'updated' }
					],

					'columnDefs': [{
						'targets': [6],
						'searchable': false,
						'sortable': false,

						'render': function(whatever, type, row) {
							return '<div class="page-row-operations" id="' + row.id + '" style="width:100%; text-align:right;" />';
						}
					}],

					'order': [
						[ 0, 'asc' ]
					]
				}));

				var addPageButton = self.$('<button type="button" class="btn btn-flat btn-sm btn-success" style="margin-left:5px;" />');
				addPageButton.html('<span class="fa fa-plus" style="margin-right:3px;" />New Page');
				addPageButton.click(self.addPage.bind(self));
				self.$('div.dataTables_filter').append(addPageButton);

				self.get('_pageListDataTable').on('draw.dt', self._setupRowOperations.bind(self));
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				var pages = self.get('store').peekAll('pages-default');
				pages.forEach(function(page) {
					page.set('isEditing', false);
					self._removePageObservers(page);
				});

				if(self.get('_pageListDataTable')) {
					self.get('_pageListDataTable').destroy();
					self.set('_pageListDataTable', null);
				}
			},

			'_addPageObservers': function(page) {
				var self = this;

				if(!self.get('hasDirtyAttributesObserver')) {
					self.set('hasDirtyAttributesObserver', (function(pageRecord) {
						var newTitle = pageRecord.get('title');
						var newStatus = _ember['default'].String.capitalize(pageRecord.get('status'));

						if(pageRecord.get('hasDirtyAttributes'))
							newTitle += ' *';

						var tblRow = self.get('_pageListDataTable').row('tr#' + pageRecord.get('id'));
						self.get('_pageListDataTable').cell(tblRow.index(), 0).data(newTitle);
						self.get('_pageListDataTable').cell(tblRow.index(), 2).data(newStatus);

						var permission = self.get('store').peekRecord('module-permission', pageRecord.get('permission'));
						if(permission) {
							self.get('_pageListDataTable').cell(tblRow.index(), 3).data(permission.get('displayName'));
							return;
						}

						self.get('store').findRecord('module-permission', pageRecord.get('permission'))
						.then(function(permission) {
							self.get('_pageListDataTable').cell(tblRow.index(), 3).data(permission.get('displayName'));
						})
						.catch(function(err) {
							console.error(err);
						});
					}).bind(self));
				}

				if(!self.set('titleObserver')) {
					self.set('titleObserver', (function(pageRecord) {
						var newTitle = pageRecord.get('title');
						if(pageRecord.get('hasDirtyAttributes'))
							newTitle += ' *';

						var tblRow = self.get('_pageListDataTable').row('tr#' + pageRecord.get('id'));
						self.get('_pageListDataTable').cell(tblRow.index(), 0).data(newTitle);
					}).bind(self));
				}

				if(!self.set('statusObserver')) {
					self.set('statusObserver', (function(pageRecord) {
						var newStatus = _ember['default'].String.capitalize(pageRecord.get('status'));

						var tblRow = self.get('_pageListDataTable').row('tr#' + pageRecord.get('id'));
						self.get('_pageListDataTable').cell(tblRow.index(), 2).data(newStatus);
					}).bind(self));
				}

				if(!self.set('permissionObserver')) {
					self.set('permissionObserver', (function(pageRecord) {
						var permission = self.get('store').peekRecord('module-permission', pageRecord.get('permission'));
						if(permission) {
							var tblRow = self.get('_pageListDataTable').row('tr#' + pageRecord.get('id'));
							self.get('_pageListDataTable').cell(tblRow.index(), 3).data(permission.get('displayName'));

							return;
						}

						self.get('store').findRecord('module-permission', pageRecord.get('permission'))
						.then(function(permission) {
							var tblRow = self.get('_pageListDataTable').row('tr#' + pageRecord.get('id'));
							self.get('_pageListDataTable').cell(tblRow.index(), 3).data(permission.get('displayName'));
						})
						.catch(function(err) {
							console.error(err);
						});
					}).bind(self));
				}

				page.addObserver('hasDirtyAttributes', self.get('hasDirtyAttributesObserver'));
				page.addObserver('title', self.get('titleObserver'));
				page.addObserver('status', self.get('statusObserver'));
				page.addObserver('permission', self.get('permissionObserver'));
			},

			'_removePageObservers': function(pageRecord) {
				var self = this;

				pageRecord.removeObserver('hasDirtyAttributes', self.get('hasDirtyAttributesObserver'));
				pageRecord.removeObserver('title', self.get('titleObserver'));
				pageRecord.removeObserver('status', self.get('statusObserver'));
				pageRecord.removeObserver('permission', self.get('permissionObserver'));
			},

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

			'anyPagesEditing': _ember['default'].computed('model.@each.isEditing', function() {
				return !!(this.get('model').filterBy('isEditing', true).get('length'));
			}),

			'addPage': function(event) {
				event.stopPropagation();
				event.preventDefault();

				var self = this,
					newPage = null;

				self.get('store').findRecord('profile', window.twyrUserId)
				.then(function(profile) {
					newPage = self.get('store').createRecord('pages-default', {
						'id': _app['default'].UUID(),
						'author': profile
					});

					self.get('_pageListDataTable').row.add({
						'id': newPage.get('id'),
						'title': newPage.get('title'),
						'author': profile.get('fullName'),
						'status': _ember['default'].String.capitalize(newPage.get('status')),
						'permission': '',
						'created': newPage.get('formattedCreatedAt'),
						'updated': newPage.get('formattedUpdatedAt')
					}).draw();

					newPage.set('isEditing', true);
					self._addPageObservers(newPage);

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

				var page = self.get('store').peekRecord('pages-default', pageId);
				if(page) {
					page.set('isEditing', true);
					self._addPageObservers(page);

					_ember['default'].run.scheduleOnce('afterRender', function() {
						self.$('li#page-manager-widget-list-' + page.get('id') + '-link a').click();
					});

					return;
				}

				self.get('store').findRecord('pages-default', pageId)
				.then(function(page) {
					page.set('isEditing', true);
					self._addPageObservers(page);

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
					isNew = page.get('isNew'),
					pageId = page.get('id'),
					confirmFn = function() {
						self._removePageObservers(page);
						page.set('isEditing', false);

						if(isNew) {
							self.get('_pageListDataTable').row('tr#' + pageId).remove().draw();
						}

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
						var page = self.get('store').peekRecord('pages-default', pageId);
						if(page) {
							self._removePageObservers(page);
							page.destroyRecord()
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
							})
							.finally(function() {
								self.get('_pageListDataTable').row('tr#' + pageId).remove().draw();
							});

							return;
						}

						_ember['default'].RSVP.allSettled([
							_ember['default'].$.ajax({
								'method': 'DELETE',
								'url': window.apiServer + 'pages/pages-defaults/' + pageId,
								'dataType': 'json',
								'cache': false
							})
						])
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
						})
						.finally(function() {
							self.get('_pageListDataTable').row('tr#' + pageId).remove().draw();
						});
					},

					'cancel': function() {
					}
				});
			}
		});

		exports['default'] = PageManagerWidget;
	}
);

define(
	'twyr-webapp/components/page-edit-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/page-edit-widget');
		var PageEditWidget = _baseWidget['default'].extend({
			'_ckEditor': null,

			'didInsertElement': function() {
				var statusSelectElem = _ember['default'].$('select#page-edit-widget-select-status-' + this.get('model').get('id')),
					permissionSelectElem = _ember['default'].$('select#page-edit-widget-select-permission-' + this.get('model').get('id')),
					contentEditElem = _ember['default'].$('textarea#page-edit-widget-textarea-content-' + this.get('model').get('id')),
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
					'url': window.apiServer + 'masterdata/publish-status-list',
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
					console.error(window.apiServer + 'masterdata/publish-status-list error:\n', arguments);
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

				if(!self.get('_ckEditor')) {
					self.set('_ckEditor', contentEditElem.ckeditor({
						'filebrowserBrowseUrl': '/pages/listFiles/?page=' + self.get('model').get('id'),
						'filebrowserImageBrowseUrl': '/pages/listImages/?page=' + self.get('model').get('id'),

						'filebrowserBrowseLinkUrl': '/pages/listFiles/?page=' + self.get('model').get('id'),
						'filebrowserImageBrowseLinkUrl': '/pages/listImages/?page=' + self.get('model').get('id'),

						'filebrowserUploadUrl': '/pages/uploadFile/?page=' + self.get('model').get('id'),
						'filebrowserImageUploadUrl': '/pages/uploadImage/?page=' + self.get('model').get('id'),

						'mathJaxLib': '//cdn.mathjax.org/mathjax/2.6-latest/MathJax.js?config=TeX-AMS_HTML',

						'uploadUrl': '/pages/uploadDroppedFile/?page=' + self.get('model').get('id'),
						'imageUploadUrl': '/pages/uploadDroppedImage/?page=' + self.get('model').get('id')
					}));

					self.get('_ckEditor').editor.on('change', function(event) {
						self.get('model').set('content', self.get('_ckEditor').editor.getData());
					});
				}
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				if(self.get('_ckEditor')) {
					self.get('_ckEditor').editor.destroy();
					self.set('_ckEditor', null);
				}

				self.get('model').set('isEditing', false);
			}
		});

		exports['default'] = PageEditWidget;
	}
);
