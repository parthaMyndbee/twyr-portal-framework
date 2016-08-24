define(
	'twyr-webapp/components/media-default-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-default-widget');
		var MediaDefaultWidget = _baseWidget['default'].extend({
			'selectedMedia': null,
			'watchWidgetContainerResize': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				if(!self.get('watchWidgetContainerResize')) {
					self.set('watchWidgetContainerResize', new MutationObserver(self._equalizeHeights.bind(self)));
				}

				var watchElement = document.getElementById('div-media-default-widget-details-container'),
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

			'selected-media-changed': function(mediaId) {
				var self = this;
				if(self.get('selectedMedia') && (self.get('selectedMedia').get('id') == mediaId))
					return;

				var newSelectedMedia = self.get('store').peekRecord('media-default', mediaId);
				if(newSelectedMedia) {
					self.set('selectedMedia', newSelectedMedia);
					return;
				}

				self.get('store')
				.findRecord('media-default', mediaId)
				.then(function(media) {
					self.set('selectedMedia', media);
					return null;
				})
				.catch(function(err) {
					self.set('selectedMedia', null);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'change-folder': function(folderId) {
				this['selected-media-changed'](folderId);
			},

			'_equalizeHeights': function(mutations) {
				window.$('div#div-media-default-widget-tree-container').css('min-height', window.$('div#div-media-default-widget-details-container').height());
			}
		});

		exports['default'] = MediaDefaultWidget;
	}
);
