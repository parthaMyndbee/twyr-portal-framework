define(
	'twyr-webapp/components/module-tree-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/module-tree-widget');
		var ModuleTreeWidget = _baseWidget['default'].extend({
			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				var moduTree = self.$('div#module-tree-container').jstree({
					'core': {
						'check_callback': false,
						'multiple': false,

						'themes': {
							'name': 'bootstrap',
							'icons': false,
							'responsive': false
						},

						'data': {
							'url': window.apiServer + 'modules/tree',
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

				moduTree.on('activate_node.jstree', function(event, node) {
					self.sendAction('controller-action', 'selected-module-changed', node.node.id);
				});

				moduTree.on('ready.jstree', function() {
					var rootNodeId = self.$('div#module-tree-container > ul > li:first-child').attr('id');
					self.$('div#module-tree-container').jstree('activate_node', rootNodeId, false, false);
				});
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				self.$('div#module-tree-container').jstree(true).destroy();
			}
		});

		exports['default'] = ModuleTreeWidget;
	}
);
