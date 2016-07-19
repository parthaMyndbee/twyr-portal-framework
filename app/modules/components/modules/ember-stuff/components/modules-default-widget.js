define(
	'twyr-webapp/components/modules-default-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/modules-default-widget');
		var ModulesDefaultWidget = _baseWidget['default'].extend({
			'_selectedModule': null,

			'selected-module-changed': function(moduleId) {
				var self = this;
				if(self.get('_selectedModule') && (self.get('_selectedModule').get('id') == moduleId))
					return;

				self.get('model').store
				.findRecord('module', moduleId)
				.then(function(module) {
					self.set('_selectedModule', module);
				})
				.catch(function(err) {
					self.set('_selectedModule', null);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			}
		});

		exports['default'] = ModulesDefaultWidget;
	}
);
