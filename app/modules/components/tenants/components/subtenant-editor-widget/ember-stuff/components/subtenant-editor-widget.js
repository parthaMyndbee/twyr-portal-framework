define(
	'twyr-webapp/components/subtenant-editor-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/subtenant-editor-widget');
		var SubtenantEditorWidget = _baseWidget['default'].extend({
			'_suborganizationListDataTable': null,
			'_departmentListDataTable': null,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				if(self.get('_suborganizationListDataTable'))
					return;

				self.set('_suborganizationListDataTable', self.$('table#subtenant-organization-list').DataTable({
					'rowId': 'id',

					'columns': [
						{ 'data': 'name' },
						{ 'data': 'created' },
						{ 'data': 'updated' }
					],

					'columnDefs': [{
						'targets': [3],
						'searchable': false,
						'sortable': false,

						'render': function(whatever, type, row) {
							return '<div class="subtenant-row-operations" id="' + row.id + '" style="width:100%; text-align:right;" />';
						}
					}],

					'order': [
						[ 0, 'asc' ]
					]
				}));

				self.set('_departmentListDataTable', self.$('table#subtenant-department-list').DataTable({
					'rowId': 'id',

					'columns': [
						{ 'data': 'name' },
						{ 'data': 'created' },
						{ 'data': 'updated' }
					],

					'columnDefs': [{
						'targets': [3],
						'searchable': false,
						'sortable': false,

						'render': function(whatever, type, row) {
							return '<div class="subtenant-row-operations" id="' + row.id + '" style="width:100%; text-align:right;" />';
						}
					}],

					'order': [
						[ 0, 'asc' ]
					]
				}));

				self._redrawDataTables();
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				if(self.get('_suborganizationListDataTable')) {
					self.get('_suborganizationListDataTable').destroy();
					self.set('_suborganizationListDataTable', null);
				}

				if(self.get('_departmentListDataTable')) {
					self.get('_departmentListDataTable').destroy();
					self.set('_departmentListDataTable', null);
				}
			},

			'onModelChanged': _ember['default'].observer('model', function() {
				this._redrawDataTables();
				if(this.get('model').get('type') == 'department')
					self.$('div#subtenant-editor-widget-organizations').hide();
				else
					self.$('div#subtenant-editor-widget-organizations').show();
			}),

			'onModelChildrenChanged': _ember['default'].observer('model.children.[]', function() {
				this._redrawDataTables();
			}),

			'_redrawDataTables': function() {
				var self = this;
				self.$('div.subtenant-row-operations').html('');

				if(!self.get('model')) {
					self.get('_suborganizationListDataTable').rows().remove();
					self.get('_departmentListDataTable').rows().remove();

					self.get('_suborganizationListDataTable').draw();
					self.get('_departmentListDataTable').draw();

					return;
				}

				self.get('model').get('children')
				.then(function(children) {
					var subOrganizations = children.filterBy('type', 'organization'),
						departments = children.filterBy('type', 'department');

					if(!subOrganizations.length) {
						self.get('_suborganizationListDataTable').rows().remove();
						self.get('_suborganizationListDataTable').draw();
					}

					if(!departments.length) {
						self.get('_departmentListDataTable').rows().remove();
						self.get('_departmentListDataTable').draw();
					}

					self._refreshDatainDataTable(self.get('_suborganizationListDataTable'), subOrganizations);
					self._refreshDatainDataTable(self.get('_departmentListDataTable'), departments);

					return null;
				})
				.catch(function(err) {
					console.error(err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'_refreshDatainDataTable': function(dataTable, data) {
				if(!data.length) return;

				// Remove all rows from the table who are not children of the current model
				var rowIds = dataTable.rows().ids(),
					toBeRemoved = [];

				window.$.each(rowIds, function(index, rowId) {
					var isChildOfCurrentModel = data.filter(function(dataRecord) {
						return dataRecord.get('id') == rowId;
					}).length;

					if(isChildOfCurrentModel)
						return;

					toBeRemoved.push(index);
				});

				toBeRemoved.reverse();
				window.$.each(toBeRemoved, function(index, rowIndex) {
					dataTable.row(rowIndex).remove();
				});

				// Add all rows from the children of the current model not in the table
				rowIds = dataTable.rows().ids();
				data.forEach(function(dataRecord) {
					var doesAlreadyExist = rowIds.indexOf(dataRecord.get('id'));
					if(doesAlreadyExist >= 0)
						return;

					dataTable.row.add({
						'id': dataRecord.get('id'),
						'name': dataRecord.get('name'),
						'created': dataRecord.get('formattedCreatedAt'),
						'updated': dataRecord.get('formattedUpdatedAt')
					});
				});

				// Redraw for display...
				dataTable.draw();
				dataTable.on('draw.dt', this._setupRowOperations.bind(this, dataTable));
			},

			'_setupRowOperations': function(dataTable) {
				var self = this;
				window.$.each(dataTable.$('div.subtenant-row-operations'), function(index, divElem) {
					divElem = window.$(divElem);
					divElem.html('');

					var editSubTenantButton = self.$('<button type="button" class="btn btn-flat btn-sm btn-primary" />');
					editSubTenantButton.html('<span class="fa fa-edit" style="margin-right:3px;" />Edit');
					editSubTenantButton.click(self['edit-subtenant'].bind(self, divElem.prop('id')));

					var deleteSubTenantButton = self.$('<button type="button" class="btn btn-flat btn-sm btn-danger" style="margin-left:5px;" />');
					deleteSubTenantButton.html('<span class="fa fa-trash" style="margin-right:3px;" />Delete');
					deleteSubTenantButton.click(self['delete-subtenant'].bind(self, divElem.prop('id')));

					divElem.append(editSubTenantButton);
					divElem.append(deleteSubTenantButton);
				});
			},

			'add-subtenant': function(type) {
				this.sendAction('controller-action', 'add-organization', {
					'parent': this.get('model'),
					'type': type
				});
			},

			'edit-subtenant': function(organizationId) {
				this.sendAction('controller-action', 'selected-tenant-changed', organizationId);
			},

			'delete-subtenant': function(organizationId) {
				this.sendAction('controller-action', 'delete-organization', this.get('store').peekRecord('tenant', organizationId));
			}
		});

		exports['default'] = SubtenantEditorWidget;
	}
);
