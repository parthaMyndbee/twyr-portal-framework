define(
	'twyr-webapp/components/modules-default-widget',
	['exports', 'ember', 'twyr-webapp/application'],
	function(exports, _ember, _app) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/modules-default-widget');
		var ModulesDefaultWidget = _ember['default'].Component.extend({
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

		exports['default'] = ModulesDefaultWidget;
	}
);
