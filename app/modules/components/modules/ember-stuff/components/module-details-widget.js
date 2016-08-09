define(
	'twyr-webapp/components/module-details-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/module-details-widget');
		var ModuleDetailsWidget = _baseWidget['default'].extend({
			'_configurationEditor': undefined,
			'_switchery': undefined,

			'currentlyEditingTemplate': undefined,

			'onModelChanged': _ember['default'].observer('model', function() {
				var self = this;

				self._uninitJSONEditor();
				self._uninitSwitchery();

				if(!self.get('model')) {
					return;
				}

				_ember['default'].run.scheduleOnce('afterRender', function() {
					self._initJSONEditor();
					self._initSwitchery();

					if(!self.$('li.module-details-widget-tab a').length)
						return;

					(self.$('li.module-details-widget-tab a')[0]).click();
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

			'editTemplate': function(template) {
				this.stopEditTemplate();

				this.set('currentlyEditingTemplate', template);
				this.$('div#module-details-widget-dialog-template-editor').modal({
					'backdrop': 'static',
					'keyboard': false
				});
			},

			'stopEditTemplate': function(template) {
				if(!template) {
					return;
				}

				if(!template.get('hasDirtyAttributes')) {
					this.$('div#module-details-widget-dialog-template-editor').modal('hide');
					this.set('currentlyEditingTemplate', null);
					return;
				}

				var self = this;
				window.$.confirm({
					'title': 'Cancel Template changes?',
					'text': 'Are you sure you want to stop editing this template? You will lose any changes you have already made',

					'confirmButtonClass': 'btn btn-flat btn-danger',
					'cancelButtonClass': 'btn btn-flat btn-primary',

					'confirm': function() {
						self.$('div#module-details-widget-dialog-template-editor').modal('hide');

						self.get('currentlyEditingTemplate').rollbackAttributes();
						self.set('currentlyEditingTemplate', null);
					},

					'cancel': function() {
					}
				});
			},

			'saveTemplate': function(template) {
				var self = this;

				template.save()
				.then(function() {
					self.$('div#module-details-widget-dialog-template-editor').modal('hide');
					self.set('currentlyEditingTemplate', null);

					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': 'Template updated succesfully'
					});
				})
				.catch(function(err) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'deleteTemplate': function(template) {
				window.$.confirm({
					'title': 'Delete Template',
					'text': 'Are you sure you want to delete this template?',

					'confirmButtonClass': 'btn btn-flat btn-danger',
					'cancelButtonClass': 'btn btn-flat btn-primary',

					'confirm': function() {
						template
						.destroyRecord()
						.then(function() {
							self.sendAction('controller-action', 'display-status-message', {
								'type': 'success',
								'message': 'Template deleted succesfully'
							});
						})
						.catch(function(err) {
							self.sendAction('controller-action', 'display-status-message', {
								'type': 'danger',
								'message': err.message
							});
						});
					},

					'cancel': function() {
					}
				});
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

					'schema': self.get('model').get('parsedConfigurationSchema'),
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
			}
		});

		exports['default'] = ModuleDetailsWidget;
	}
);
