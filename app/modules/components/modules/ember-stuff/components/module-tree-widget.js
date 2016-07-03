define(
	'twyr-webapp/components/module-tree-widget',
	['exports', 'ember', 'twyr-webapp/application'],
	function(exports, _ember, _app) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/module-tree-widget');
		var ModuleTreeWidget = _ember['default'].Component.extend({
			'didRender': function() {
				var self = this;
				self._super(...arguments);

				var moduTree = self.$('div#module-tree-container').jstree({
					'core': {
						'check_callback': false,
						'multiple': false,

						'themes': {
							'name': 'proton',
							'responsive': true
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

		exports['default'] = ModuleTreeWidget;
	}
);
