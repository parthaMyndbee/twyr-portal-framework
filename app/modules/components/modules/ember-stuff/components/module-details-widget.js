define(
	'twyr-webapp/components/module-details-widget',
	['exports', 'ember', 'twyr-webapp/application'],
	function(exports, _ember, _app) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/module-details-widget');
		var ModuleDetailsWidget = _ember['default'].Component.extend({
			'_configurationEditor': null,
			'_switchery': null,

			'allUserTemplates': _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) }),
			'publicUserTemplates': _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) }),
			'registeredUserTemplates': _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) }),
			'administratorUserTemplates': _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) }),
			'superadministratorUserTemplates': _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) }),

			'currentlyEditingTemplate': null,

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

			'onModelTemplateRoleChanged': _ember['default'].observer('model.templates.@each.role', function() {
				var self = this;

				self.get('allUserTemplates').clear();
				self.get('publicUserTemplates').clear();
				self.get('registeredUserTemplates').clear();
				self.get('administratorUserTemplates').clear();
				self.get('superadministratorUserTemplates').clear();

				if(!self.get('model')) {
					return;
				}

				self.get('model').get('templates')
				.then(function(templates) {
					templates.forEach(function(template) {
						template.addObserver('isDefault', self, 'onModelTemplateDefaultChanged');
						self.get(template.get('role').replace('-', '') + 'UserTemplates').addObject(template);
					});

					self.get('allUserTemplates').sortBy('media');
					self.get('publicUserTemplates').sortBy('media');
					self.get('registeredUserTemplates').sortBy('media');
					self.get('administratorUserTemplates').sortBy('media');
					self.get('superadministratorUserTemplates').sortBy('media');
				})
				.catch(function(err) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			}),

			'onModelTemplateDefaultChanged': function(template) {
				if(!template.get('isDefault')) {
					template.save()
					.catch(function(err) {
						self.sendAction('controller-action', 'display-status-message', {
							'type': 'danger',
							'message': err.message
						});
					});

					return;
				}

				var self = this,
					otherTmpls = self.get(template.get('role').replace('-', '') + 'UserTemplates').filterBy('media', template.get('media'));

				otherTmpls.forEach(function(tmpl) {
					if(tmpl.get('id') == template.get('id'))
						return;

					tmpl.set('isDefault', false);
				});

				self.get('model').get('templates')
				.then(function(templates) {
					return templates.save();
				})
				.catch(function(err) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

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
