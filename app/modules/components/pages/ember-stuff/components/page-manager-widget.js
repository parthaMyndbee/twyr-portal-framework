define(
	'twyr-portal/components/page-manager-widget',
	['exports', 'ember'],
	function(exports, _ember) {
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
					}],

					'order': [
						[ 1, 'asc' ]
					]
				});
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				if(self._pageListDataTable)
					self._pageListDataTable.destroy();
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
