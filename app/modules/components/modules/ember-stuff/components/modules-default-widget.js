define(
	'twyr-webapp/components/modules-default-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/modules-default-widget');
		var ModulesDefaultWidget = _baseWidget['default'].extend({
			'selectedModule': null,
			'watchWidgetContainerResize': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				if(!self.get('watchWidgetContainerResize')) {
					self.set('watchWidgetContainerResize', new MutationObserver(self._equalizeHeights.bind(self)));
				}

				var watchElement = document.getElementById('div-modules-default-widget-details-container'),
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

			'selected-module-changed': function(moduleId) {
				var self = this;
				if(self.get('selectedModule') && (self.get('selectedModule').get('id') == moduleId))
					return;

				self.get('store')
				.findRecord('module', moduleId)
				.then(function(module) {
					self.set('selectedModule', module);
				})
				.catch(function(err) {
					self.set('selectedModule', null);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'_equalizeHeights': function(mutations) {
				window.$('div#div-modules-default-widget-tree-container').css('min-height', window.$('div#div-modules-default-widget-details-container').height());
			}
		});

		exports['default'] = ModulesDefaultWidget;
	}
);
