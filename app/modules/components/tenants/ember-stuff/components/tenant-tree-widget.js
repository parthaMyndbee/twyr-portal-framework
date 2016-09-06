define(
	'twyr-webapp/components/tenant-tree-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/tenant-tree-widget');
		var TenantTreeWidget = _baseWidget['default'].extend({
			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				var tenantTree = self.$('div#tenant-tree-container').jstree({
					'core': {
						'multiple': false,
						'check_callback': true,

						'themes': {
							'name': 'bootstrap',
							'icons': true,
							'dots': false,
							'responsive': true
						},

						'data': {
							'url': window.apiServer + 'tenants/tree',
							'dataType': 'json',
							'data': function(node) {
								return { 'id': node.id };
							}
						}
					},

					'conditionalselect': function(node, event) {
						return (node.id.indexOf('::') < 0);
					},

					'sort': function(leftNodeId, rightNodeId) {
						var leftNode = self.$('div#tenant-tree-container').jstree('get_node', leftNodeId),
							leftNodeText = self.$('div#tenant-tree-container').jstree('get_text', leftNode),
							leftNodeType = self.$('div#tenant-tree-container').jstree('get_type', leftNode);

						var rightNode = self.$('div#tenant-tree-container').jstree('get_node', rightNodeId),
							rightNodeText = self.$('div#tenant-tree-container').jstree('get_text', rightNode),
							rightNodeType = self.$('div#tenant-tree-container').jstree('get_type', rightNode);

						if(leftNodeType == rightNodeType)
							return (leftNodeText >= rightNodeText);

						if((leftNodeType == 'department') && (rightNodeType != 'department'))
							return -1;

						return 1;
					},

					'types': {
						'default': {
							'icon': 'fa fa-tree'
						},

						'organization': {
							'icon': 'fa  fa-sitemap'
						},

						'department': {
							'icon': 'fa fa-home'
						}
					},

					'plugins': ['conditionalselect', 'sort', 'types', 'unique']
				});

				tenantTree.on('activate_node.jstree', function(event, node) {
					self.sendAction('controller-action', 'selected-tenant-changed', node.node.id);
				});

				tenantTree.on('ready.jstree', function() {
					var rootNodeId = self.$('div#tenant-tree-container > ul > li:first-child').attr('id');
					self.$('div#tenant-tree-container').jstree('activate_node', rootNodeId, false, false);
				});
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				self.$('div#tenant-tree-container').jstree(true).destroy();
			},

			'onSelectedTenantChanged': _ember['default'].observer('selectedTenant', function() {
				var self = this;
				if(!self.get('selectedTenant'))
					return;

				var treeNode = self.$('div#tenant-tree-container').jstree('get_node', self.get('selectedTenant.id'));
				if(treeNode) {
					self.$('div#tenant-tree-container').jstree('activate_node', treeNode, false, false);
					self.$('div#tenant-tree-container').jstree('open_node', treeNode);

					return;
				}

				var parentTreeNode = self.$('div#tenant-tree-container').jstree('get_node', self.get('selectedTenant.parent.id'));
				self.$('div#tenant-tree-container').jstree('open_node', parentTreeNode, function() {
					var isNodePresent = self.$('div#tenant-tree-container').jstree('get_node', self.get('selectedTenant.id'));
					if(isNodePresent) {
						self.$('div#tenant-tree-container').jstree('activate_node', self.get('selectedTenant.id'), false, false);
						return;
					}

					self.$('div#tenant-tree-container').jstree('refresh_node', parentTreeNode);
					self.$('div#tenant-tree-container').one('refresh_node.jstree', function() {
						var isNodePresent = self.$('div#tenant-tree-container').jstree('get_node', self.get('selectedTenant.id'));
						if(isNodePresent) {
							self.$('div#tenant-tree-container').jstree('activate_node', self.get('selectedTenant.id'), false, false);
						}
					});
				});
			}),

			'onSelectedTenantNameChanged': _ember['default'].observer('selectedTenant.name', function() {
				var self = this;
				if(!self.get('selectedTenant'))
					return;

				var treeNode = self.$('div#tenant-tree-container').jstree('get_node', self.get('selectedTenant.id'));
				if(!treeNode) return;

				self.$('div#tenant-tree-container').jstree('rename_node', treeNode, self.get('selectedTenant.name'));
			}),

			'onSelectedTenantDeleted': _ember['default'].observer('selectedTenant.isDeleted', function() {
				var self = this;
				if(!self.get('selectedTenant'))
					return;

				if(!self.get('selectedTenant.isDeleted'))
					return;

				var treeNode = self.$('div#tenant-tree-container').jstree('get_node', self.get('selectedTenant.id'));
				if(!treeNode) return;

				self.$('div#tenant-tree-container').jstree('delete_node', treeNode);
			}),

			'onSelectedTenantChildDeleted': _ember['default'].observer('selectedTenant.children.@each.isDeleted', function() {
				var self = this;
				if(!self.get('selectedTenant'))
					return;

				var deletedOrgs = self.get('selectedTenant.children').filterBy('isDeleted', true);
				deletedOrgs.forEach(function(deletedOrg) {
					var treeNode = self.$('div#tenant-tree-container').jstree('get_node', deletedOrg.get('id'));
					if(!treeNode) return;

					self.$('div#tenant-tree-container').jstree('delete_node', treeNode);
				});
			})
		});

		exports['default'] = TenantTreeWidget;
	}
);
