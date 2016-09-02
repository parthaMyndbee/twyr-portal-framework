define(
	'twyr-webapp/components/tenant-manager-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/tenant-manager-widget');
		var TenantManagerWidget = _baseWidget['default'].extend({
			'selectedTenant': null,
			'watchWidgetContainerResize': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				if(!self.get('watchWidgetContainerResize')) {
					self.set('watchWidgetContainerResize', new MutationObserver(self._equalizeHeights.bind(self)));
				}

				var watchElement = document.getElementById('div-tenant-manager-widget-details-container'),
					watchConfig = { 'attributes': true, 'childList': true, 'subtree': true };

				self.get('watchWidgetContainerResize').observe(watchElement, watchConfig);
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				if(!self.get('watchWidgetContainerResize')) {
					return;
				}

				self.get('watchWidgetContainerResize').disconnect();
				self.set('watchWidgetContainerResize', undefined);
			},

			'selected-tenant-changed': function(tenantId) {
				var self = this;
				if(self.get('selectedTenant') && (self.get('selectedTenant').get('id') == tenantId))
					return;

				self.get('store')
				.findRecord('tenant', tenantId)
				.then(function(tenant) {
					self.set('selectedTenant', tenant);
				})
				.catch(function(err) {
					self.set('selectedTenant', null);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'_equalizeHeights': function(mutations) {
				window.$('div#div-tenant-manager-widget-tree-container').css('min-height', window.$('div#div-tenant-manager-widget-details-container').height());
			}
		});

		exports['default'] = TenantManagerWidget;
	}
);
