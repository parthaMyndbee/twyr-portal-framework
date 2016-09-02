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
						'check_callback': false,
						'multiple': false,

						'themes': {
							'name': 'proton',
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

					'plugins': ['conditionalselect', 'sort', 'unique']
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
			}
		});

		exports['default'] = TenantTreeWidget;
	}
);
