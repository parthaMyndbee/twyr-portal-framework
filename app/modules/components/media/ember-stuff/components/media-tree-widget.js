define(
	'twyr-webapp/components/media-tree-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-tree-widget');
		var MediaTreeWidget = _baseWidget['default'].extend({
			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				var moduTree = self.$('div#media-tree-container').jstree({
					'core': {
						'check_callback': false,
						'multiple': false,

						'themes': {
							'name': 'bootstrap',
							'icons': false,
							'responsive': false
						},

						'data': {
							'url': 'media/tree',
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
					self.sendAction('controller-action', 'selected-media-changed', node.node.id);
				});

				moduTree.on('ready.jstree', function() {
					var rootNodeId = self.$('div#media-tree-container > ul > li:first-child').attr('id');
					self.$('div#media-tree-container').jstree('activate_node', rootNodeId, false, false);
					self.$('div#media-tree-container').jstree('open_node', rootNodeId);
				});
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				self.$('div#media-tree-container').jstree(true).destroy();
			},

			'onSelectedMediaChanged': _ember['default'].observer('selectedMedia', function() {
				var self = this;
				if(!self.get('selectedMedia'))
					return;

				self.$('div#media-tree-container').jstree('activate_node', self.get('selectedMedia').get('id'), false, false);
				self.$('div#media-tree-container').jstree('open_node', self.get('selectedMedia').get('id'));
			}),

			'onSelectedMediaChildrenChanged': _ember['default'].observer('selectedMedia.children.[]', function() {
				var self = this;
				if(!self.get('selectedMedia'))
					return;

				if(self.$('div#media-tree-container').jstree('get_selected')[0] != self.get('selectedMedia').get('id'))
					return;

				self.$('div#media-tree-container').jstree('refresh_node', self.get('selectedMedia').get('id'), false, false);
				self.$('div#media-tree-container').jstree('open_node', self.get('selectedMedia').get('id'));
			})
		});

		exports['default'] = MediaTreeWidget;
	}
);
