define(
	'twyr-webapp/components/module-details-template-editor-widget',
	['exports', 'ember', 'twyr-webapp/application'],
	function(exports, _ember, _app) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/module-details-template-editor-widget');
		var ModuleDetailsTemplateEditorWidget = _ember['default'].Component.extend({
			'availableWidgetList': _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) }),

			'_configurationEditor': null,
			'_dragula': null,

			'onModelChanged': _ember['default'].observer('model', function() {
				var self = this;

				self._uninitJSONEditor();
				self._uninitDragula();

				if(!self.get('model')) {
					return;
				}

				_ember['default'].run.scheduleOnce('afterRender', function() {
					self._initJSONEditor();
					self._initDragula();

					if(!self.$('li.module-details-template-editor-widget-tab a').length)
						return;

					(self.$('li.module-details-template-editor-widget-tab a')[0]).click();
				});
			}),

			'_initJSONEditor': function() {
				var self = this;
				self._uninitJSONEditor();

				if(!self.get('model')) {
					return;
				}

				var configEditDiv = document.getElementById('module-details-template-editor-widget-div-configuration-editor-' + self.get('model').get('id'));
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

			'_initDragula': function() {
				var self = this;
				self._uninitDragula();

				if(!self.get('model')) {
					return;
				}

				_ember['default'].$.ajax({
					'url': window.apiServer + 'modules/availableWidgets/' + self.get('model').get('id'),
					'dataType': 'json',
					'cache': true
				})
				.done(function(data) {
					_ember['default'].$.each(data, function(index, item) {
						self.get('availableWidgetList').addObject(item);
					});

					var mirrorContainer = self.$('div#module-details-template-editor-widget-configuration-editor-' + self.get('model').get('id') + '-div')[0],
						availableWidgetContainer = self.$('div#module-details-template-editor-widget-position-editor-available-widgets-' + self.get('model').get('id'))[0],
						widgetContainer = self.$('div#module-details-template-editor-widget-position-editor-template-preview-' + self.get('model').get('id'))[0];

					self.set('dragula', dragula([availableWidgetContainer, widgetContainer], {
						'copy': function(element, source) {
							return (source === availableWidgetContainer);
						},

						'accepts': function(element, target) {
							return ((target !== availableWidgetContainer) && ($(target).children('#' + $(element).attr('id')).length <= 1));
						},

						'mirrorContainer': mirrorContainer,
						'revertOnSpill': true,
						'removeOnSpill': true
					}));
				})
				.fail(function() {
					console.error(window.apiServer + 'modules/availableWidgets error:\n', arguments);
				});
			},

			'_uninitJSONEditor': function() {
				var self = this;

				if(self.get('_configurationEditor')) {
					self.get('_configurationEditor').off('change', self._updateModuleConfiguration.bind(self));
					self.get('_configurationEditor').destroy();
				}
			},

			'_uninitDragula': function() {
				var self = this;

				if(self.get('_dragula')) {
					self.get('_dragula').destroy();
				}

				if(!self.get('model')) {
					return;
				}

				self.get('availableWidgetList').clear();
				self.$('div#module-details-template-editor-widget-position-editor-template-preview-' + self.get('model').get('id')).html('');
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

		exports['default'] = ModuleDetailsTemplateEditorWidget;
	}
);
