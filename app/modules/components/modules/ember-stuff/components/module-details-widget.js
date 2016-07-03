define(
	'twyr-webapp/components/module-details-widget',
	['exports', 'ember', 'twyr-webapp/application'],
	function(exports, _ember, _app) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/module-details-widget');
		var ModuleDetailsWidget = _ember['default'].Component.extend({
			'_configurationEditor': null,
			'_switchery': null,

			'didRender': function() {
				var self = this;
				self._super(...arguments);

				self._initJSONEditor();
				self._initSwitchery();
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				self._uninitJSONEditor();
				self._uninitSwitchery();
			},

			'onModelChanged': _ember['default'].observer('model', function() {
				var self = this;

				_ember['default'].run.scheduleOnce('afterRender', function() {
					self._initJSONEditor();
					self._initSwitchery();
				});
			}),

			'save': function() {
				var self = this;

				self.get('model')
				.save()
				.then(function() {
					self.get('_configurationEditor').setValue(self.get('model').get('parsedConfiguration'));
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': 'Configuration Changes saved succesfully'
					});
				})
				.catch(function(err) {
					console.error('Error saving module configuration: ', err);
					self.get('_configurationEditor').setValue(self.get('model').get('parsedConfiguration'));

					self.sendAction('controller-action', 'display-status-message', {
						'type': 'ember-error',
						'errorModel': self.get('model')
					});
				});
			},

			'cancel': function() {
				this.get('model').rollbackAttributes();
				this.get('_configurationEditor').setValue(this.get('model').get('parsedConfiguration'));
			},

			'_initJSONEditor': function() {
				var self = this;
				self._uninitJSONEditor();

				if(!self.get('model')) {
					return;
				}

				var configEditDiv = document.getElementById('module-details-widget-div-configuration-editor-' + self.get('model').get('id'));
				if(!configEditDiv) {
					return;
				}

				self.set('_configurationEditor', new JSONEditor(configEditDiv, {
					'theme': 'bootstrap3',
					'iconlib': 'fontawesome4',
					'template': 'handlebars',

					'refs': {},
					'schema': {},

					'startval': self.get('model').get('parsedConfiguration')
				}));

				self.get('_configurationEditor').on('change', self._updateModuleConfiguration.bind(self));
			},

			'_initSwitchery': function() {
				var self = this;
				self._uninitSwitchery();

				if(!self.get('model')) {
					return;
				}

				var switcheryChkBox = document.querySelector('input.js-switch');
				if(!switcheryChkBox) return;

				self.set('_switchery', new Switchery(switcheryChkBox));
			},

			'_uninitJSONEditor': function() {
				var self = this;

				if(self.get('_configurationEditor')) {
					self.get('_configurationEditor').off('change', self._updateModuleConfiguration.bind(self));
					self.get('_configurationEditor').destroy();
				}
			},

			'_uninitSwitchery': function() {
				var self = this;
				if(self.get('_switchery')) {
					self.get('_switchery').destroy();
					self.set('_switchery', null);
				}

				if(self.$('input.js-switch').attr('data-switchery') == 'true') {
					self.$('input.js-switch').removeAttr('data-switchery');
					self.$('span.switchery').remove();
				}
			},

			'_updateModuleConfiguration': function() {
				this.get('model').set('parsedConfiguration', this.get('_configurationEditor').getValue());
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

		exports['default'] = ModuleDetailsWidget;
	}
);
