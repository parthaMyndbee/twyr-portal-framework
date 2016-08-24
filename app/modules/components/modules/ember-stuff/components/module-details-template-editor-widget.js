define(
	'twyr-webapp/components/module-details-template-editor-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/module-details-template-editor-widget');
		var ModuleDetailsTemplateEditorWidget = _baseWidget['default'].extend({
			'availableWidgetList': _ember['default'].ArrayProxy.create({ 'content': _ember['default'].A([]) }),

			'_previousContainerState': _ember['default'].ObjectProxy.create({ 'content': _ember['default'].Object.create({}) }),
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

				_ember['default'].RSVP.allSettled([
					_ember['default'].$.ajax({
						'url': window.apiServer + 'modules/availableWidgets/' + self.get('model').get('id'),
						'dataType': 'json',
						'cache': false
					}),

					_ember['default'].$.ajax({
						'url': 'modules/template-design/' + self.get('model').get('id'),
						'dataType': 'html',
						'cache': false
					})
				])
				.then(function(data) {
					_ember['default'].$.each((data[0]).value, function(index, item) {
						self.get('availableWidgetList').addObject(item);
					});

					var mirrorContainer = self.$('div#module-details-template-editor-widget-configuration-editor-' + self.get('model').get('id') + '-div')[0],
						availableWidgetContainer = self.$('div#module-details-template-editor-widget-position-editor-available-widgets-' + self.get('model').get('id'))[0],
						templateContainer = self.$('div#module-details-template-editor-widget-position-editor-template-preview-' + self.get('model').get('id'))[0];

					window.$(templateContainer).html((data[1]).value);
					self.rerender();

					var dragulaContainers = window.$(templateContainer).find('div.dragula-container'),
						passedInContainers = [availableWidgetContainer];

					for(var idx=0; idx < dragulaContainers.length; idx++) {
						passedInContainers.push(dragulaContainers[idx]);
					}

					self.set('dragula', dragula(passedInContainers, {
						'copy': function(element, source) {
							return (source === availableWidgetContainer);
						},

						'accepts': function(element, target) {
							if(target === availableWidgetContainer)
								return false;

							if($(target).children('#' + $(element).attr('id')).length > 1)
								return false;

							return true;
						},

						'mirrorContainer': mirrorContainer,
						'revertOnSpill': true,
						'removeOnSpill': true
					}));

					self.get('dragula')
					.on('drop', function(element, target) {
						element = window.$(element);
						element.children('span').remove();

						element.removeClass('info-box');
						element.addClass('box box-solid box-primary');
						element.css('overflow', 'initial');

						var contentDiv = window.$(element.children('div.info-box-content'));
						contentDiv.removeClass('info-box-content');
						contentDiv.addClass('box-header no-border');
						contentDiv.find('span.description').remove();

						self._updateWidgetPositions(element, target);
					})
					.on('over', function(element, container) {
						if(container === availableWidgetContainer)
							return;

						self.get('_previousContainerState').set(window.$(container).attr('id'), window.$(container).html());
					})
					.on('remove', function(element, container, source) {
						self._updateWidgetPositions(element, source);
					});
				})
				.catch(function(err) {
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

			'_updateWidgetPositions': function(element, container) {
				var self = this,
					widgets = [];

				window.$.each(window.$(container).children('div.box-primary'), function(index, widget) {
					widgets.push(window.$(widget).attr('id'));
				});

				_ember['default'].$.ajax({
					'type': 'PATCH',
					'url': window.apiServer + 'modules/templatePositionModuleWidgets',

					'dataType': 'json',
					'data': {
						'position': window.$(container).attr('id'),
						'widgets': widgets
					}
				})
				.fail(function(err) {
					$(container).html(self.get('_previousContainerState').get(window.$(container).attr('id')));
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				})
				.always(function() {
					self.get('_previousContainerState').set(window.$(container).attr('id'), undefined);
				});
			}
		});

		exports['default'] = ModuleDetailsTemplateEditorWidget;
	}
);
