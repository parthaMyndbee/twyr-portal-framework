define(
	'twyr-webapp/components/tenant-editor-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/tenant-editor-widget');
		var TenantEditorWidget = _baseWidget['default'].extend({
			'add-organization': function(data) {
				var self = this,
					newOrg = null;

				if((data.parent.get('type') == 'department') && (data.type != 'department')) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': 'Departments cannot own organizations'
					});
					return;
				}

				newOrg = this.get('store').createRecord('tenant', {
					'id': _app['default'].UUID(),
					'type': data.type
				});

				data.parent.get('children')
				.then(function(children) {
					var postscript = 1,
						doesNameExist = children.filterBy('name', newOrg.get('name') + ' ' + postscript).length;

					while(doesNameExist) {
						postscript++;
						doesNameExist = children.filterBy('name', newOrg.get('name') + ' ' + postscript).length;
					}

					newOrg.set('name', newOrg.get('name') + ' ' + postscript);
					newOrg.set('parent', data.parent);

					children.addObject(newOrg);
					return newOrg.save();
				})
				.then(function() {
					self.sendAction('controller-action', 'selected-tenant-changed', newOrg.get('id'));
				})
				.catch(function(err) {
					console.error(err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'save-organization': function(tenant) {
				var self = this;

				tenant.save()
				.catch(function(err) {
					tenant.rollbackAttributes();

					console.error(err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'cancel-organization': function(tenant) {
				tenant.rollbackAttributes();
			},

			'delete-organization': function(tenant) {
				var self = this,
					tenantName = tenant.get('name'),
					tenantParentId = tenant.get('parent.id'),
					confirmFn = function() {
						tenant.destroyRecord()
						.then(function() {
							self.sendAction('controller-action', 'display-status-message', {
								'type': 'success',
								'message': tenantName + ' Deleted successfully!'
							});

							self.sendAction('controller-action', 'selected-tenant-changed', tenantParentId);
						})
						.catch(function(err) {
							tenant.rollbackAttributes();

							console.error(err);
							self.sendAction('controller-action', 'display-status-message', {
								'type': 'danger',
								'message': err.message
							});
						});
					};

				if(tenant.get('isNew')) {
					confirmFn();
					return;
				}

				window.$.confirm({
					'title': 'Delete Menu',
					'text': 'Are you sure you want to delete the <b>' + tenantName + '</b> Organization?',

					'confirmButtonClass': 'btn btn-flat btn-danger',
					'cancelButtonClass': 'btn btn-flat btn-primary',

					'confirm': confirmFn,
					'cancel': function() {}
				});
			}
		});

		exports['default'] = TenantEditorWidget;
	}
);
