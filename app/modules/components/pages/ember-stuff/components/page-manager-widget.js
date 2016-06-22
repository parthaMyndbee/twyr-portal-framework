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

				if(self._pageListDataTable)
					self._pageListDataTable.destroy();
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

			'addPage': function(event) {
				event.stopPropagation();
				event.preventDefault();

				var self = this,
					newPage = null;

				self.get('model').store.findRecord('profile', window.twyrUserId)
				.then(function(profile) {
					newPage = self.get('model').store.createRecord('page', {
						'id': _app['default'].UUID(),
						'profile': profile,

						'title': '',
						'content': '',
						'status': 'draft',

						'createdAt': new Date(),
						'updatedAt': new Date()
					});

					return newPage.save();
				})
				.then(function(saved) {
					return self._pageListDataTable.ajax.reload(null, false);
				})
				.then(function() {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': 'New Page created'
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
				event.stopPropagation();
				event.preventDefault();

				console.log('Edit Page for: ' + pageId);
			},

			'deletePage': function(pageId, event) {
				event.stopPropagation();
				event.preventDefault();

				var self = this,
					page = self.get('model').store.peekRecord('page', pageId);

				window.$.confirm({
					'title': 'Delete Page',
					'text': 'Are you sure you want to delete "' + (page.get('title') || 'New Page') + '"?',

					'confirmButtonClass': 'btn btn-flat btn-danger',
					'cancelButtonClass': 'btn btn-flat btn-primary',

					'confirm': function() {
						page.destroyRecord()
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
